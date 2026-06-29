/**
 * Seed script: creates demo department users for local testing.
 * Idempotent — safe to run multiple times.
 *
 * Run: node seed/seedDemoUsers.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../src/config/database');

const DEMO_USERS = [
  {
    email: 'sandeepsharma323173@gmail.com',
    name: 'Sandeep Sharma',
    adminId: 'FIN001',
    password: 'Tenant@123',
    roleName: 'Finance Manager',
  },
  {
    email: 'sandipsharm4322@gmail.com',
    name: 'Sandip Sharma',
    adminId: 'FIN002',
    password: 'Tenant@123',
    roleName: 'Finance Manager',
  },
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get the first tenant
    const { rows: tenants } = await client.query(
      `SELECT id FROM tenants ORDER BY created_at LIMIT 1`
    );
    if (tenants.length === 0) {
      console.error('No tenant found. Run seedSuperAdmin.js first.');
      process.exit(1);
    }
    const tenantId = tenants[0].id;

    for (const u of DEMO_USERS) {
      // Get role ID
      const { rows: roles } = await client.query(
        `SELECT id FROM roles WHERE name = $1 LIMIT 1`,
        [u.roleName]
      );
      if (roles.length === 0) {
        console.warn(`Role "${u.roleName}" not found, skipping ${u.email}`);
        continue;
      }
      const roleId = roles[0].id;

      // Check if user already exists
      const { rows: existing } = await client.query(
        `SELECT id FROM users WHERE email = $1 OR admin_id = $2`,
        [u.email, u.adminId]
      );
      if (existing.length > 0) {
        console.log(`User already exists: ${u.email}`);
        continue;
      }

      const passwordHash = await bcrypt.hash(u.password, 12);
      await client.query(
        `INSERT INTO users (id, tenant_id, role_id, name, email, admin_id, password_hash, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'Active')`,
        [uuidv4(), tenantId, roleId, u.name, u.email, u.adminId, passwordHash]
      );
      console.log(`Created user: ${u.email} | password: ${u.password} | role: ${u.roleName}`);
    }

    await client.query('COMMIT');
    console.log('Demo users seeded successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Fatal seed error:', err.message);
  process.exit(1);
});
