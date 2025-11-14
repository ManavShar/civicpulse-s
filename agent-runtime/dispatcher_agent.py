"""
Dispatcher Agent - Creates work orders and assigns tasks to field units
"""

from typing import Dict, Any, List
import logging
import json
import math
import httpx


from base_agent import BaseAgent
from models import (
    AgentType,
    AgentResponse,
    ActionPlan,
    DispatchResult,
    WorkOrderRequest,
)
from prompts import get_dispatcher_prompt
from database import db
from config import settings

logger = logging.getLogger(__name__)


class DispatcherAgent(BaseAgent):
    """
    Dispatcher Agent assigns tasks to field units and creates work orders

    Responsibilities:
    - Review action plans from Planner Agent
    - Assign tasks to appropriate field units
    - Create detailed work orders
    - Optimize resource allocation
    """

    def __init__(self):
        super().__init__(AgentType.DISPATCHER)
        self.prompt_template = get_dispatcher_prompt()
        self.http_client = httpx.AsyncClient(timeout=10.0)

    async def dispatch(
        self, incident_id: str, action_plan: ActionPlan
    ) -> DispatchResult:
        """
        Create work orders and assign units based on action plan

        Args:
            incident_id: Incident UUID
            action_plan: Action plan from Planner Agent

        Returns:
            DispatchResult with assignments and work orders

        Raises:
            Exception if dispatch fails
        """
        logger.info(f"Dispatcher processing incident: {incident_id}")

        # Log start of dispatch
        await self.log_reasoning(
            step="DISPATCH_START",
            data={
                "incident_id": incident_id,
                "action_plan_priority": action_plan.priority.value,
            },
            incident_id=incident_id,
        )

        try:
            # Get incident details
            incident = await db.get_incident_context(incident_id)
            if not incident:
                raise ValueError(f"Incident {incident_id} not found")

            # Find available units
            available_units = await self._find_available_units(incident)

            # Log available units
            await self.log_reasoning(
                step="UNITS_FOUND",
                data={"available_units_count": len(available_units)},
                incident_id=incident_id,
            )

            # Format prompt
            messages = self.prompt_template.format_messages(
                action_plan=json.dumps(action_plan.dict(), default=str),
                available_units=json.dumps(available_units, default=str),
                incident_location=json.dumps(
                    {"type": "Point", "coordinates": incident.get("location", {})},
                    default=str,
                ),
            )

            # Call LLM
            response = await self.call_llm_with_retry(messages)

            # Parse response
            dispatch_data = self.parse_json_response(response)

            # Validate and create DispatchResult
            dispatch_result = DispatchResult(**dispatch_data)

            # Create work orders in backend
            created_work_orders = await self._create_work_orders(
                incident_id=incident_id, work_orders=dispatch_result.work_orders
            )

            # Store in memory
            await self.store_memory(
                incident_id=incident_id,
                key="dispatch_result",
                value=dispatch_result.dict(),
            )

            # Log successful dispatch
            await self.log_reasoning(
                step="DISPATCH_COMPLETED",
                data={
                    "dispatch_result": dispatch_result.dict(),
                    "work_orders_created": len(created_work_orders),
                    "incident_id": incident_id,
                },
                incident_id=incident_id,
            )

            # Add to conversation history
            await self.add_to_conversation(
                incident_id=incident_id,
                message={
                    "agent": "DISPATCHER",
                    "action": "dispatched_units",
                    "units_assigned": len(dispatch_result.assignments),
                    "work_orders_created": len(created_work_orders),
                },
            )

            logger.info(
                f"Dispatcher created {len(created_work_orders)} work orders for incident {incident_id}"
            )
            return dispatch_result

        except Exception as e:
            logger.error(f"Dispatcher failed to process incident {incident_id}: {e}")

            # Log failure
            await self.log_reasoning(
                step="DISPATCH_FAILED",
                data={"error": str(e), "incident_id": incident_id},
                incident_id=incident_id,
            )

            raise

    async def _find_available_units(
        self, incident: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Find available units near the incident

        Args:
            incident: Incident data

        Returns:
            List of available units with proximity info
        """
        logger.debug("Finding available units")

        # Get incident location
        incident_location = incident.get("location")
        if not incident_location:
            # Return simulated units without location data
            return self._get_simulated_units()

        # Simulated units with proximity calculation
        units = self._get_simulated_units()

        # Calculate proximity for each unit (simulated)
        for unit in units:
            unit["distance_meters"] = self._calculate_distance(
                incident_location, unit.get("location", incident_location)
            )
            unit["estimated_arrival_minutes"] = self._estimate_travel_time(
                unit["distance_meters"]
            )

        # Sort by distance
        units.sort(key=lambda u: u.get("distance_meters", float("inf")))

        return units

    def _get_simulated_units(self) -> List[Dict[str, Any]]:
        """
        Get simulated field units for demo

        Returns:
            List of simulated units
        """
        return [
            {
                "unit_id": "UNIT-001",
                "unit_type": "maintenance",
                "status": "available",
                "capabilities": ["waste", "lighting", "general"],
                "location": {"type": "Point", "coordinates": [-122.4, 37.8]},
            },
            {
                "unit_id": "UNIT-002",
                "unit_type": "emergency",
                "status": "available",
                "capabilities": ["water", "environmental", "emergency"],
                "location": {"type": "Point", "coordinates": [-122.41, 37.81]},
            },
            {
                "unit_id": "UNIT-003",
                "unit_type": "inspection",
                "status": "available",
                "capabilities": ["inspection", "monitoring", "assessment"],
                "location": {"type": "Point", "coordinates": [-122.39, 37.79]},
            },
            {
                "unit_id": "UNIT-004",
                "unit_type": "traffic",
                "status": "available",
                "capabilities": ["traffic", "signage", "road"],
                "location": {"type": "Point", "coordinates": [-122.42, 37.82]},
            },
        ]

    def _calculate_distance(
        self, location1: Dict[str, Any], location2: Dict[str, Any]
    ) -> float:
        """
        Calculate distance between two locations (simplified)

        Args:
            location1: First location (GeoJSON)
            location2: Second location (GeoJSON)

        Returns:
            Distance in meters
        """
        # Simplified distance calculation (Haversine would be more accurate)
        # For demo purposes, using simple Euclidean distance
        try:
            coords1 = location1.get("coordinates", [0, 0])
            coords2 = location2.get("coordinates", [0, 0])

            # Rough conversion: 1 degree ≈ 111km
            dx = (coords1[0] - coords2[0]) * 111000 * math.cos(math.radians(coords1[1]))
            dy = (coords1[1] - coords2[1]) * 111000

            distance = math.sqrt(dx**2 + dy**2)
            return distance
        except Exception as e:
            logger.warning(f"Failed to calculate distance: {e}")
            return 1000.0  # Default 1km

    def _estimate_travel_time(self, distance_meters: float) -> int:
        """
        Estimate travel time based on distance

        Args:
            distance_meters: Distance in meters

        Returns:
            Estimated time in minutes
        """
        # Assume average speed of 30 km/h in city
        speed_mps = 30000 / 60  # meters per minute
        travel_time = distance_meters / speed_mps
        return max(5, int(travel_time))  # Minimum 5 minutes

    async def _create_work_orders(
        self, incident_id: str, work_orders: List[WorkOrderRequest]
    ) -> List[Dict[str, Any]]:
        """
        Create work orders in backend system

        Args:
            incident_id: Incident UUID
            work_orders: List of work order requests

        Returns:
            List of created work orders
        """
        created_orders = []

        for wo in work_orders:
            try:
                # Call backend API to create work order
                response = await self.http_client.post(
                    f"{settings.backend_url}/api/v1/work-orders", json=wo.dict()
                )

                if response.status_code == 201:
                    created_order = response.json()
                    created_orders.append(created_order)
                    logger.debug(f"Created work order: {created_order.get('id')}")
                else:
                    logger.warning(
                        f"Failed to create work order: {response.status_code}"
                    )

            except Exception as e:
                logger.error(f"Error creating work order: {e}")
                # Continue with other work orders

        return created_orders

    async def process(self, input_data: Dict[str, Any]) -> AgentResponse:
        """
        Process action plan and create work orders

        Args:
            input_data: Must contain 'incident_id' and 'action_plan'

        Returns:
            AgentResponse with dispatch result
        """
        try:
            incident_id = input_data.get("incident_id")
            action_plan_data = input_data.get("action_plan")

            if not incident_id or not action_plan_data:
                raise ValueError("incident_id and action_plan are required")

            # Convert action_plan dict to ActionPlan object
            action_plan = ActionPlan(**action_plan_data)

            dispatch_result = await self.dispatch(incident_id, action_plan)

            return await self._create_response(
                success=True, data=dispatch_result.dict()
            )

        except Exception as e:
            logger.error(f"Dispatcher process failed: {e}")
            return await self._create_response(success=False, data={}, error=str(e))

    async def close(self):
        """Close HTTP client"""
        await self.http_client.aclose()
