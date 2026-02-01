/**
 * Script to create admin user with proper password hash
 * Run with: node scripts/create-admin.js
 */

const crypto = require('crypto');

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  
  // Generate random salt
  const salt = crypto.randomBytes(16);
  const saltHex = salt.toString('hex');
  
  // Hash password with salt using SHA-256
  const combined = Buffer.concat([salt, Buffer.from(data)]);
  const hashBuffer = crypto.createHash('sha256').update(combined).digest();
  const hashHex = hashBuffer.toString('hex');
  
  // Return salt:hash format
  return `${saltHex}:${hashHex}`;
}

async function main() {
  const password = 'Admin123!';
  const hash = await hashPassword(password);
  
  console.log('\n=== Admin User SQL ===\n');
  console.log(`wrangler d1 execute adrian-photos-db --remote --command="INSERT INTO users (id, email, password_hash, first_name, last_name, role, created_at) VALUES ('admin-001', 'admin@adrianphotos.com', '${hash}', 'Admin', 'User', 'admin', datetime('now'))"`);
  console.log('\nPassword: Admin123!\n');
}

main();
