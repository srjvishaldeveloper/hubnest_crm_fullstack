/**
 * Seed script: creates the default tenant, Super Admin role, and Super Admin user.
 * Idempotent — safe to run multiple times.
 *
 * Run: npm run seed
 * Credentials: superadmin@jobnest.com / SUPER001 / Admin@123
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../src/config/database');
const logger = require('../src/utils/logger');

const SUPER_ADMIN_PERMISSIONS = {
  users:    { create: true, read: true, update: true, delete: true },
  roles:    { create: true, read: true, update: true, delete: true },
  tenants:  { create: true, read: true, update: true, delete: true },
  jobs:     { create: true, read: true, update: true, delete: true },
  reports:  { create: true, read: true, update: true, delete: true },
  settings: { create: true, read: true, update: true, delete: true },
};

const DEFAULT_TENANT = {
  id:         uuidv4(),
  name:       'JOB NEST Master',
  schemaName: 'tenant_master',
};

const SUPER_ADMIN_ROLE = {
  id:   uuidv4(),
  name: 'Super Admin',
};

const SUPER_ADMIN_USER = {
  id:       uuidv4(),
  name:     'Super Admin',
  email:    'srjchudamanideveloper@gmail.com',
  adminId:  'SUPER001',
  password: 'Admin@123',
};

async function seed() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // --- Tenant ---
    let tenantId;
    const { rows: existingTenants } = await client.query(
      `SELECT id FROM tenants WHERE schema_name = $1`,
      [DEFAULT_TENANT.schemaName]
    );

    if (existingTenants.length === 0) {
      await client.query(
        `INSERT INTO tenants (id, name, schema_name, status) VALUES ($1, $2, $3, 'Active')`,
        [DEFAULT_TENANT.id, DEFAULT_TENANT.name, DEFAULT_TENANT.schemaName]
      );
      tenantId = DEFAULT_TENANT.id;
      logger.info(`Tenant created: ${DEFAULT_TENANT.name}`);
    } else {
      tenantId = existingTenants[0].id;
      logger.info(`Tenant already exists: ${DEFAULT_TENANT.name}`);
    }

    // --- Role ---
    let roleId;
    const { rows: existingRoles } = await client.query(
      `SELECT id FROM roles WHERE name = $1`,
      [SUPER_ADMIN_ROLE.name]
    );

    if (existingRoles.length === 0) {
      await client.query(
        `INSERT INTO roles (id, name, permissions) VALUES ($1, $2, $3)`,
        [SUPER_ADMIN_ROLE.id, SUPER_ADMIN_ROLE.name, JSON.stringify(SUPER_ADMIN_PERMISSIONS)]
      );
      roleId = SUPER_ADMIN_ROLE.id;
      logger.info(`Role created: ${SUPER_ADMIN_ROLE.name}`);
    } else {
      roleId = existingRoles[0].id;
      // Update permissions in case they changed
      await client.query(
        `UPDATE roles SET permissions = $1 WHERE id = $2`,
        [JSON.stringify(SUPER_ADMIN_PERMISSIONS), roleId]
      );
      logger.info(`Role already exists, permissions updated: ${SUPER_ADMIN_ROLE.name}`);
    }

    // --- Super Admin User ---
    const { rows: existingUsers } = await client.query(
      `SELECT id FROM users WHERE email = $1 OR admin_id = $2`,
      [SUPER_ADMIN_USER.email, SUPER_ADMIN_USER.adminId]
    );

    if (existingUsers.length === 0) {
      const passwordHash = await bcrypt.hash(SUPER_ADMIN_USER.password, 12);
      await client.query(
        `INSERT INTO users (id, tenant_id, role_id, name, email, admin_id, password_hash, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'Active')`,
        [
          SUPER_ADMIN_USER.id,
          tenantId,
          roleId,
          SUPER_ADMIN_USER.name,
          SUPER_ADMIN_USER.email,
          SUPER_ADMIN_USER.adminId,
          passwordHash,
        ]
      );
      logger.info(`Super Admin user created:`);
      logger.info(`  Email:    ${SUPER_ADMIN_USER.email}`);
      logger.info(`  Admin ID: ${SUPER_ADMIN_USER.adminId}`);
      logger.info(`  Password: ${SUPER_ADMIN_USER.password}`);
    } else {
      logger.info(`Super Admin user already exists: ${SUPER_ADMIN_USER.email}`);
    }

    await client.query('COMMIT');
    logger.info('Seeding completed successfully.');

  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Seeding failed — transaction rolled back', { message: err.message });
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
