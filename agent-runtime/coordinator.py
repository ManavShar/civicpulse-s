"""
Agent Coordinator - Manages multi-agent workflow
"""

from typing import Dict, Any, Optional
import logging

from planner_agent import PlannerAgent
from dispatcher_agent import DispatcherAgent
from analyst_agent import AnalystAgent
from redis_client import redis_client
from database import db

logger = logging.getLogger(__name__)


class AgentCoordinator:
    """
    Coordinates the multi-agent workflow for incident processing

    Workflow:
    1. Planner Agent analyzes incident and creates action plan
    2. Dispatcher Agent creates work orders and assigns units
    3. Analyst Agent explains the decisions

    All steps communicate via Redis pub/sub for real-time updates
    """

    def __init__(self):
        """Initialize coordinator with all three agents"""
        self.planner = PlannerAgent()
        self.dispatcher = DispatcherAgent()
        self.analyst = AnalystAgent()
        logger.info("Agent Coordinator initialized")

    async def process_incident(
        self, incident_id: str, force_reprocess: bool = False
    ) -> Dict[str, Any]:
        """
        Process an incident through the complete agent workflow

        Args:
            incident_id: Incident UUID
            force_reprocess: Force reprocessing even if already processed

        Returns:
            Dictionary with results from all agents

        Raises:
            Exception if processing fails
        """
        logger.info(f"Coordinator processing incident: {incident_id}")

        try:
            # Check if already processed (unless force_reprocess)
            if not force_reprocess:
                existing_plan = await self.planner.get_memory(
                    incident_id, "action_plan"
                )
                if existing_plan:
                    logger.info(f"Incident {incident_id} already processed, skipping")
                    return {
                        "incident_id": incident_id,
                        "status": "already_processed",
                        "message": "Incident has already been processed",
                    }

            # Publish start event
            await redis_client.publish(
                "agent:workflow",
                {"event": "workflow_started", "incident_id": incident_id},
            )

            # Step 1: Planner analyzes and creates plan
            logger.info(f"Step 1: Planner analyzing incident {incident_id}")
            action_plan = await self.planner.analyze_incident(incident_id)

            # Publish plan created event
            await redis_client.publish(
                "agent:plan_created",
                {
                    "incident_id": incident_id,
                    "action_plan": action_plan.dict(),
                    "priority": action_plan.priority.value,
                },
            )

            # Step 2: Dispatcher creates work orders
            logger.info(
                f"Step 2: Dispatcher creating work orders for incident {incident_id}"
            )
            dispatch_result = await self.dispatcher.dispatch(incident_id, action_plan)

            # Publish dispatch event
            await redis_client.publish(
                "agent:dispatched",
                {
                    "incident_id": incident_id,
                    "dispatch_result": dispatch_result.dict(),
                    "work_orders_count": len(dispatch_result.work_orders),
                },
            )

            # Step 3: Analyst explains the decisions
            logger.info(
                f"Step 3: Analyst explaining decisions for incident {incident_id}"
            )
            explanation = await self.analyst.explain_decision(
                incident_id, action_plan, dispatch_result
            )

            # Publish explanation event
            await redis_client.publish(
                "agent:explained",
                {
                    "incident_id": incident_id,
                    "explanation": explanation.dict(),
                    "confidence": explanation.confidence,
                },
            )

            # Compile results
            result = {
                "incident_id": incident_id,
                "status": "completed",
                "action_plan": action_plan.dict(),
                "dispatch_result": dispatch_result.dict(),
                "explanation": explanation.dict(),
                "workflow_completed": True,
            }

            # Publish completion event
            await redis_client.publish(
                "agent:workflow",
                {
                    "event": "workflow_completed",
                    "incident_id": incident_id,
                    "success": True,
                },
            )

            logger.info(f"Coordinator completed processing incident {incident_id}")
            return result

        except Exception as e:
            logger.error(f"Coordinator failed to process incident {incident_id}: {e}")

            # Publish failure event
            await redis_client.publish(
                "agent:workflow",
                {
                    "event": "workflow_failed",
                    "incident_id": incident_id,
                    "error": str(e),
                },
            )

            raise

    async def get_incident_status(self, incident_id: str) -> Dict[str, Any]:
        """
        Get processing status for an incident

        Args:
            incident_id: Incident UUID

        Returns:
            Status information
        """
        try:
            # Check memory for each agent's output
            action_plan = await self.planner.get_memory(incident_id, "action_plan")
            dispatch_result = await self.dispatcher.get_memory(
                incident_id, "dispatch_result"
            )
            explanation = await self.analyst.get_memory(incident_id, "explanation")

            # Get conversation history
            conversation = await self.planner.get_conversation_history(incident_id)

            return {
                "incident_id": incident_id,
                "has_action_plan": action_plan is not None,
                "has_dispatch_result": dispatch_result is not None,
                "has_explanation": explanation is not None,
                "conversation_length": len(conversation),
                "completed": all([action_plan, dispatch_result, explanation]),
            }

        except Exception as e:
            logger.error(f"Failed to get incident status: {e}")
            return {"incident_id": incident_id, "error": str(e)}

    async def analyze_patterns(
        self, zone_id: Optional[str] = None, time_range_hours: int = 24
    ) -> Dict[str, Any]:
        """
        Analyze incident patterns using Analyst Agent

        Args:
            zone_id: Optional zone filter
            time_range_hours: Time range for analysis

        Returns:
            Pattern analysis results
        """
        try:
            return await self.analyst.analyze_patterns(zone_id, time_range_hours)
        except Exception as e:
            logger.error(f"Failed to analyze patterns: {e}")
            raise

    async def get_agent_logs(
        self,
        incident_id: Optional[str] = None,
        agent_type: Optional[str] = None,
        limit: int = 100,
    ) -> list:
        """
        Retrieve agent logs

        Args:
            incident_id: Optional incident filter
            agent_type: Optional agent type filter
            limit: Maximum number of logs

        Returns:
            List of agent log entries
        """
        try:
            return await db.get_agent_logs(agent_type, incident_id, limit)
        except Exception as e:
            logger.error(f"Failed to get agent logs: {e}")
            raise

    async def close(self):
        """Clean up resources"""
        await self.dispatcher.close()
        logger.info("Agent Coordinator closed")


# Global coordinator instance
coordinator = AgentCoordinator()
