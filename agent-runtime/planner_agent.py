"""
Planner Agent - Analyzes incidents and generates action plans
"""

from typing import Dict, Any, Optional
import logging
import json


from base_agent import BaseAgent
from models import AgentType, AgentResponse, ActionPlan
from prompts import get_planner_prompt
from database import db

logger = logging.getLogger(__name__)


class PlannerAgent(BaseAgent):
    """
    Planner Agent analyzes city situations and generates action plans

    Responsibilities:
    - Analyze incident reports and sensor data
    - Assess situation and potential impacts
    - Generate structured action plans
    - Prioritize actions based on urgency and resources
    """

    def __init__(self):
        super().__init__(AgentType.PLANNER)
        self.prompt_template = get_planner_prompt()

    async def analyze_incident(self, incident_id: str) -> ActionPlan:
        """
        Analyze an incident and generate an action plan

        Args:
            incident_id: Incident UUID

        Returns:
            ActionPlan object with recommendations

        Raises:
            Exception if analysis fails
        """
        logger.info(f"Planner analyzing incident: {incident_id}")

        # Log start of analysis
        await self.log_reasoning(
            step="ANALYSIS_START",
            data={"incident_id": incident_id},
            incident_id=incident_id,
        )

        try:
            # Gather context
            context = await self._gather_context(incident_id)

            # Log context gathering
            await self.log_reasoning(
                step="CONTEXT_GATHERED",
                data={"context_summary": self._summarize_context(context)},
                incident_id=incident_id,
            )

            # Get incident details
            incident = await db.get_incident_context(incident_id)
            if not incident:
                raise ValueError(f"Incident {incident_id} not found")

            # Format prompt
            messages = self.prompt_template.format_messages(
                incident_data=json.dumps(incident, default=str),
                context=json.dumps(context, default=str),
            )

            # Call LLM
            response = await self.call_llm_with_retry(messages)

            # Parse response
            plan_data = self.parse_json_response(response)

            # Validate and create ActionPlan
            action_plan = ActionPlan(**plan_data)

            # Store in memory
            await self.store_memory(
                incident_id=incident_id, key="action_plan", value=action_plan.dict()
            )

            # Log successful planning
            await self.log_reasoning(
                step="PLAN_CREATED",
                data={"action_plan": action_plan.dict(), "incident_id": incident_id},
                incident_id=incident_id,
            )

            # Add to conversation history
            await self.add_to_conversation(
                incident_id=incident_id,
                message={
                    "agent": "PLANNER",
                    "action": "created_plan",
                    "summary": action_plan.situation_summary,
                    "priority": action_plan.priority.value,
                },
            )

            logger.info(
                f"Planner created action plan for incident {incident_id} with priority {action_plan.priority}"
            )
            return action_plan

        except Exception as e:
            logger.error(f"Planner failed to analyze incident {incident_id}: {e}")

            # Log failure
            await self.log_reasoning(
                step="ANALYSIS_FAILED",
                data={"error": str(e), "incident_id": incident_id},
                incident_id=incident_id,
            )

            raise

    async def _gather_context(self, incident_id: str) -> Dict[str, Any]:
        """
        Gather relevant context for planning

        Args:
            incident_id: Incident UUID

        Returns:
            Dictionary with context data
        """
        logger.debug(f"Gathering context for incident {incident_id}")

        # Get incident details
        incident = await db.get_incident_context(incident_id)
        if not incident:
            return {}

        zone_id = incident.get("zone_id")

        # Gather context in parallel
        context = {}

        # Recent incidents in same zone
        if zone_id:
            recent_incidents = await db.get_recent_incidents(zone_id=zone_id, limit=5)
            context["recent_incidents"] = [
                {
                    "type": inc["type"],
                    "severity": inc["severity"],
                    "status": inc["status"],
                    "detected_at": str(inc["detected_at"]),
                }
                for inc in recent_incidents
            ]
        else:
            context["recent_incidents"] = []

        # Available units (simulated for demo)
        context["available_units"] = self._get_simulated_units(zone_id)

        # Weather data (simulated for demo)
        context["weather"] = {"condition": "clear", "temperature": 72, "wind_speed": 5}

        # Historical patterns (simulated for demo)
        incident_type = incident.get("type", "UNKNOWN")
        context["historical_patterns"] = {
            "incident_type": incident_type,
            "average_resolution_time": self._get_avg_resolution_time(incident_type),
            "common_causes": self._get_common_causes(incident_type),
        }

        return context

    def _summarize_context(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a summary of context for logging

        Args:
            context: Full context data

        Returns:
            Summarized context
        """
        return {
            "recent_incidents_count": len(context.get("recent_incidents", [])),
            "available_units_count": len(context.get("available_units", [])),
            "weather": context.get("weather", {}).get("condition"),
            "incident_type": context.get("historical_patterns", {}).get(
                "incident_type"
            ),
        }

    def _get_simulated_units(self, zone_id: Optional[str]) -> list:
        """
        Get simulated available units for demo

        Args:
            zone_id: Zone ID

        Returns:
            List of available units
        """
        return [
            {
                "unit_id": "UNIT-001",
                "type": "maintenance",
                "status": "available",
                "location": "nearby",
            },
            {
                "unit_id": "UNIT-002",
                "type": "emergency",
                "status": "available",
                "location": "nearby",
            },
            {
                "unit_id": "UNIT-003",
                "type": "inspection",
                "status": "available",
                "location": "nearby",
            },
        ]

    def _get_avg_resolution_time(self, incident_type: str) -> int:
        """
        Get average resolution time for incident type (simulated)

        Args:
            incident_type: Type of incident

        Returns:
            Average resolution time in minutes
        """
        resolution_times = {
            "WASTE_OVERFLOW": 30,
            "LIGHTING_FAILURE": 45,
            "WATER_ANOMALY": 60,
            "TRAFFIC_CONGESTION": 90,
            "ENVIRONMENTAL_HAZARD": 120,
            "NOISE_COMPLAINT": 20,
        }
        return resolution_times.get(incident_type, 60)

    def _get_common_causes(self, incident_type: str) -> list:
        """
        Get common causes for incident type (simulated)

        Args:
            incident_type: Type of incident

        Returns:
            List of common causes
        """
        causes = {
            "WASTE_OVERFLOW": ["Missed collection", "Overuse", "Equipment failure"],
            "LIGHTING_FAILURE": ["Bulb burnout", "Power issue", "Vandalism"],
            "WATER_ANOMALY": ["Pipe leak", "Pressure issue", "Contamination"],
            "TRAFFIC_CONGESTION": ["Accident", "Construction", "Event"],
            "ENVIRONMENTAL_HAZARD": ["Spill", "Air quality", "Weather"],
            "NOISE_COMPLAINT": ["Construction", "Event", "Equipment"],
        }
        return causes.get(incident_type, ["Unknown"])

    async def process(self, input_data: Dict[str, Any]) -> AgentResponse:
        """
        Process incident and generate action plan

        Args:
            input_data: Must contain 'incident_id'

        Returns:
            AgentResponse with action plan
        """
        try:
            incident_id = input_data.get("incident_id")
            if not incident_id:
                raise ValueError("incident_id is required")

            action_plan = await self.analyze_incident(incident_id)

            return await self._create_response(success=True, data=action_plan.dict())

        except Exception as e:
            logger.error(f"Planner process failed: {e}")
            return await self._create_response(success=False, data={}, error=str(e))
