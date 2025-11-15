"""
Redis client for agent memory and pub/sub messaging
"""

import redis.asyncio as redis
from typing import Optional, Dict, Any
import json
import logging
from datetime import timedelta

from config import settings

logger = logging.getLogger(__name__)


class RedisClient:
    """Redis client for agent memory management and pub/sub"""

    def __init__(self):
        self.client: Optional[redis.Redis] = None
        self.pubsub: Optional[redis.client.PubSub] = None

    async def connect(self):
        """Initialize Redis connection"""
        try:
            self.client = redis.from_url(
                settings.redis_url, encoding="utf-8", decode_responses=True
            )
            # Test connection
            await self.client.ping()
            logger.info("Redis connection established")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise

    async def close(self):
        """Close Redis connection"""
        if self.client:
            await self.client.close()
            logger.info("Redis connection closed")

    async def set_memory(
        self, key: str, value: Dict[str, Any], ttl: Optional[int] = None
    ) -> bool:
        """
        Store data in Redis with optional TTL

        Args:
            key: Redis key
            value: Data to store (will be JSON serialized)
            ttl: Time to live in seconds (defaults to agent_memory_ttl)

        Returns:
            True if successful
        """
        try:
            ttl = ttl or settings.agent_memory_ttl
            serialized = json.dumps(value)
            await self.client.setex(key, timedelta(seconds=ttl), serialized)
            logger.debug(f"Stored memory: {key} (TTL: {ttl}s)")
            return True
        except Exception as e:
            logger.error(f"Failed to set memory {key}: {e}")
            return False

    async def get_memory(self, key: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve data from Redis

        Args:
            key: Redis key

        Returns:
            Stored data or None if not found
        """
        try:
            value = await self.client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Failed to get memory {key}: {e}")
            return None

    async def delete_memory(self, key: str) -> bool:
        """
        Delete data from Redis

        Args:
            key: Redis key

        Returns:
            True if successful
        """
        try:
            await self.client.delete(key)
            logger.debug(f"Deleted memory: {key}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete memory {key}: {e}")
            return False

    async def append_to_list(
        self, key: str, value: Dict[str, Any], max_length: int = 100
    ) -> bool:
        """
        Append to a Redis list (useful for conversation history)

        Args:
            key: Redis key
            value: Data to append
            max_length: Maximum list length (oldest items removed)

        Returns:
            True if successful
        """
        try:
            serialized = json.dumps(value)
            await self.client.rpush(key, serialized)
            # Trim list to max length
            await self.client.ltrim(key, -max_length, -1)
            logger.debug(f"Appended to list: {key}")
            return True
        except Exception as e:
            logger.error(f"Failed to append to list {key}: {e}")
            return False

    async def get_list(self, key: str, start: int = 0, end: int = -1) -> list:
        """
        Retrieve list from Redis

        Args:
            key: Redis key
            start: Start index
            end: End index (-1 for all)

        Returns:
            List of items
        """
        try:
            values = await self.client.lrange(key, start, end)
            return [json.loads(v) for v in values]
        except Exception as e:
            logger.error(f"Failed to get list {key}: {e}")
            return []

    async def publish(self, channel: str, message: Dict[str, Any]) -> bool:
        """
        Publish message to Redis pub/sub channel

        Args:
            channel: Channel name
            message: Message data

        Returns:
            True if successful
        """
        try:
            serialized = json.dumps(message)
            await self.client.publish(channel, serialized)
            logger.debug(f"Published to channel {channel}")
            return True
        except Exception as e:
            logger.error(f"Failed to publish to {channel}: {e}")
            return False

    async def subscribe(self, *channels: str):
        """
        Subscribe to Redis pub/sub channels

        Args:
            channels: Channel names to subscribe to

        Returns:
            PubSub object for receiving messages
        """
        try:
            self.pubsub = self.client.pubsub()
            await self.pubsub.subscribe(*channels)
            logger.info(f"Subscribed to channels: {channels}")
            return self.pubsub
        except Exception as e:
            logger.error(f"Failed to subscribe to channels: {e}")
            raise

    async def get_agent_memory_key(self, agent_type: str, incident_id: str) -> str:
        """
        Generate standardized memory key for agent

        Args:
            agent_type: Type of agent
            incident_id: Incident ID

        Returns:
            Redis key string
        """
        return f"agent:{agent_type.lower()}:{incident_id}"

    async def get_conversation_key(self, incident_id: str) -> str:
        """
        Generate standardized conversation history key

        Args:
            incident_id: Incident ID

        Returns:
            Redis key string
        """
        return f"conversation:{incident_id}"


# Global Redis client instance
redis_client = RedisClient()
