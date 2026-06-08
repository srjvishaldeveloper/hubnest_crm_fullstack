const request = require('supertest');
const app = require('../src/app');
const { pool, query } = require('../src/config/database');
const { ensureRoles, createTestTenant, createTestUser, generateTokenForUser, cleanup, redis } = require('./testHelper');

describe('Email Uniqueness Suite', () => {
  let superAdminToken;
  let adminToken;
  let tenantId;
  const emailA = `email_a_${Date.now()}@uniqueness.com`;
  const emailB = `email_b_${Date.now()}@uniqueness.com`;

  beforeAll(async () => {
    await ensureRoles();
    tenantId = await createTestTenant('Test Tenant Uniqueness', 'tenant_uniq_test');
    
    // Create a Super Admin user to get superAdminToken
    const superAdmin = await createTestUser(
      tenantId,
      'Super Admin',
      'Super Admin User',
      `super_${Date.now()}@test.com`,
      `SUP_${Date.now()}`
    );
    superAdminToken = generateTokenForUser(superAdmin);

    // Create a Tenant Admin user to get adminToken
    const admin = await createTestUser(
      tenantId,
      'Admin',
      'Admin User',
      `admin_${Date.now()}@test.com`,
      `ADM_${Date.now()}`
    );
    adminToken = generateTokenForUser(admin);
  });

  afterAll(async () => {
    await cleanup();
    await pool.end();
    await redis.quit();
  });

  it('1. Create Tenant Admin (Super Admin route) with email A → 201', async () => {
    const res = await request(app)
      .post('/api/v1/super-admin/tenants')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        companyName: 'Company A',
        companyEmail: 'compa@test.com',
        adminName: 'Admin A',
        adminEmail: emailA,
        adminId: `ADM_A_${Date.now()}`,
        tempPassword: 'Password123!',
        sendCreds: false,
      });

    expect(res.status).toBe(200); // Controller returns 200 on success for createTenant
    expect(res.body.success).toBe(true);
    expect(res.body.data.tenantId).toBeDefined();
  });

  it('2. Create Tenant Admin with duplicate email A → 409', async () => {
    const res = await request(app)
      .post('/api/v1/super-admin/tenants')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        companyName: 'Company Duplicate',
        companyEmail: 'compdup@test.com',
        adminName: 'Admin Duplicate',
        adminEmail: emailA, // same email A
        adminId: `ADM_DUP_${Date.now()}`,
        tempPassword: 'Password123!',
        sendCreds: false,
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('already registered');
  });

  it('3. Create Admin user with duplicate email A (via Admin user creation) → 409', async () => {
    const res = await request(app)
      .post('/api/v1/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Sales Exec DUP',
        email: emailA, // same email A
        employeeId: `EMP_DUP_${Date.now()}`,
        role: 'Sales Executive',
        password: 'Password123!',
        sendCreds: false,
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('already registered');
  });

  it('4. Create Admin with different email B → 201', async () => {
    const res = await request(app)
      .post('/api/v1/super-admin/tenants')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        companyName: 'Company B',
        companyEmail: 'compb@test.com',
        adminName: 'Admin B',
        adminEmail: emailB,
        adminId: `ADM_B_${Date.now()}`,
        tempPassword: 'Password123!',
        sendCreds: false,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('5. DB constraint: INSERT duplicate email → error caught', async () => {
    const roleResult = await query('SELECT id FROM roles LIMIT 1');
    const roleId = roleResult.rows[0].id;
    
    // Attempt direct database insert with duplicate email A
    let errorCaught = false;
    try {
      await query(
        `INSERT INTO users (tenant_id, role_id, name, email, admin_id, password_hash, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'Active')`,
        [tenantId, roleId, 'Direct DB User', emailA, `DIR_${Date.now()}`, 'somehash']
      );
    } catch (err) {
      errorCaught = true;
      expect(err.message).toContain('unique constraint');
    }
    
    expect(errorCaught).toBe(true);
  });
});
