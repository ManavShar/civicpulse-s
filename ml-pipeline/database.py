"""
Database connection and utilities for ML Pipeline
"""

from psycopg2.pool import SimpleConnectionPool
from psycopg2.extras import RealDictCursor
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging
from contextlib import contextmanager

from config import settings

logger = logging.getLogger(__name__)


class Database:
    """Database connection manager with connection pooling"""

    _instance: Optional["Database"] = None
    _pool: Optional[SimpleConnectionPool] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self._pool is None:
            self._initialize_pool()

    def _initialize_pool(self):
        """Initialize connection pool"""
        try:
            self._pool = SimpleConnectionPool(
                minconn=1, maxconn=10, dsn=settings.database_url
            )
            logger.info("Database connection pool initialized")
        except Exception as e:
            logger.error(f"Failed to initialize database pool: {e}")
            raise

    @contextmanager
    def get_connection(self):
        """Context manager for database connections"""
        conn = None
        try:
            conn = self._pool.getconn()
            yield conn
        except Exception as e:
            logger.error(f"Database connection error: {e}")
            if conn:
                conn.rollback()
            raise
        finally:
            if conn:
                self._pool.putconn(conn)

    @contextmanager
    def get_cursor(self, cursor_factory=RealDictCursor):
        """Context manager for database cursors"""
        with self.get_connection() as conn:
            cursor = conn.cursor(cursor_factory=cursor_factory)
            try:
                yield cursor
                conn.commit()
            except Exception as e:
                conn.rollback()
                logger.error(f"Database cursor error: {e}")
                raise
            finally:
                cursor.close()

    async def fetch_sensor_readings(
        self,
        sensor_id: str,
        limit: int = 1000,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
    ) -> List[Dict[str, Any]]:
        """
        Fetch historical sensor readings for time-series analysis

        Args:
            sensor_id: Sensor UUID
            limit: Maximum number of readings to fetch
            start_time: Optional start timestamp
            end_time: Optional end timestamp

        Returns:
            List of sensor readings with timestamp and value
        """
        query = """
            SELECT 
                timestamp,
                value,
                unit,
                metadata
            FROM sensor_readings
            WHERE sensor_id = %s
        """
        params = [sensor_id]

        if start_time:
            query += " AND timestamp >= %s"
            params.append(start_time)

        if end_time:
            query += " AND timestamp <= %s"
            params.append(end_time)

        query += " ORDER BY timestamp DESC LIMIT %s"
        params.append(limit)

        try:
            with self.get_cursor() as cursor:
                cursor.execute(query, params)
                results = cursor.fetchall()
                logger.debug(f"Fetched {len(results)} readings for sensor {sensor_id}")
                return results
        except Exception as e:
            logger.error(f"Error fetching sensor readings: {e}")
            raise

    async def fetch_all_sensors(self) -> List[Dict[str, Any]]:
        """
        Fetch all sensors for batch prediction

        Returns:
            List of sensor records
        """
        query = """
            SELECT 
                id,
                name,
                type,
                zone_id,
                metadata
            FROM sensors
            WHERE metadata->>'status' != 'offline'
            ORDER BY created_at
        """

        try:
            with self.get_cursor() as cursor:
                cursor.execute(query)
                results = cursor.fetchall()
                logger.debug(f"Fetched {len(results)} active sensors")
                return results
        except Exception as e:
            logger.error(f"Error fetching sensors: {e}")
            raise

    async def store_predictions(self, predictions: List[Dict[str, Any]]) -> int:
        """
        Store predictions in database

        Args:
            predictions: List of prediction records

        Returns:
            Number of predictions stored
        """
        if not predictions:
            return 0

        query = """
            INSERT INTO predictions (
                sensor_id,
                predicted_timestamp,
                predicted_value,
                confidence,
                lower_bound,
                upper_bound,
                model_version
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
        """

        try:
            with self.get_cursor() as cursor:
                cursor.executemany(
                    query,
                    [
                        (
                            p["sensor_id"],
                            p["predicted_timestamp"],
                            p["predicted_value"],
                            p["confidence"],
                            p["lower_bound"],
                            p["upper_bound"],
                            p.get("model_version", "prophet-1.0"),
                        )
                        for p in predictions
                    ],
                )
                count = cursor.rowcount
                logger.info(f"Stored {count} predictions")
                return count
        except Exception as e:
            logger.error(f"Error storing predictions: {e}")
            raise

    async def test_connection(self) -> bool:
        """Test database connection"""
        try:
            with self.get_cursor() as cursor:
                cursor.execute("SELECT NOW()")
                result = cursor.fetchone()
                logger.info(f"Database connection test successful: {result}")
                return True
        except Exception as e:
            logger.error(f"Database connection test failed: {e}")
            return False

    def close(self):
        """Close all connections in the pool"""
        if self._pool:
            self._pool.closeall()
            logger.info("Database connection pool closed")


# Global database instance
db = Database()
