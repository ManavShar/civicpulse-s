"""
Test script to check sensor data in database
"""

import asyncio
from database import db


async def test_sensor_data():
    print("\n=== Testing Sensor Data ===\n")

    # Test connection
    connected = await db.test_connection()
    print(f"Database connected: {connected}")

    if not connected:
        print("❌ Cannot connect to database")
        return

    # Get all sensors
    sensors = await db.fetch_all_sensors()
    print(f"\nTotal sensors: {len(sensors)}")

    if len(sensors) == 0:
        print("❌ No sensors found in database")
        return

    # Check first 5 sensors
    print("\nChecking first 5 sensors:")
    for i, sensor in enumerate(sensors[:5]):
        sensor_id = sensor["id"]
        sensor_name = sensor.get("name", "Unknown")
        sensor_type = sensor.get("type", "Unknown")

        # Fetch readings
        readings = await db.fetch_sensor_readings(sensor_id, limit=100)

        status = "✅" if len(readings) >= 50 else "❌"
        print(f"{status} {sensor_name} ({sensor_type}): {len(readings)} readings")

        if len(readings) > 0:
            print(f"   Sample reading keys: {list(readings[0].keys())}")
            print(f"   Sample reading: {readings[0]}")
        else:
            print("   No readings found!")

    print("\n=== Test Complete ===\n")


if __name__ == "__main__":
    asyncio.run(test_sensor_data())
