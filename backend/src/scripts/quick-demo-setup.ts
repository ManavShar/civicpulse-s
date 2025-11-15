#!/usr/bin/env node
/**
 * Quick Demo Setup Script
 *
 * This script provides a fast way to set up the CivicPulse AI demo environment
 * with minimal historical data for quick testing and demonstrations.
 */

import { reseedDatabase } from "./reset-and-seed";

async function quickDemoSetup(): Promise<void> {
  console.log("\n╔════════════════════════════════════════════════╗");
  console.log("║   CivicPulse AI - Quick Demo Setup            ║");
  console.log("║   (Minimal data for fast setup)                ║");
  console.log("╚════════════════════════════════════════════════╝");

  console.log("\nThis will:");
  console.log("  • Reset the database");
  console.log("  • Create 10 zones");
  console.log("  • Create 50+ sensors");
  console.log("  • Generate 2 days of historical data");
  console.log("  • Create demo user accounts");

  try {
    await reseedDatabase({
      skipReset: false,
      historicalDays: 2, // Minimal historical data for quick setup
      skipValidation: false,
    });

    console.log("\n✅ Quick demo setup completed!");
    console.log("\nYou can now:");
    console.log("  1. Start the backend: npm run dev");
    console.log("  2. Start the frontend: cd ../frontend && npm run dev");
    console.log("  3. Open http://localhost:3000 in your browser");
    console.log("  4. Login with: admin / admin123");
  } catch (error) {
    console.error("\n❌ Quick demo setup failed:", error);
    process.exit(1);
  }
}

// Run the quick setup
quickDemoSetup();
