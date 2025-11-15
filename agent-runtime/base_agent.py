"""
Base agent architecture with common functionality
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import json
import logging
from datetime import datetime
import asyncio

from langchain_openai import ChatOpenAI

from config import settings
from database import db
from redis_client import redis_client
from models import AgentType, AgentResponse

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """
    Base class for all agents with common functionality

    Provides:
    - LLM integration with error handling and timeouts
    - Memory management using Redis
    - Reasoning log storage to database
    - Structured output parsing
    """

    def __init__(self, agent_type: AgentType):
        """
        Initialize base agent

        Args:
            agent_type: Type of agent (PLANNER, DISPATCHER, ANALYST)
        """
        self.agent_type = agent_type
        self.llm = self._initialize_llm()
        logger.info(f"Initialized {agent_type.value} agent")

    def _initialize_llm(self) -> ChatOpenAI:
        """
        Initialize LangChain LLM with configuration

        Returns:
            Configured ChatOpenAI instance
        """
        return ChatOpenAI(
            model=settings.openai_model,
            temperature=settings.openai_temperature,
            max_tokens=settings.openai_max_tokens,
            openai_api_key=settings.openai_api_key,
            request_timeout=settings.agent_timeout,
        )

    async def log_reasoning(
        self,
        step: str,
        data: Dict[str, Any],
        incident_id: Optional[str] = None,
        work_order_id: Optional[str] = None,
    ) -> int:
        """
        Log agent reasoning to database for explainability

        Args:
            step: Current step in agent workflow
            data: Reasoning data to log
            incident_id: Optional incident ID reference
            work_order_id: Optional work order ID reference

        Returns:
            ID of created log entry
        """
        try:
            log_id = await db.log_agent_activity(
                agent_type=self.agent_type.value,
                step=step,
                data=data,
                incident_id=incident_id,
                work_order_id=work_order_id,
            )
            logger.debug(f"{self.agent_type.value} logged reasoning: {step}")
            return log_id
        except Exception as e:
            logger.error(f"Failed to log reasoning: {e}")
            raise

    async def store_memory(
        self,
        incident_id: str,
        key: str,
        value: Dict[str, Any],
        ttl: Optional[int] = None,
    ) -> bool:
        """
        Store data in agent memory (Redis)

        Args:
            incident_id: Incident ID for memory scoping
            key: Memory key
            value: Data to store
            ttl: Optional TTL override

        Returns:
            True if successful
        """
        memory_key = await redis_client.get_agent_memory_key(
            self.agent_type.value, incident_id
        )
        full_key = f"{memory_key}:{key}"

        return await redis_client.set_memory(full_key, value, ttl)

    async def get_memory(self, incident_id: str, key: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve data from agent memory

        Args:
            incident_id: Incident ID for memory scoping
            key: Memory key

        Returns:
            Stored data or None
        """
        memory_key = await redis_client.get_agent_memory_key(
            self.agent_type.value, incident_id
        )
        full_key = f"{memory_key}:{key}"

        return await redis_client.get_memory(full_key)

    async def add_to_conversation(
        self, incident_id: str, message: Dict[str, Any]
    ) -> bool:
        """
        Add message to conversation history

        Args:
            incident_id: Incident ID
            message: Message data

        Returns:
            True if successful
        """
        conversation_key = await redis_client.get_conversation_key(incident_id)
        return await redis_client.append_to_list(conversation_key, message)

    async def get_conversation_history(self, incident_id: str) -> list:
        """
        Get conversation history for incident

        Args:
            incident_id: Incident ID

        Returns:
            List of conversation messages
        """
        conversation_key = await redis_client.get_conversation_key(incident_id)
        return await redis_client.get_list(conversation_key)

    async def call_llm_with_retry(
        self, messages: list, max_retries: Optional[int] = None
    ) -> str:
        """
        Call LLM with retry logic and timeout handling

        Args:
            messages: List of messages for LLM
            max_retries: Maximum retry attempts

        Returns:
            LLM response text

        Raises:
            Exception if all retries fail
        """
        max_retries = max_retries or settings.agent_max_retries
        last_error = None

        for attempt in range(max_retries):
            try:
                # Call LLM with timeout
                response = await asyncio.wait_for(
                    self.llm.agenerate([messages]), timeout=settings.agent_timeout
                )

                result = response.generations[0][0].text
                logger.debug(
                    f"{self.agent_type.value} LLM call successful (attempt {attempt + 1})"
                )
                return result

            except asyncio.TimeoutError:
                last_error = f"LLM call timed out after {settings.agent_timeout}s"
                logger.warning(
                    f"{self.agent_type.value} {last_error} (attempt {attempt + 1}/{max_retries})"
                )

            except Exception as e:
                last_error = str(e)
                logger.warning(
                    f"{self.agent_type.value} LLM call failed: {e} (attempt {attempt + 1}/{max_retries})"
                )

            # Wait before retry (exponential backoff)
            if attempt < max_retries - 1:
                await asyncio.sleep(2**attempt)

        # All retries failed
        error_msg = f"LLM call failed after {max_retries} attempts: {last_error}"
        logger.error(f"{self.agent_type.value} {error_msg}")
        raise Exception(error_msg)

    def parse_json_response(self, response: str) -> Dict[str, Any]:
        """
        Parse JSON response from LLM with error handling

        Args:
            response: LLM response text

        Returns:
            Parsed JSON data

        Raises:
            ValueError if parsing fails
        """
        try:
            # Try to extract JSON from markdown code blocks
            if "```json" in response:
                start = response.find("```json") + 7
                end = response.find("```", start)
                response = response[start:end].strip()
            elif "```" in response:
                start = response.find("```") + 3
                end = response.find("```", start)
                response = response[start:end].strip()

            # Parse JSON
            data = json.loads(response)
            logger.debug(f"{self.agent_type.value} successfully parsed JSON response")
            return data

        except json.JSONDecodeError as e:
            logger.error(f"{self.agent_type.value} failed to parse JSON: {e}")
            logger.error(f"Response was: {response}")
            raise ValueError(f"Invalid JSON response from LLM: {e}")

    @abstractmethod
    async def process(self, input_data: Dict[str, Any]) -> AgentResponse:
        """
        Main processing method - must be implemented by subclasses

        Args:
            input_data: Input data for agent processing

        Returns:
            AgentResponse with results
        """
        pass

    async def _create_response(
        self, success: bool, data: Dict[str, Any], error: Optional[str] = None
    ) -> AgentResponse:
        """
        Create standardized agent response

        Args:
            success: Whether operation was successful
            data: Response data
            error: Optional error message

        Returns:
            AgentResponse object
        """
        return AgentResponse(
            agent_type=self.agent_type,
            success=success,
            data=data,
            error=error,
            timestamp=datetime.now(),
        )
