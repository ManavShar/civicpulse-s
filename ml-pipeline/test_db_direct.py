"""
Direct database test without using the Database class
"""

import psycopg2
from config import settings


def test_direct():
    print("\n=== Direct Database Test ===\n")

    try:
        # Connect directly
        conn = psycopg2.connect(settings.database_url)
        cursor = conn.cursor()

        # Count sensors
        cursor.execute("SELECT COUNT(*) FROM sensors")
        sensor_count = cursor.fetchone()[0]
        print(f"Total sensors: {sensor_count}")

        # Get sample sensors
        cursor.execute("SELECT id, name, type, status FROM sensors LIMIT 5")
        sensors = cursor.fetchall()

        print("\nSample sensors:")
        for sensor in sensors:
            print(f"  - {sensor[1]} ({sensor[2]}) - Status: {sensor[3]}")

        # Count readings
        cursor.execute("SELECT COUNT(*) FROM sensor_readings")
        reading_count = cursor.fetchone()[0]
        print(f"\nTotal sensor readings: {reading_count}")

        # Check readings per sensor
        cursor.execute("""
            SELECT s.name, s.type, COUNT(sr.id) as reading_count
            FROM sensors s
            LEFT JOIN sensor_readings sr ON s.id = sr.sensor_id
            GROUP BY s.id, s.name, s.type
            ORDER BY reading_count DESC
            LIMIT 5
        """)

        print("\nTop 5 sensors by reading count:")
        for row in cursor.fetchall():
            status = "✅" if row[2] >= 50 else "❌"
            print(f"  {status} {row[0]} ({row[1]}): {row[2]} readings")

        cursor.close()
        conn.close()

        print("\n=== Test Complete ===\n")

    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    test_direct()
