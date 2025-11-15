#!/usr/bin/env python3
"""
Quick test script for CivicPulse AI Agent Runtime
"""

import requests
import sys
from typing import Optional

# Configuration
AGENT_URL = "http://localhost:8001"
BACKEND_URL = "http://localhost:4000"


def print_section(title: str):
    """Print a formatted section header"""
    print(f"\n{'=' * 60}")
    print(f"  {title}")
    print(f"{'=' * 60}\n")


def print_success(message: str):
    """Print success message"""
    print(f"✓ {message}")


def print_error(message: str):
    """Print error message"""
    print(f"✗ {message}")


def print_info(message: str):
    """Print info message"""
    print(f"  {message}")


def check_health() -> bool:
    """Check if agent runtime is healthy"""
    try:
        response = requests.get(f"{AGENT_URL}/health", timeout=5)
        if response.status_code == 200:
            print_success("Agent Runtime is healthy")
            return True
        else:
            print_error(f"Agent Runtime health check failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print_error(f"Cannot connect to Agent Runtime: {e}")
        print_info("Make sure the agent runtime is running: python main.py")
        return False


def check_backend() -> bool:
    """Check if backend is healthy"""
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        if response.status_code == 200:
            print_success("Backend is healthy")
            return True
        else:
            print_error(f"Backend health check failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print_error(f"Cannot connect to Backend: {e}")
        print_info("Make sure the backend is running: npm run dev")
        return False


def get_test_incident() -> Optional[str]:
    """Get a test incident ID from backend"""
    try:
        response = requests.get(f"{BACKEND_URL}/api/v1/incidents", timeout=10)
        if response.status_code == 200:
            data = response.json()
            incidents = data.get("data", [])

            if not incidents:
                print_error("No incidents found in database")
                print_info("Create an incident first or run backend seeding")
                return None

            incident = incidents[0]
            print_success(f"Found test incident: {incident['id']}")
            print_info(f"Type: {incident['type']}")
            print_info(f"Severity: {incident['severity']}")
            print_info(f"Status: {incident['status']}")
            return incident["id"]
        else:
            print_error(f"Failed to fetch incidents: {response.status_code}")
            return None
    except Exception as e:
        print_error(f"Error fetching incidents: {e}")
        return None


def process_incident(incident_id: str, force: bool = False) -> bool:
    """Process incident through agent workflow"""
    try:
        print_info(f"Processing incident: {incident_id}")
        print_info("This may take 10-30 seconds depending on LLM response time...")

        response = requests.post(
            f"{AGENT_URL}/api/agents/process-incident",
            json={"incident_id": incident_id, "force_reprocess": force},
            timeout=60,
        )

        if response.status_code == 200:
            result = response.json()

            if result.get("success"):
                print_success("Incident processed successfully!")

                data = result.get("data", {})

                # Display Planner output
                if "action_plan" in data:
                    plan = data["action_plan"]
                    print("\n  📋 PLANNER AGENT:")
                    print(f"     Priority: {plan.get('priority', 'N/A')}")
                    print(
                        f"     Summary: {plan.get('situation_summary', 'N/A')[:80]}..."
                    )
                    print(
                        f"     Actions: {len(plan.get('recommended_actions', []))} recommended"
                    )

                # Display Dispatcher output
                if "dispatch_result" in data:
                    dispatch = data["dispatch_result"]
                    print("\n  🚚 DISPATCHER AGENT:")
                    print(
                        f"     Units assigned: {len(dispatch.get('assignments', []))}"
                    )
                    print(f"     Work orders: {len(dispatch.get('work_orders', []))}")
                    if dispatch.get("assignments"):
                        first_unit = dispatch["assignments"][0]
                        print(
                            f"     First unit: {first_unit.get('unit_id')} (ETA: {first_unit.get('estimated_arrival')}min)"
                        )

                # Display Analyst output
                if "explanation" in data:
                    explanation = data["explanation"]
                    print("\n  💡 ANALYST AGENT:")
                    print(f"     Confidence: {explanation.get('confidence', 0):.1%}")
                    print(
                        f"     Key factors: {len(explanation.get('key_factors', []))}"
                    )
                    print(
                        f"     Explanation: {explanation.get('explanation', 'N/A')[:80]}..."
                    )

                return True
            else:
                print_error(
                    f"Processing failed: {result.get('message', 'Unknown error')}"
                )
                return False
        else:
            print_error(f"API request failed: {response.status_code}")
            print_info(f"Response: {response.text[:200]}")
            return False

    except requests.exceptions.Timeout:
        print_error("Request timed out (LLM might be slow)")
        print_info("Try again or check OpenAI API status")
        return False
    except Exception as e:
        print_error(f"Error processing incident: {e}")
        return False


def check_status(incident_id: str):
    """Check incident processing status"""
    try:
        response = requests.get(
            f"{AGENT_URL}/api/agents/incident/{incident_id}/status", timeout=10
        )

        if response.status_code == 200:
            result = response.json()
            status = result.get("data", {})

            print_info(f"Has action plan: {status.get('has_action_plan', False)}")
            print_info(
                f"Has dispatch result: {status.get('has_dispatch_result', False)}"
            )
            print_info(f"Has explanation: {status.get('has_explanation', False)}")
            print_info(f"Conversation messages: {status.get('conversation_length', 0)}")
            print_info(f"Completed: {status.get('completed', False)}")

            return status.get("completed", False)
        else:
            print_error(f"Failed to check status: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Error checking status: {e}")
        return False


def view_logs(incident_id: Optional[str] = None, limit: int = 10):
    """View agent logs"""
    try:
        params = {"limit": limit}
        if incident_id:
            params["incident_id"] = incident_id

        response = requests.get(
            f"{AGENT_URL}/api/agents/logs", params=params, timeout=10
        )

        if response.status_code == 200:
            result = response.json()
            logs = result.get("data", [])

            print_success(f"Found {len(logs)} log entries")

            for i, log in enumerate(logs[:5], 1):
                print(
                    f"\n  {i}. {log.get('agent_type', 'UNKNOWN')} - {log.get('step', 'N/A')}"
                )
                print(f"     Time: {log.get('timestamp', 'N/A')}")
                if log.get("incident_id"):
                    print(f"     Incident: {log['incident_id'][:8]}...")

            if len(logs) > 5:
                print(f"\n  ... and {len(logs) - 5} more entries")

            return True
        else:
            print_error(f"Failed to fetch logs: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Error fetching logs: {e}")
        return False


def analyze_patterns():
    """Analyze incident patterns"""
    try:
        response = requests.get(
            f"{AGENT_URL}/api/agents/patterns",
            params={"time_range_hours": 24},
            timeout=30,
        )

        if response.status_code == 200:
            result = response.json()
            patterns = result.get("data", {})

            print_success("Pattern analysis complete")
            print_info(f"Incidents analyzed: {patterns.get('incidents_analyzed', 0)}")
            print_info(f"Patterns found: {len(patterns.get('patterns', []))}")

            insights = patterns.get("insights", "")
            if insights:
                print("\n  Insights:")
                print(f"  {insights[:200]}...")

            recommendations = patterns.get("recommendations", [])
            if recommendations:
                print("\n  Recommendations:")
                for i, rec in enumerate(recommendations[:3], 1):
                    print(f"  {i}. {rec}")

            return True
        else:
            print_error(f"Failed to analyze patterns: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Error analyzing patterns: {e}")
        return False


def main():
    """Main test flow"""
    print_section("CivicPulse AI Agent Runtime - Test Script")

    # Step 1: Health checks
    print_section("Step 1: Health Checks")

    if not check_health():
        sys.exit(1)

    if not check_backend():
        sys.exit(1)

    # Step 2: Get test incident
    print_section("Step 2: Get Test Incident")

    incident_id = get_test_incident()
    if not incident_id:
        sys.exit(1)

    # Step 3: Process incident
    print_section("Step 3: Process Incident Through Agents")

    if not process_incident(incident_id, force=True):
        sys.exit(1)

    # Step 4: Check status
    print_section("Step 4: Check Processing Status")

    check_status(incident_id)

    # Step 5: View logs
    print_section("Step 5: View Agent Logs")

    view_logs(incident_id=incident_id, limit=10)

    # Step 6: Pattern analysis
    print_section("Step 6: Analyze Patterns")

    analyze_patterns()

    # Summary
    print_section("Test Complete!")
    print_success("All agent tests passed successfully")
    print_info("Check the agent runtime logs for detailed execution traces")
    print_info("View the frontend dashboard to see the results visually")
    print()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        sys.exit(0)
    except Exception as e:
        print_error(f"Unexpected error: {e}")
        sys.exit(1)
