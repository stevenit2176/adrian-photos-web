/**
 * Script to create admin user with proper password hash
 * Run with: npx tsx scripts/create-admin.ts
 */

// Simple password hashing using Web Crypto API (matching our auth.ts implementation)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  
  // Generate random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Hash password with salt using SHA-256
  const combined = new Uint8Array([...salt, ...data]);
  const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Return salt:hash format
  return `${saltHex}:${hashHex}`;
}

async function main() {
  const password = 'Admin123!';
  const hash = await hashPassword(password);
  
  console.log('\n=== Admin User SQL ===\n');
  console.log(`INSERT INTO users (id, email, password_hash, first_name, last_name, role, created_at)`);
  console.log(`VALUES (`);
  console.log(`  'admin-001',`);
  console.log(`  'admin@adrianphotos.com',`);
  console.log(`  '${hash}',`);
  console.log(`  'Admin',`);
  console.log(`  'User',`);
  console.log(`  'admin',`);
  console.log(`  datetime('now')`);
  console.log(`);\n`);
  console.log('Password: Admin123!\n');
}

main();
