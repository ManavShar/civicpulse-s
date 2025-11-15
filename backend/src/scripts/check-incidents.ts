import { db } from "../db/connection";

async function checkIncidents() {
  try {
    const pool = db.getPool();
    const result = await pool.query(`
      SELECT id, type, category, severity, status, priority_score
      FROM incidents
      ORDER BY detected_at DESC
      LIMIT 10
    `);

    console.log(`\nFound ${result.rowCount} incidents:\n`);
    result.rows.forEach((row, i) => {
      console.log(`${i + 1}. ${row.type}`);
      console.log(`   Category: ${row.category}`);
      console.log(`   Severity: ${row.severity}`);
      console.log(`   Status: ${row.status}`);
      console.log(`   Priority: ${row.priority_score}`);
      console.log();
    });

    await db.close();
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkIncidents();
