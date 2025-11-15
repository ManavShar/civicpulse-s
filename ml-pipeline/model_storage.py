"""
Model versioning and storage system
"""

import os
import pickle
import json
from typing import Any, Optional, Dict
from datetime import datetime
import logging
from pathlib import Path

from config import settings

logger = logging.getLogger(__name__)


class ModelStorage:
    """Manage model persistence and versioning"""

    def __init__(self, cache_dir: str = None):
        self.cache_dir = Path(cache_dir or settings.model_cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.metadata_file = self.cache_dir / "metadata.json"
        self._load_metadata()

    def _load_metadata(self):
        """Load model metadata from disk"""
        if self.metadata_file.exists():
            try:
                with open(self.metadata_file, "r") as f:
                    self.metadata = json.load(f)
            except Exception as e:
                logger.error(f"Error loading metadata: {e}")
                self.metadata = {}
        else:
            self.metadata = {}

    def _save_metadata(self):
        """Save model metadata to disk"""
        try:
            with open(self.metadata_file, "w") as f:
                json.dump(self.metadata, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Error saving metadata: {e}")

    def save_model(
        self,
        model: Any,
        sensor_id: str,
        model_type: str = "prophet",
        version: str = None,
    ) -> str:
        """
        Save a trained model to disk

        Args:
            model: Trained model object
            sensor_id: Sensor UUID
            model_type: Type of model (e.g., 'prophet', 'arima')
            version: Optional version string

        Returns:
            Model version identifier
        """
        try:
            # Generate version if not provided
            if version is None:
                version = datetime.now().strftime("%Y%m%d_%H%M%S")

            # Create model filename
            model_filename = f"{sensor_id}_{model_type}_{version}.pkl"
            model_path = self.cache_dir / model_filename

            # Save model using pickle
            with open(model_path, "wb") as f:
                pickle.dump(model, f)

            # Update metadata
            model_key = f"{sensor_id}_{model_type}"
            self.metadata[model_key] = {
                "sensor_id": sensor_id,
                "model_type": model_type,
                "version": version,
                "filename": model_filename,
                "created_at": datetime.now().isoformat(),
                "file_size": os.path.getsize(model_path),
            }
            self._save_metadata()

            logger.info(f"Saved model for sensor {sensor_id}, version {version}")
            return version

        except Exception as e:
            logger.error(f"Error saving model: {e}")
            raise

    def load_model(
        self, sensor_id: str, model_type: str = "prophet", version: str = None
    ) -> Optional[Any]:
        """
        Load a trained model from disk

        Args:
            sensor_id: Sensor UUID
            model_type: Type of model
            version: Optional specific version to load (defaults to latest)

        Returns:
            Loaded model object or None if not found
        """
        try:
            model_key = f"{sensor_id}_{model_type}"

            # Check if model exists in metadata
            if model_key not in self.metadata:
                logger.debug(f"No model found for {model_key}")
                return None

            model_info = self.metadata[model_key]
            model_path = self.cache_dir / model_info["filename"]

            # Check if file exists
            if not model_path.exists():
                logger.warning(f"Model file not found: {model_path}")
                return None

            # Check if model is expired
            created_at = datetime.fromisoformat(model_info["created_at"])
            age_seconds = (datetime.now() - created_at).total_seconds()

            if age_seconds > settings.model_cache_ttl:
                logger.info(f"Model cache expired for {model_key}")
                return None

            # Load model
            with open(model_path, "rb") as f:
                model = pickle.load(f)

            logger.info(
                f"Loaded model for sensor {sensor_id}, version {model_info['version']}"
            )
            return model

        except Exception as e:
            logger.error(f"Error loading model: {e}")
            return None

    def delete_model(self, sensor_id: str, model_type: str = "prophet") -> bool:
        """
        Delete a model from storage

        Args:
            sensor_id: Sensor UUID
            model_type: Type of model

        Returns:
            True if deleted successfully
        """
        try:
            model_key = f"{sensor_id}_{model_type}"

            if model_key not in self.metadata:
                logger.debug(f"No model found for {model_key}")
                return False

            model_info = self.metadata[model_key]
            model_path = self.cache_dir / model_info["filename"]

            # Delete file
            if model_path.exists():
                os.remove(model_path)

            # Remove from metadata
            del self.metadata[model_key]
            self._save_metadata()

            logger.info(f"Deleted model for sensor {sensor_id}")
            return True

        except Exception as e:
            logger.error(f"Error deleting model: {e}")
            return False

    def list_models(self) -> Dict[str, Dict[str, Any]]:
        """
        List all stored models

        Returns:
            Dictionary of model metadata
        """
        return self.metadata.copy()

    def cleanup_expired_models(self) -> int:
        """
        Remove expired models from storage

        Returns:
            Number of models deleted
        """
        deleted_count = 0
        current_time = datetime.now()

        for model_key, model_info in list(self.metadata.items()):
            try:
                created_at = datetime.fromisoformat(model_info["created_at"])
                age_seconds = (current_time - created_at).total_seconds()

                if age_seconds > settings.model_cache_ttl:
                    sensor_id = model_info["sensor_id"]
                    model_type = model_info["model_type"]

                    if self.delete_model(sensor_id, model_type):
                        deleted_count += 1

            except Exception as e:
                logger.error(f"Error cleaning up model {model_key}: {e}")

        logger.info(f"Cleaned up {deleted_count} expired models")
        return deleted_count

    def get_model_info(
        self, sensor_id: str, model_type: str = "prophet"
    ) -> Optional[Dict[str, Any]]:
        """
        Get metadata for a specific model

        Args:
            sensor_id: Sensor UUID
            model_type: Type of model

        Returns:
            Model metadata dictionary or None
        """
        model_key = f"{sensor_id}_{model_type}"
        return self.metadata.get(model_key)


# Global model storage instance
model_storage = ModelStorage()
