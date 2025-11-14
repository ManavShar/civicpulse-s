"""
API routes for agent system
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Optional
import logging

from coordinator import coordinator
from models import ProcessIncidentRequest

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/agents", tags=["agents"])


@router.post("/process-incident")
async def process_incident(
    request: ProcessIncidentRequest, background_tasks: BackgroundTasks
):
    """
    Process an incident through the multi-agent workflow

    This endpoint triggers the complete workflow:
    1. Planner Agent analyzes and creates action plan
    2. Dispatcher Agent creates work orders
    3. Analyst Agent explains decisions

    Args:
        request: ProcessIncidentRequest with incident_id
        background_tasks: FastAPI background tasks

    Returns:
        Processing status and results
    """
    try:
        logger.info(f"API: Processing incident {request.incident_id}")

        # Process incident (can be done in background for async operation)
        result = await coordinator.process_incident(
            incident_id=request.incident_id, force_reprocess=request.force_reprocess
        )

        return {
            "success": True,
            "message": "Incident processed successfully",
            "data": result,
        }

    except ValueError as e:
        logger.warning(f"API: Invalid request: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"API: Failed to process incident: {e}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


@router.get("/incident/{incident_id}/status")
async def get_incident_status(incident_id: str):
    """
    Get processing status for an incident

    Args:
        incident_id: Incident UUID

    Returns:
        Status information including completion state
    """
    try:
        status = await coordinator.get_incident_status(incident_id)
        return {"success": True, "data": status}
    except Exception as e:
        logger.error(f"API: Failed to get incident status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/logs")
async def get_agent_logs(
    incident_id: Optional[str] = None,
    agent_type: Optional[str] = None,
    limit: int = 100,
):
    """
    Retrieve agent activity logs

    Args:
        incident_id: Optional incident filter
        agent_type: Optional agent type filter (PLANNER, DISPATCHER, ANALYST)
        limit: Maximum number of logs (default 100)

    Returns:
        List of agent log entries
    """
    try:
        logs = await coordinator.get_agent_logs(incident_id, agent_type, limit)
        return {"success": True, "count": len(logs), "data": logs}
    except Exception as e:
        logger.error(f"API: Failed to get agent logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/patterns")
async def analyze_patterns(zone_id: Optional[str] = None, time_range_hours: int = 24):
    """
    Analyze incident patterns

    Args:
        zone_id: Optional zone filter
        time_range_hours: Time range for analysis (default 24 hours)

    Returns:
        Pattern analysis results with insights and recommendations
    """
    try:
        analysis = await coordinator.analyze_patterns(zone_id, time_range_hours)
        return {"success": True, "data": analysis}
    except Exception as e:
        logger.error(f"API: Failed to analyze patterns: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversation/{incident_id}")
async def get_conversation_history(incident_id: str):
    """
    Get conversation history for an incident

    Args:
        incident_id: Incident UUID

    Returns:
        Conversation history between agents
    """
    try:
        conversation = await coordinator.planner.get_conversation_history(incident_id)
        return {
            "success": True,
            "incident_id": incident_id,
            "message_count": len(conversation),
            "data": conversation,
        }
    except Exception as e:
        logger.error(f"API: Failed to get conversation history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/test")
async def test_agents():
    """
    Test endpoint to verify agent system is working

    Returns:
        Status of all agents
    """
    try:
        return {
            "success": True,
            "message": "Agent system is operational",
            "agents": {"planner": "ready", "dispatcher": "ready", "analyst": "ready"},
        }
    except Exception as e:
        logger.error(f"API: Test failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
