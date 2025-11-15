"""
Data preprocessing utilities for time-series forecasting
"""

import pandas as pd
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class TimeSeriesPreprocessor:
    """Preprocessing utilities for time-series data"""

    @staticmethod
    def prepare_prophet_dataframe(
        readings: List[Dict[str, Any]], min_data_points: int = 50
    ) -> Optional[pd.DataFrame]:
        """
        Prepare sensor readings for Prophet forecasting

        Prophet requires a DataFrame with 'ds' (datetime) and 'y' (value) columns

        Args:
            readings: List of sensor reading dictionaries
            min_data_points: Minimum number of data points required

        Returns:
            DataFrame ready for Prophet or None if insufficient data
        """
        if len(readings) < min_data_points:
            logger.warning(
                f"Insufficient data points: {len(readings)} < {min_data_points}"
            )
            return None

        try:
            # Convert to DataFrame
            df = pd.DataFrame(readings)

            # Ensure timestamp is datetime
            df["ds"] = pd.to_datetime(df["timestamp"])

            # Rename value column to 'y' for Prophet
            df["y"] = pd.to_numeric(df["value"], errors="coerce")

            # Sort by timestamp
            df = df.sort_values("ds")

            # Remove duplicates (keep last)
            df = df.drop_duplicates(subset=["ds"], keep="last")

            # Remove NaN values
            df = df.dropna(subset=["y"])

            # Select only required columns
            df = df[["ds", "y"]]

            logger.debug(f"Prepared DataFrame with {len(df)} data points")
            return df

        except Exception as e:
            logger.error(f"Error preparing Prophet dataframe: {e}")
            return None

    @staticmethod
    def detect_outliers(
        df: pd.DataFrame, column: str = "y", method: str = "iqr", threshold: float = 3.0
    ) -> pd.DataFrame:
        """
        Detect and optionally remove outliers from time-series data

        Args:
            df: Input DataFrame
            column: Column to check for outliers
            method: Detection method ('iqr' or 'zscore')
            threshold: Threshold for outlier detection

        Returns:
            DataFrame with outliers marked or removed
        """
        if method == "iqr":
            Q1 = df[column].quantile(0.25)
            Q3 = df[column].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - threshold * IQR
            upper_bound = Q3 + threshold * IQR
            df["is_outlier"] = (df[column] < lower_bound) | (df[column] > upper_bound)

        elif method == "zscore":
            mean = df[column].mean()
            std = df[column].std()
            df["z_score"] = (df[column] - mean) / std
            df["is_outlier"] = df["z_score"].abs() > threshold

        outlier_count = df["is_outlier"].sum()
        logger.debug(f"Detected {outlier_count} outliers using {method} method")

        return df

    @staticmethod
    def fill_missing_timestamps(
        df: pd.DataFrame, freq: str = "5T", method: str = "linear"
    ) -> pd.DataFrame:
        """
        Fill missing timestamps in time-series data

        Args:
            df: Input DataFrame with 'ds' and 'y' columns
            freq: Frequency string (e.g., '5T' for 5 minutes)
            method: Interpolation method ('linear', 'ffill', 'bfill')

        Returns:
            DataFrame with filled timestamps
        """
        try:
            # Set timestamp as index
            df = df.set_index("ds")

            # Create complete time range
            start_time = df.index.min()
            end_time = df.index.max()
            complete_index = pd.date_range(start=start_time, end=end_time, freq=freq)

            # Reindex and interpolate
            df = df.reindex(complete_index)

            if method == "linear":
                df["y"] = df["y"].interpolate(method="linear")
            elif method == "ffill":
                df["y"] = df["y"].fillna(method="ffill")
            elif method == "bfill":
                df["y"] = df["y"].fillna(method="bfill")

            # Reset index
            df = df.reset_index()
            df = df.rename(columns={"index": "ds"})

            logger.debug(f"Filled missing timestamps, new length: {len(df)}")
            return df

        except Exception as e:
            logger.error(f"Error filling missing timestamps: {e}")
            return df

    @staticmethod
    def calculate_statistics(df: pd.DataFrame, column: str = "y") -> Dict[str, float]:
        """
        Calculate basic statistics for time-series data

        Args:
            df: Input DataFrame
            column: Column to analyze

        Returns:
            Dictionary of statistics
        """
        try:
            stats = {
                "mean": float(df[column].mean()),
                "median": float(df[column].median()),
                "std": float(df[column].std()),
                "min": float(df[column].min()),
                "max": float(df[column].max()),
                "q1": float(df[column].quantile(0.25)),
                "q3": float(df[column].quantile(0.75)),
                "count": int(len(df)),
            }
            return stats
        except Exception as e:
            logger.error(f"Error calculating statistics: {e}")
            return {}

    @staticmethod
    def resample_data(
        df: pd.DataFrame, freq: str = "1H", agg_method: str = "mean"
    ) -> pd.DataFrame:
        """
        Resample time-series data to different frequency

        Args:
            df: Input DataFrame with 'ds' and 'y' columns
            freq: Target frequency (e.g., '1H' for hourly)
            agg_method: Aggregation method ('mean', 'sum', 'max', 'min')

        Returns:
            Resampled DataFrame
        """
        try:
            df = df.set_index("ds")

            if agg_method == "mean":
                df_resampled = df.resample(freq).mean()
            elif agg_method == "sum":
                df_resampled = df.resample(freq).sum()
            elif agg_method == "max":
                df_resampled = df.resample(freq).max()
            elif agg_method == "min":
                df_resampled = df.resample(freq).min()
            else:
                df_resampled = df.resample(freq).mean()

            df_resampled = df_resampled.reset_index()
            df_resampled = df_resampled.dropna()

            logger.debug(f"Resampled data to {freq}, new length: {len(df_resampled)}")
            return df_resampled

        except Exception as e:
            logger.error(f"Error resampling data: {e}")
            return df
