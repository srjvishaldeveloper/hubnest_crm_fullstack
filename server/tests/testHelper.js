const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Global mock for nodemailer to prevent actual SMTP requests in tests
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-message-id' }),
  }),
}));

const { query } = require('../src/config/database');
const tokenService = require('../src/services/tokenService');
const redis = require('../src/config/redis');

const testTenants = [];
const testUsers = [];

async function ensureRoles() {
  const roles = [
    { name: 'Super Admin', permissions: { users: { create: true, read: true, update: true, delete: true }, roles: { create: true, read: true, update: true, delete: true }, tenants: { create: true, read: true, update: true, delete: true }, jobs: { create: true, read: true, update: true, delete: true }, reports: { create: true, read: true, update: true, delete: true }, settings: { create: true, read: true, update: true, delete: true } } },
    { name: 'Admin', permissions: { users: { create: true, read: true, update: true, delete: true }, roles: { create: true, read: true, update: true, delete: true }, jobs: { create: true, read: true, update: true, delete: true }, reports: { create: true, read: true, update: true, delete: true }, settings: { create: true, read: true, update: true, delete: true } } },
    { name: 'Sales Manager', permissions: { leads: { create: true, read: true, update: true, delete: true }, tasks: { create: true, read: true, update: true, delete: true }, activities: { create: true, read: true, update: true, delete: true }, team: { create: true, read: true, update: true, delete: true }, reports: { create: true, read: true, update: true, delete: true }, users: { create: true, read: true, update: true, delete: true } } },
    { name: 'Sales Executive', permissions: { leads: { create: true, read: true, update: true, delete: true }, tasks: { create: true, read: true, update: true, delete: true }, activities: { create: true, read: true, update: true, delete: true } } },
    { name: 'Marketing Head', permissions: { campaigns: { create: true, read: true, update: true, delete: true }, leads: { create: true, read: true, update: true, delete: true } } },
    { name: 'Marketing Executive', permissions: { campaigns: { create: true, read: true, update: true, delete: true }, leads: { create: true, read: true, update: true, delete: true } } }
  ];

  for (const role of roles) {
    const existing = await query('SELECT id FROM roles WHERE name = $1', [role.name]);
    if (existing.rows.length === 0) {
      await query('INSERT INTO roles (id, name, permissions) VALUES ($1, $2, $3)', [uuidv4(), role.name, JSON.stringify(role.permissions)]);
    } else {
      await query('UPDATE roles SET permissions = $1 WHERE id = $2', [JSON.stringify(role.permissions), existing.rows[0].id]);
    }
  }
}

async function createTestTenant(name, schemaName) {
  const id = uuidv4();
  await query('INSERT INTO tenants (id, name, schema_name, status) VALUES ($1, $2, $3, \'Active\')', [id, name, schemaName]);
  testTenants.push(id);
  return id;
}

async function createTestUser(tenantId, roleName, name, email, adminId, password = 'Password123!', status = 'Active') {
  const id = uuidv4();
  const roleResult = await query('SELECT id, permissions FROM roles WHERE name = $1', [roleName]);
  if (roleResult.rows.length === 0) {
    throw new Error(`Role ${roleName} not found`);
  }
  const roleId = roleResult.rows[0].id;
  const permissions = roleResult.rows[0].permissions;
  
  const passwordHash = await bcrypt.hash(password, 12);
  const dbStatus = status === 'Blocked' ? 'Suspended' : status;
  
  await query(
    `INSERT INTO users (id, tenant_id, role_id, name, email, admin_id, password_hash, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, tenantId, roleId, name, email, adminId, passwordHash, dbStatus]
  );
  
  const user = {
    id,
    tenant_id: tenantId,
    role_id: roleId,
    role_name: roleName,
    permissions,
    name,
    email,
    admin_id: adminId,
  };
  testUsers.push(id);
  return user;
}

function generateTokenForUser(user) {
  const tokenPayload = {
    userId: user.id,
    tenantId: user.tenant_id,
    roleId: user.role_id,
    role: user.role_name,
    roleName: user.role_name,
    permissions: user.permissions,
  };
  return tokenService.generateAccessToken(tokenPayload);
}

async function cleanup() {
  // Delete test users
  if (testUsers.length > 0) {
    await query('DELETE FROM users WHERE id = ANY($1)', [testUsers]);
    testUsers.length = 0;
  }
  
  // Delete test tenants
  if (testTenants.length > 0) {
    await query('DELETE FROM tenants WHERE id = ANY($1)', [testTenants]);
    testTenants.length = 0;
  }
}

module.exports = {
  ensureRoles,
  createTestTenant,
  createTestUser,
  generateTokenForUser,
  cleanup,
  redis,
};
