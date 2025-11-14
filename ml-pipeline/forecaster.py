"""
Time-series forecasting using Prophet
"""

import pandas as pd
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import logging
from prophet import Prophet

from preprocessing import TimeSeriesPreprocessor
from model_storage import model_storage
from config import settings

logger = logging.getLogger(__name__)


class TimeSeriesForecaster:
    """Time-series forecasting using Facebook Prophet"""

    def __init__(self):
        self.preprocessor = TimeSeriesPreprocessor()
        self.model_storage = model_storage

    def _create_prophet_model(self) -> Prophet:
        """
        Create and configure a Prophet model

        Returns:
            Configured Prophet model
        """
        model = Prophet(
            changepoint_prior_scale=0.05,  # Flexibility of trend changes
            seasonality_prior_scale=10.0,  # Strength of seasonality
            seasonality_mode="multiplicative",  # Multiplicative seasonality
            daily_seasonality=True,  # Enable daily patterns
            weekly_seasonality=True,  # Enable weekly patterns
            yearly_seasonality=False,  # Disable yearly (not enough data)
            interval_width=settings.forecast_confidence,  # Confidence interval
        )

        return model

    async def forecast(
        self, sensor_id: str, history: List[Dict[str, Any]], horizons: List[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Generate forecasts for multiple time horizons

        Args:
            sensor_id: Sensor UUID
            history: Historical sensor readings
            horizons: List of forecast horizons in hours (default from settings)

        Returns:
            List of prediction dictionaries
        """
        if horizons is None:
            horizons = settings.forecast_horizons_list

        try:
            # Prepare data for Prophet
            df = self.preprocessor.prepare_prophet_dataframe(history)

            if df is None or len(df) < 50:
                logger.warning(f"Insufficient data for sensor {sensor_id}")
                return []

            # Try to load cached model
            model = self.model_storage.load_model(sensor_id, "prophet")

            if model is None:
                # Train new model
                logger.info(f"Training new model for sensor {sensor_id}")
                model = self._create_prophet_model()
                model.fit(df)

                # Cache the model
                self.model_storage.save_model(model, sensor_id, "prophet")
            else:
                logger.info(f"Using cached model for sensor {sensor_id}")

            # Generate future dataframe for all horizons
            max_horizon = max(horizons)
            future = model.make_future_dataframe(
                periods=max_horizon,
                freq="H",  # Hourly frequency
                include_history=False,
            )

            # Make predictions
            forecast = model.predict(future)

            # Extract predictions for requested horizons
            predictions = []
            current_time = datetime.now()

            for horizon in horizons:
                target_time = current_time + timedelta(hours=horizon)

                # Find closest prediction to target time
                forecast["time_diff"] = abs(
                    (forecast["ds"] - target_time).dt.total_seconds()
                )
                closest_idx = forecast["time_diff"].idxmin()
                pred_row = forecast.loc[closest_idx]

                # Calculate confidence score
                confidence = self._calculate_confidence(pred_row)

                prediction = {
                    "sensor_id": sensor_id,
                    "predicted_timestamp": pred_row["ds"].to_pydatetime(),
                    "predicted_value": float(pred_row["yhat"]),
                    "confidence": confidence,
                    "lower_bound": float(pred_row["yhat_lower"]),
                    "upper_bound": float(pred_row["yhat_upper"]),
                    "model_version": "prophet-1.0",
                    "horizon_hours": horizon,
                }

                predictions.append(prediction)

            logger.info(
                f"Generated {len(predictions)} predictions for sensor {sensor_id}"
            )
            return predictions

        except Exception as e:
            logger.error(f"Error forecasting for sensor {sensor_id}: {e}")
            return []

    def _calculate_confidence(self, pred_row: pd.Series) -> float:
        """
        Calculate confidence score from prediction interval

        Args:
            pred_row: Prophet prediction row with yhat, yhat_lower, yhat_upper

        Returns:
            Confidence score between 0 and 1
        """
        try:
            # Calculate interval width relative to predicted value
            interval_width = pred_row["yhat_upper"] - pred_row["yhat_lower"]
            predicted_value = abs(pred_row["yhat"])

            if predicted_value == 0:
                return 0.5

            # Narrower intervals = higher confidence
            relative_width = interval_width / predicted_value

            # Convert to confidence score (inverse relationship)
            # Clamp between 0.3 and 0.95
            confidence = max(0.3, min(0.95, 1.0 - (relative_width / 4.0)))

            return float(confidence)

        except Exception as e:
            logger.error(f"Error calculating confidence: {e}")
            return 0.5

    async def batch_forecast(
        self,
        sensor_readings: Dict[str, List[Dict[str, Any]]],
        horizons: List[int] = None,
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Generate forecasts for multiple sensors

        Args:
            sensor_readings: Dictionary mapping sensor_id to readings
            horizons: List of forecast horizons in hours

        Returns:
            Dictionary mapping sensor_id to predictions
        """
        results = {}

        for sensor_id, readings in sensor_readings.items():
            try:
                predictions = await self.forecast(sensor_id, readings, horizons)
                results[sensor_id] = predictions
            except Exception as e:
                logger.error(f"Error in batch forecast for sensor {sensor_id}: {e}")
                results[sensor_id] = []

        return results

    def get_model_info(self, sensor_id: str) -> Optional[Dict[str, Any]]:
        """
        Get information about cached model

        Args:
            sensor_id: Sensor UUID

        Returns:
            Model metadata or None
        """
        return self.model_storage.get_model_info(sensor_id, "prophet")

    def invalidate_model(self, sensor_id: str) -> bool:
        """
        Invalidate cached model for a sensor

        Args:
            sensor_id: Sensor UUID

        Returns:
            True if model was deleted
        """
        return self.model_storage.delete_model(sensor_id, "prophet")


# Global forecaster instance
forecaster = TimeSeriesForecaster()
