"""
Analyst Agent - Provides explainability and insights about system decisions
"""

from typing import Dict, Any, List, Optional
import logging
import json


from base_agent import BaseAgent
from models import AgentType, AgentResponse, ActionPlan, DispatchResult, Explanation
from prompts import get_analyst_prompt
from database import db

logger = logging.getLogger(__name__)


class AnalystAgent(BaseAgent):
    """
    Analyst Agent provides explainability and insights

    Responsibilities:
    - Explain system decisions in clear, human-readable language
    - Provide insights about incident patterns
    - Summarize agent activities
    - Generate reports for operators
    """

    def __init__(self):
        super().__init__(AgentType.ANALYST)
        self.prompt_template = get_analyst_prompt()

    async def explain_decision(
        self, incident_id: str, action_plan: ActionPlan, dispatch_result: DispatchResult
    ) -> Explanation:
        """
        Generate human-readable explanation of agent decisions

        Args:
            incident_id: Incident UUID
            action_plan: Action plan from Planner
            dispatch_result: Dispatch result from Dispatcher

        Returns:
            Explanation object with insights

        Raises:
            Exception if explanation generation fails
        """
        logger.info(f"Analyst explaining decisions for incident: {incident_id}")

        # Log start of analysis
        await self.log_reasoning(
            step="EXPLANATION_START",
            data={"incident_id": incident_id},
            incident_id=incident_id,
        )

        try:
            # Get incident details
            incident = await db.get_incident_context(incident_id)
            if not incident:
                raise ValueError(f"Incident {incident_id} not found")

            # Format prompt
            messages = self.prompt_template.format_messages(
                incident_data=json.dumps(incident, default=str),
                action_plan=json.dumps(action_plan.dict(), default=str),
                dispatch_result=json.dumps(dispatch_result.dict(), default=str),
            )

            # Call LLM
            response = await self.call_llm_with_retry(messages)

            # Parse response
            explanation_data = self.parse_json_response(response)

            # Validate and create Explanation
            explanation = Explanation(**explanation_data)

            # Store in memory
            await self.store_memory(
                incident_id=incident_id, key="explanation", value=explanation.dict()
            )

            # Log successful explanation
            await self.log_reasoning(
                step="EXPLANATION_CREATED",
                data={"explanation": explanation.dict(), "incident_id": incident_id},
                incident_id=incident_id,
            )

            # Add to conversation history
            await self.add_to_conversation(
                incident_id=incident_id,
                message={
                    "agent": "ANALYST",
                    "action": "explained_decision",
                    "confidence": explanation.confidence,
                    "key_factors_count": len(explanation.key_factors),
                },
            )

            logger.info(
                f"Analyst created explanation for incident {incident_id} (confidence: {explanation.confidence})"
            )
            return explanation

        except Exception as e:
            logger.error(f"Analyst failed to explain incident {incident_id}: {e}")

            # Log failure
            await self.log_reasoning(
                step="EXPLANATION_FAILED",
                data={"error": str(e), "incident_id": incident_id},
                incident_id=incident_id,
            )

            raise

    async def analyze_patterns(
        self, zone_id: Optional[str] = None, time_range_hours: int = 24
    ) -> Dict[str, Any]:
        """
        Analyze incident patterns over time

        Args:
            zone_id: Optional zone filter
            time_range_hours: Time range for analysis

        Returns:
            Pattern analysis results
        """
        logger.info(
            f"Analyst analyzing patterns (zone: {zone_id}, hours: {time_range_hours})"
        )

        try:
            # Get recent incidents
            incidents = await db.get_recent_incidents(zone_id=zone_id, limit=50)

            if not incidents:
                return {
                    "patterns": [],
                    "insights": "Insufficient data for pattern analysis",
                    "recommendations": [],
                }

            # Analyze patterns
            patterns = self._identify_patterns(incidents)

            # Generate insights
            insights = self._generate_insights(patterns)

            # Create recommendations
            recommendations = self._create_recommendations(patterns)

            result = {
                "patterns": patterns,
                "insights": insights,
                "recommendations": recommendations,
                "incidents_analyzed": len(incidents),
                "time_range_hours": time_range_hours,
            }

            # Log pattern analysis
            await self.log_reasoning(step="PATTERN_ANALYSIS", data=result)

            logger.info(f"Analyst identified {len(patterns)} patterns")
            return result

        except Exception as e:
            logger.error(f"Analyst failed to analyze patterns: {e}")
            raise

    def _identify_patterns(
        self, incidents: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Identify patterns in incident data

        Args:
            incidents: List of incidents

        Returns:
            List of identified patterns
        """
        patterns = []

        # Count by type
        type_counts = {}
        for incident in incidents:
            incident_type = incident.get("type", "UNKNOWN")
            type_counts[incident_type] = type_counts.get(incident_type, 0) + 1

        # Identify most common types
        if type_counts:
            most_common = max(type_counts.items(), key=lambda x: x[1])
            patterns.append(
                {
                    "type": "incident_frequency",
                    "description": f"Most common incident type: {most_common[0]}",
                    "count": most_common[1],
                    "percentage": (most_common[1] / len(incidents)) * 100,
                }
            )

        # Count by severity
        severity_counts = {}
        for incident in incidents:
            severity = incident.get("severity", "UNKNOWN")
            severity_counts[severity] = severity_counts.get(severity, 0) + 1

        if severity_counts:
            critical_count = severity_counts.get("CRITICAL", 0) + severity_counts.get(
                "HIGH", 0
            )
            if critical_count > len(incidents) * 0.3:  # More than 30% high priority
                patterns.append(
                    {
                        "type": "high_severity_trend",
                        "description": "High proportion of critical/high severity incidents",
                        "count": critical_count,
                        "percentage": (critical_count / len(incidents)) * 100,
                    }
                )

        # Zone clustering (if zone data available)
        zone_counts = {}
        for incident in incidents:
            zone_id = incident.get("zone_id")
            if zone_id:
                zone_counts[zone_id] = zone_counts.get(zone_id, 0) + 1

        if zone_counts:
            hotspot = max(zone_counts.items(), key=lambda x: x[1])
            if hotspot[1] > len(incidents) * 0.4:  # More than 40% in one zone
                patterns.append(
                    {
                        "type": "geographic_hotspot",
                        "description": f"Incident hotspot detected in zone {hotspot[0]}",
                        "zone_id": hotspot[0],
                        "count": hotspot[1],
                        "percentage": (hotspot[1] / len(incidents)) * 100,
                    }
                )

        return patterns

    def _generate_insights(self, patterns: List[Dict[str, Any]]) -> str:
        """
        Generate insights from patterns

        Args:
            patterns: Identified patterns

        Returns:
            Insights text
        """
        if not patterns:
            return "No significant patterns detected in recent incidents."

        insights = []

        for pattern in patterns:
            if pattern["type"] == "incident_frequency":
                insights.append(
                    f"The most frequent incident type accounts for {pattern['percentage']:.1f}% of all incidents, "
                    f"suggesting a systematic issue that may benefit from preventive measures."
                )
            elif pattern["type"] == "high_severity_trend":
                insights.append(
                    f"A concerning {pattern['percentage']:.1f}% of incidents are high or critical severity, "
                    f"indicating potential infrastructure stress or inadequate preventive maintenance."
                )
            elif pattern["type"] == "geographic_hotspot":
                insights.append(
                    f"A geographic hotspot has been identified with {pattern['percentage']:.1f}% of incidents "
                    f"concentrated in one zone, suggesting localized infrastructure issues."
                )

        return " ".join(insights)

    def _create_recommendations(self, patterns: List[Dict[str, Any]]) -> List[str]:
        """
        Create recommendations based on patterns

        Args:
            patterns: Identified patterns

        Returns:
            List of recommendations
        """
        recommendations = []

        for pattern in patterns:
            if pattern["type"] == "incident_frequency":
                recommendations.append(
                    "Consider implementing preventive maintenance program for the most common incident type"
                )
            elif pattern["type"] == "high_severity_trend":
                recommendations.append(
                    "Increase monitoring frequency and allocate additional resources for high-priority areas"
                )
                recommendations.append(
                    "Review and update incident response protocols to reduce escalation"
                )
            elif pattern["type"] == "geographic_hotspot":
                recommendations.append(
                    "Conduct comprehensive infrastructure assessment in hotspot zone"
                )
                recommendations.append(
                    "Deploy additional sensors or monitoring equipment in affected area"
                )

        if not recommendations:
            recommendations.append("Continue monitoring for emerging patterns")

        return recommendations

    async def process(self, input_data: Dict[str, Any]) -> AgentResponse:
        """
        Process explanation request or pattern analysis

        Args:
            input_data: Must contain either:
                - 'incident_id', 'action_plan', 'dispatch_result' for explanation
                - 'analyze_patterns' flag for pattern analysis

        Returns:
            AgentResponse with explanation or analysis
        """
        try:
            # Check if this is a pattern analysis request
            if input_data.get("analyze_patterns"):
                zone_id = input_data.get("zone_id")
                time_range_hours = input_data.get("time_range_hours", 24)

                analysis = await self.analyze_patterns(zone_id, time_range_hours)

                return await self._create_response(success=True, data=analysis)

            # Otherwise, it's an explanation request
            incident_id = input_data.get("incident_id")
            action_plan_data = input_data.get("action_plan")
            dispatch_result_data = input_data.get("dispatch_result")

            if not all([incident_id, action_plan_data, dispatch_result_data]):
                raise ValueError(
                    "incident_id, action_plan, and dispatch_result are required"
                )

            # Convert dicts to objects
            action_plan = ActionPlan(**action_plan_data)
            dispatch_result = DispatchResult(**dispatch_result_data)

            explanation = await self.explain_decision(
                incident_id, action_plan, dispatch_result
            )

            return await self._create_response(success=True, data=explanation.dict())

        except Exception as e:
            logger.error(f"Analyst process failed: {e}")
            return await self._create_response(success=False, data={}, error=str(e))
