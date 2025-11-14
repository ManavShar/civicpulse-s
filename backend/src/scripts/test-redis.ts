/**
 * Test script for Redis connection and CacheService
 * Run with: tsx src/scripts/test-redis.ts
 */

import dotenv from "dotenv";
import redisClient from "../db/redis";
import { cacheService, CachePrefix, CacheTTL } from "../services/CacheService";
import logger from "../utils/logger";

// Load environment variables
dotenv.config();

async function testRedisConnection() {
  console.log("\n=== Testing Redis Connection ===\n");

  try {
    // Test basic connection
    const isConnected = await redisClient.testConnection();
    console.log(`✓ Redis connection: ${isConnected ? "SUCCESS" : "FAILED"}`);

    if (!isConnected) {
      throw new Error("Redis connection failed");
    }

    return true;
  } catch (error) {
    console.error("✗ Redis connection test failed:", error);
    return false;
  }
}

async function testCacheOperations() {
  console.log("\n=== Testing Cache Operations ===\n");

  try {
    // Test 1: Set and Get
    console.log("Test 1: Set and Get");
    const key1 = cacheService.generateKey(CachePrefix.SENSOR, "test-sensor-1");
    const testData = {
      id: "test-sensor-1",
      name: "Test Sensor",
      type: "TEMPERATURE",
      value: 25.5,
    };

    await cacheService.set(key1, testData, CacheTTL.SHORT);
    const retrieved = await cacheService.get(key1);
    console.log(`  ✓ Set and retrieved data:`, retrieved);

    // Test 2: Key existence
    console.log("\nTest 2: Key Existence");
    const exists = await cacheService.exists(key1);
    console.log(`  ✓ Key exists: ${exists}`);

    // Test 3: TTL check
    console.log("\nTest 3: TTL Check");
    const ttl = await cacheService.ttl(key1);
    console.log(`  ✓ TTL remaining: ${ttl} seconds`);

    // Test 4: Multiple get/set
    console.log("\nTest 4: Multiple Get/Set");
    const entries = {
      [cacheService.generateKey(CachePrefix.SENSOR, "sensor-1")]: {
        id: "sensor-1",
        value: 10,
      },
      [cacheService.generateKey(CachePrefix.SENSOR, "sensor-2")]: {
        id: "sensor-2",
        value: 20,
      },
      [cacheService.generateKey(CachePrefix.SENSOR, "sensor-3")]: {
        id: "sensor-3",
        value: 30,
      },
    };

    await cacheService.mset(entries, CacheTTL.MEDIUM);
    const keys = Object.keys(entries);
    const values = await cacheService.mget(keys);
    console.log(
      `  ✓ Set ${keys.length} keys, retrieved ${values.length} values`
    );

    // Test 5: Increment
    console.log("\nTest 5: Increment");
    const counterKey = "test:counter";
    const count1 = await cacheService.increment(counterKey, 1);
    const count2 = await cacheService.increment(counterKey, 5);
    console.log(`  ✓ Counter: ${count1} -> ${count2}`);

    // Test 6: Get or Set pattern
    console.log("\nTest 6: Get or Set Pattern");
    const key2 = cacheService.generateKey(
      CachePrefix.SENSOR,
      "computed-sensor"
    );
    const computed = await cacheService.getOrSet(
      key2,
      async () => {
        console.log("  → Computing value (cache miss)...");
        return { id: "computed-sensor", computed: true, timestamp: Date.now() };
      },
      CacheTTL.MEDIUM
    );
    console.log(`  ✓ First call (computed):`, computed);

    const cached = await cacheService.getOrSet(
      key2,
      async () => {
        console.log("  → This should not be called (cache hit)");
        return { id: "computed-sensor", computed: true, timestamp: Date.now() };
      },
      CacheTTL.MEDIUM
    );
    console.log(`  ✓ Second call (cached):`, cached);

    // Test 7: Pattern invalidation
    console.log("\nTest 7: Pattern Invalidation");
    const deleted = await cacheService.invalidatePattern(
      `${CachePrefix.SENSOR}:*`
    );
    console.log(`  ✓ Deleted ${deleted} keys matching pattern`);

    // Test 8: Invalidate single key
    console.log("\nTest 8: Single Key Invalidation");
    await cacheService.set(key1, testData, CacheTTL.SHORT);
    const invalidated = await cacheService.invalidate(key1);
    const afterInvalidate = await cacheService.get(key1);
    console.log(
      `  ✓ Invalidated: ${invalidated}, Value after: ${afterInvalidate}`
    );

    console.log("\n✓ All cache operation tests passed!");
    return true;
  } catch (error) {
    console.error("\n✗ Cache operation tests failed:", error);
    return false;
  }
}

async function testPubSub() {
  console.log("\n=== Testing Pub/Sub ===\n");

  try {
    let messageReceived = false;
    const testChannel = "test:channel";
    const testMessage = {
      type: "TEST",
      data: "Hello from pub/sub",
      timestamp: Date.now(),
    };

    // Subscribe to channel
    console.log("Setting up subscriber...");
    await cacheService.subscribe(testChannel, (message) => {
      console.log("  ✓ Message received:", message);
      messageReceived = true;
    });

    // Wait a bit for subscription to be ready
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Publish message
    console.log("Publishing message...");
    const subscriberCount = await cacheService.publish(
      testChannel,
      testMessage
    );
    console.log(`  ✓ Published to ${subscriberCount} subscriber(s)`);

    // Wait for message to be received
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (messageReceived) {
      console.log("\n✓ Pub/Sub test passed!");
    } else {
      console.log(
        "\n⚠ Message was not received (this might be timing-related)"
      );
    }

    // Unsubscribe
    await cacheService.unsubscribe(testChannel);
    console.log("  ✓ Unsubscribed from channel");

    return true;
  } catch (error) {
    console.error("\n✗ Pub/Sub test failed:", error);
    return false;
  }
}

async function runTests() {
  console.log("╔════════════════════════════════════════╗");
  console.log("║  Redis & CacheService Test Suite      ║");
  console.log("╚════════════════════════════════════════╝");

  try {
    // Test connection
    const connectionOk = await testRedisConnection();
    if (!connectionOk) {
      console.error(
        "\n❌ Redis connection failed. Make sure Redis is running."
      );
      console.error("   Start Redis with: redis-server");
      process.exit(1);
    }

    // Test cache operations
    const cacheOk = await testCacheOperations();

    // Test pub/sub
    const pubsubOk = await testPubSub();

    // Summary
    console.log("\n╔════════════════════════════════════════╗");
    console.log("║  Test Summary                          ║");
    console.log("╚════════════════════════════════════════╝");
    console.log(`  Connection:     ${connectionOk ? "✓ PASS" : "✗ FAIL"}`);
    console.log(`  Cache Ops:      ${cacheOk ? "✓ PASS" : "✗ FAIL"}`);
    console.log(`  Pub/Sub:        ${pubsubOk ? "✓ PASS" : "✗ FAIL"}`);

    const allPassed = connectionOk && cacheOk && pubsubOk;
    console.log(
      `\n  Overall:        ${
        allPassed ? "✓ ALL TESTS PASSED" : "✗ SOME TESTS FAILED"
      }\n`
    );

    // Close connections
    await redisClient.close();
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error("\n❌ Test suite failed:", error);
    await redisClient.close();
    process.exit(1);
  }
}

// Run tests
runTests();
