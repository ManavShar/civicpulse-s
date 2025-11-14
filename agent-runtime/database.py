"""
Database connection and operations for agent logging
"""

from psycopg2.extras import RealDictCursor, Json
from psycopg2.pool import SimpleConnectionPool
from typing import Optional, Dict, Any, List
from datetime import datetime
import logging
from contextlib import contextmanager

from config import settings

logger = logging.getLogger(__name__)


class Database:
    """Database connection manager for agent logs"""

    def __init__(self):
        self.pool: Optional[SimpleConnectionPool] = None

    def connect(self):
        """Initialize database connection pool"""
        try:
            self.pool = SimpleConnectionPool(
                minconn=1, maxconn=10, dsn=settings.database_url
            )
            logger.info("Database connection pool initialized")
        except Exception as e:
            logger.error(f"Failed to initialize database pool: {e}")
            raise

    def close(self):
        """Close all database connections"""
        if self.pool:
            self.pool.closeall()
            logger.info("Database connection pool closed")

    @contextmanager
    def get_connection(self):
        """Context manager for database connections"""
        if not self.pool:
            raise RuntimeError("Database pool not initialized")

        conn = self.pool.getconn()
        try:
            yield conn
            conn.commit()
        except Exception as e:
            conn.rollback()
            logger.error(f"Database transaction error: {e}")
            raise
        finally:
            self.pool.putconn(conn)

    async def log_agent_activity(
        self,
        agent_type: str,
        step: str,
        data: Dict[str, Any],
        incident_id: Optional[str] = None,
        work_order_id: Optional[str] = None,
    ) -> int:
        """
        Log agent activity to database

        Args:
            agent_type: Type of agent (PLANNER, DISPATCHER, ANALYST)
            step: Current step in agent workflow
            data: JSON data containing agent reasoning and outputs
            incident_id: Optional incident ID reference
            work_order_id: Optional work order ID reference

        Returns:
            ID of the created log entry
        """
        query = """
            INSERT INTO agent_logs (agent_type, step, data, incident_id, work_order_id, timestamp)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        """

        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    query,
                    (
                        agent_type,
                        step,
                        Json(data),
                        incident_id,
                        work_order_id,
                        datetime.now(),
                    ),
                )
                log_id = cursor.fetchone()[0]
                logger.debug(
                    f"Logged agent activity: {agent_type} - {step} (ID: {log_id})"
                )
                return log_id

    async def get_agent_logs(
        self,
        agent_type: Optional[str] = None,
        incident_id: Optional[str] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """
        Retrieve agent logs with optional filtering

        Args:
            agent_type: Filter by agent type
            incident_id: Filter by incident ID
            limit: Maximum number of logs to return

        Returns:
            List of agent log entries
        """
        query = """
            SELECT id, agent_type, step, data, incident_id, work_order_id, timestamp
            FROM agent_logs
            WHERE 1=1
        """
        params = []

        if agent_type:
            query += " AND agent_type = %s"
            params.append(agent_type)

        if incident_id:
            query += " AND incident_id = %s"
            params.append(incident_id)

        query += " ORDER BY timestamp DESC LIMIT %s"
        params.append(limit)

        with self.get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query, params)
                logs = cursor.fetchall()
                return [dict(log) for log in logs]

    async def get_incident_context(self, incident_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch incident details for agent context

        Args:
            incident_id: Incident UUID

        Returns:
            Incident data or None if not found
        """
        query = """
            SELECT 
                i.*,
                z.name as zone_name,
                z.type as zone_type,
                z.population as zone_population,
                s.name as sensor_name,
                s.type as sensor_type
            FROM incidents i
            LEFT JOIN zones z ON i.zone_id = z.id
            LEFT JOIN sensors s ON i.sensor_id = s.id
            WHERE i.id = %s
        """

        with self.get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query, (incident_id,))
                result = cursor.fetchone()
                return dict(result) if result else None

    async def get_recent_incidents(
        self, zone_id: Optional[str] = None, limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get recent incidents for context gathering

        Args:
            zone_id: Optional zone filter
            limit: Maximum number of incidents

        Returns:
            List of recent incidents
        """
        query = """
            SELECT id, type, category, severity, status, priority_score, 
                   description, zone_id, detected_at
            FROM incidents
            WHERE status = 'ACTIVE'
        """
        params = []

        if zone_id:
            query += " AND zone_id = %s"
            params.append(zone_id)

        query += " ORDER BY detected_at DESC LIMIT %s"
        params.append(limit)

        with self.get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query, params)
                incidents = cursor.fetchall()
                return [dict(incident) for incident in incidents]


# Global database instance
db = Database()
