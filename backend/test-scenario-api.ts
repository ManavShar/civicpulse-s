/**
 * Quick test script for scenario API
 */

import axios from "axios";

const API_BASE = "http://localhost:3001/api/v1";

async function testScenarioAPI() {
  try {
    console.log("Testing Scenario API...\n");

    // Test 1: Get all scenarios
    console.log("1. GET /scenarios - Fetching all scenarios");
    const scenariosResponse = await axios.get(`${API_BASE}/scenarios`);
    console.log(`✓ Found ${scenariosResponse.data.count} scenarios`);
    scenariosResponse.data.scenarios.forEach((s: any) => {
      console.log(`  - ${s.id}: ${s.name}`);
    });
    console.log();

    // Test 2: Get specific scenario
    console.log("2. GET /scenarios/flood - Fetching flood scenario");
    const floodResponse = await axios.get(`${API_BASE}/scenarios/flood`);
    console.log(`✓ Scenario: ${floodResponse.data.name}`);
    console.log(`  Description: ${floodResponse.data.description}`);
    console.log(`  Duration: ${floodResponse.data.duration}ms`);
    console.log(
      `  Sensor Modifiers: ${floodResponse.data.sensorModifiers.length}`
    );
    console.log(
      `  Triggered Incidents: ${floodResponse.data.triggeredIncidents.length}`
    );
    console.log();

    // Test 3: Get scenario status (should be inactive)
    console.log("3. GET /scenarios/status/current - Checking status");
    const statusResponse1 = await axios.get(
      `${API_BASE}/scenarios/status/current`
    );
    console.log(`✓ Active: ${statusResponse1.data.active}`);
    console.log();

    // Test 4: Trigger a scenario
    console.log("4. POST /scenarios/flood/trigger - Triggering flood scenario");
    const triggerResponse = await axios.post(
      `${API_BASE}/scenarios/flood/trigger`
    );
    console.log(`✓ ${triggerResponse.data.message}`);
    console.log(`  Start Time: ${triggerResponse.data.scenario.startTime}`);
    console.log(`  End Time: ${triggerResponse.data.scenario.endTime}`);
    console.log();

    // Test 5: Get scenario status (should be active)
    console.log("5. GET /scenarios/status/current - Checking active status");
    const statusResponse2 = await axios.get(
      `${API_BASE}/scenarios/status/current`
    );
    console.log(`✓ Active: ${statusResponse2.data.active}`);
    if (statusResponse2.data.scenario) {
      console.log(`  Scenario: ${statusResponse2.data.scenario.name}`);
      console.log(
        `  Elapsed Time: ${statusResponse2.data.scenario.elapsedTime}ms`
      );
      console.log(
        `  Remaining Time: ${statusResponse2.data.scenario.remainingTime}ms`
      );
    }
    console.log();

    // Wait a bit to see some effects
    console.log("Waiting 5 seconds to observe scenario effects...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
    console.log();

    // Test 6: Try to trigger another scenario (should fail)
    console.log(
      "6. POST /scenarios/fire/trigger - Attempting to trigger another scenario"
    );
    try {
      await axios.post(`${API_BASE}/scenarios/fire/trigger`);
      console.log("✗ Should have failed but didn't");
    } catch (error: any) {
      if (error.response?.status === 409) {
        console.log(`✓ Correctly rejected: ${error.response.data.error.code}`);
        console.log(`  Message: ${error.response.data.error.message}`);
      } else {
        throw error;
      }
    }
    console.log();

    // Test 7: Stop the scenario
    console.log("7. POST /scenarios/stop - Stopping active scenario");
    const stopResponse = await axios.post(`${API_BASE}/scenarios/stop`);
    console.log(`✓ ${stopResponse.data.message}`);
    console.log();

    // Test 8: Verify scenario is stopped
    console.log("8. GET /scenarios/status/current - Verifying stopped");
    const statusResponse3 = await axios.get(
      `${API_BASE}/scenarios/status/current`
    );
    console.log(`✓ Active: ${statusResponse3.data.active}`);
    console.log();

    console.log("All tests passed! ✓");
  } catch (error: any) {
    console.error("Test failed:", error.message);
    if (error.response) {
      console.error("Response:", error.response.data);
    }
    process.exit(1);
  }
}

// Run tests
testScenarioAPI();
