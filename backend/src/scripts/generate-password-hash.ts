/**
 * Script to generate bcrypt password hashes
 * Usage: tsx src/scripts/generate-password-hash.ts <password>
 */

import bcrypt from "bcrypt";

const password = process.argv[2];

if (!password) {
  console.error("Usage: tsx src/scripts/generate-password-hash.ts <password>");
  process.exit(1);
}

async function generateHash() {
  const hash = await bcrypt.hash(password, 10);
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
}

generateHash();
