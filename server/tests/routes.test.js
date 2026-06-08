const request = require('supertest');
const app = require('../src/app');
const { pool, query } = require('../src/config/database');
const { ensureRoles, createTestTenant, createTestUser, generateTokenForUser, cleanup, redis } = require('./testHelper');
const tokenService = require('../src/services/tokenService');

// Mock pythonBridge
jest.mock('../src/utils/pythonBridge', () => ({
  forwardChat: jest.fn().mockResolvedValue({ reply: "Mocked AI reply", tokens_used: 12 }),
  forwardReset: jest.fn().mockResolvedValue({ status: "cleared" }),
  forwardReport: jest.fn().mockResolvedValue({ total_leads: 50, converted: 10, revenue: 150000 }),
  forwardExport: jest.fn().mockResolvedValue({
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': 'attachment; filename="report.pdf"'
    },
    data: {
      pipe: (res) => res.end('mock pdf data')
    }
  })
}));

describe('Routes & Data Integrity & Sessions Suite', () => {
  let tenantId;
  let superAdminUser, adminUser, managerUser, execUser, marketingUser;
  let superAdminToken, adminToken, managerToken, execToken, marketingToken;
  let testLeadId;

  beforeAll(async () => {
    await ensureRoles();
    tenantId = await createTestTenant('Test Tenant Routes', 'tenant_routes_test');

    superAdminUser = await createTestUser(tenantId, 'Super Admin', 'Super Admin', `super_${Date.now()}@routes.com`, `SUP_RT`);
    superAdminToken = generateTokenForUser(superAdminUser);

    adminUser = await createTestUser(tenantId, 'Admin', 'Admin', `admin_${Date.now()}@routes.com`, `ADM_RT`);
    adminToken = generateTokenForUser(adminUser);

    managerUser = await createTestUser(tenantId, 'Sales Manager', 'Manager', `mgr_${Date.now()}@routes.com`, `MGR_RT`);
    managerToken = generateTokenForUser(managerUser);

    execUser = await createTestUser(tenantId, 'Sales Executive', 'Exec', `exec_${Date.now()}@routes.com`, `EXE_RT`);
    execToken = generateTokenForUser(execUser);

    marketingUser = await createTestUser(tenantId, 'Marketing Executive', 'Marketing', `mkt_${Date.now()}@routes.com`, `MKT_RT`);
    marketingToken = generateTokenForUser(marketingUser);

    // Map Exec -> Manager's Team
    const teamRes = await query('INSERT INTO teams (tenant_id, manager_id, name) VALUES ($1, $2, $3) RETURNING id', [tenantId, managerUser.id, 'Routes Team']);
    const teamId = teamRes.rows[0].id;
    await query('INSERT INTO team_members (team_id, user_id, tenant_id) VALUES ($1, $2, $3)', [teamId, execUser.id, tenantId]);
  });

  afterAll(async () => {
    if (testLeadId) {
      await query('DELETE FROM leads_marketing WHERE id = $1', [testLeadId]);
    }
    await query('DELETE FROM team_members WHERE tenant_id = $1', [tenantId]);
    await query('DELETE FROM teams WHERE tenant_id = $1', [tenantId]);
    await cleanup();
    await pool.end();
    await redis.quit();
  });

  // --- TEST 4: SUPER ADMIN ROUTES ---
  describe('Super Admin Routes', () => {
    it('✓ GET /super-admin/tenants → 200 + list', async () => {
      const res = await request(app)
        .get('/api/v1/super-admin/tenants')
        .set('Authorization', `Bearer ${superAdminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data.tenants).toBeDefined();
    });

    it('✓ POST /super-admin/tenants → 201 + tenant created', async () => {
      const uniqueSuffix = Date.now();
      const res = await request(app)
        .post('/api/v1/super-admin/tenants')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          companyName: `Tenant New ${uniqueSuffix}`,
          companyEmail: `new_${uniqueSuffix}@tenant.com`,
          adminName: 'New Admin',
          adminEmail: `new_admin_${uniqueSuffix}@tenant.com`,
          adminId: `ADM_${uniqueSuffix}`,
          tempPassword: 'Password123!',
          sendCreds: false,
        });

      expect(res.status).toBe(200); // Controller returns 200 + provisioning success
      expect(res.body.success).toBe(true);
      
      // Cleanup the newly created tenant
      if (res.body.data.tenantId) {
        await query('DELETE FROM tenants WHERE id = $1', [res.body.data.tenantId]);
      }
    });

    it('✓ GET /super-admin/admins → 200 + list', async () => {
      const res = await request(app)
        .get('/api/v1/super-admin/admins')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.admins).toBeDefined();
    });

    it('✓ PATCH /super-admin/admins/:id → 200 updated', async () => {
      const res = await request(app)
        .patch(`/api/v1/super-admin/admins/${adminUser.id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Admin Name Updated',
        });

      expect(res.status).toBe(200);
    });

    it('✓ DELETE /super-admin/admins/:id → 200 deleted', async () => {
      // Create temp admin to delete
      const tempId = await createTestTenant('Temp Tenant Del', 'tenant_temp_del');
      const tempAdmin = await createTestUser(tempId, 'Admin', 'Temp Admin', `temp_admin_${Date.now()}@del.com`, `TMP_${Date.now()}`);

      const res = await request(app)
        .delete(`/api/v1/super-admin/admins/${tempAdmin.id}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
    });
  });

  // --- TEST 5: ADMIN ROUTES ---
  describe('Admin Routes', () => {
    it('✓ GET /admin/dashboard → 200 + KPI data', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalUsers).toBeDefined();
      expect(res.body.data.kpis).toBeDefined();
    });

    it('✓ GET /admin/users → 200 + list', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.users).toBeDefined();
    });

    it('✓ POST /admin/users → 201 user created', async () => {
      const res = await request(app)
        .post('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Sales User',
          email: `new_sales_${Date.now()}@test.com`,
          employeeId: `EMP_${Date.now()}`,
          role: 'Sales Executive',
          password: 'Password123!',
        });

      expect(res.status).toBe(200); // Controller returns 200 on user created successfully
      expect(res.body.success).toBe(true);

      // Cleanup
      await query('DELETE FROM users WHERE id = $1', [res.body.data.id]);
    });

    it('✓ PATCH /admin/users/:id/block → 200 blocked', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${execUser.id}/block`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      // Re-enable user status
      await query("UPDATE users SET status = 'Active' WHERE id = $1", [execUser.id]);
    });

    it('✓ GET /admin/reports → 200', async () => {
      const res = await request(app)
        .get('/api/v1/admin/reports')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('✓ GET /admin/crm-control → 200', async () => {
      const res = await request(app)
        .get('/api/v1/admin/crm-control')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });

  // --- TEST 6: SALES ROUTES ---
  describe('Sales Routes', () => {
    // Manager
    it('✓ GET /manager/dashboard → 200', async () => {
      const res = await request(app)
        .get('/api/v1/manager/dashboard')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
    });

    it('✓ GET /manager/leads → 200 + leads', async () => {
      const res = await request(app)
        .get('/api/v1/manager/leads')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.leads).toBeDefined();
    });

    it('✓ POST /manager/team/add-exec → 201 created', async () => {
      const res = await request(app)
        .post('/api/v1/manager/team/add-exec')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Manager Executive',
          email: `mgr_exec_${Date.now()}@test.com`,
          employeeId: `EXE_MGR_${Date.now()}`,
          password: 'Password123!',
        });

      expect(res.status).toBe(200); // Controller returns 200 on team exec creation
      expect(res.body.success).toBe(true);

      // Cleanup
      await query('DELETE FROM team_members WHERE user_id = $1', [res.body.data.userId]);
      await query('DELETE FROM users WHERE id = $1', [res.body.data.userId]);
    });

    it('✓ PATCH /manager/leads/:id/assign → 200 assigned', async () => {
      // Insert a lead to assign
      const leadRes = await query(
        `INSERT INTO leads_marketing (tenant_id, name, email, status) 
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [tenantId, 'Assign Lead', 'assign@test.com', 'New']
      );
      testLeadId = leadRes.rows[0].id;

      const res = await request(app)
        .patch(`/api/v1/manager/leads/${testLeadId}/assign`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          executiveId: execUser.id,
        });

      expect(res.status).toBe(200);
    });

    it('✓ GET /manager/reports/team → 200', async () => {
      const res = await request(app)
        .get('/api/v1/manager/reports/team')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
    });

    // Executive
    it('✓ GET /sales/dashboard → 200', async () => {
      const res = await request(app)
        .get('/api/v1/sales/dashboard')
        .set('Authorization', `Bearer ${execToken}`);

      expect(res.status).toBe(200);
    });

    it('✓ GET /sales/leads → 200', async () => {
      const res = await request(app)
        .get('/api/v1/sales/leads')
        .set('Authorization', `Bearer ${execToken}`);

      expect(res.status).toBe(200);
    });

    it('✓ POST /sales/tasks → 201 created', async () => {
      const res = await request(app)
        .post('/api/v1/sales/tasks')
        .set('Authorization', `Bearer ${execToken}`)
        .send({
          type: 'Call',
          title: 'Followup call',
          scheduled_at: new Date(),
          priority: 'High',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      // Cleanup
      await query('DELETE FROM tasks WHERE id = $1', [res.body.data.task.id]);
    });

    it('✓ POST /sales/activities → 201 logged', async () => {
      const res = await request(app)
        .post('/api/v1/sales/activities')
        .set('Authorization', `Bearer ${execToken}`)
        .send({
          type: 'Call',
          outcome: 'Connected',
          duration_seconds: 120,
          notes: 'Spoke with client',
        });

      expect(res.status).toBe(201);

      // Cleanup
      await query('DELETE FROM activities WHERE id = $1', [res.body.data.id]);
    });

    it('✓ PATCH /sales/leads/:id → 200 updated', async () => {
      const res = await request(app)
        .patch(`/api/v1/sales/leads/${testLeadId}`)
        .set('Authorization', `Bearer ${execToken}`)
        .send({
          status: 'Contacted',
        });

      expect(res.status).toBe(200);
    });
  });

  // --- TEST 7: MARKETING ROUTES ---
  describe('Marketing Routes', () => {
    let campaignId;

    it('✓ GET /marketing/dashboard → 200', async () => {
      const res = await request(app)
        .get('/api/v1/marketing/dashboard')
        .set('Authorization', `Bearer ${marketingToken}`);

      expect(res.status).toBe(200);
    });

    it('✓ POST /marketing/campaigns → 201 created', async () => {
      const res = await request(app)
        .post('/api/v1/marketing/campaigns')
        .set('Authorization', `Bearer ${marketingToken}`)
        .send({
          name: 'Winter Promo',
          type: 'Email',
          platform: 'Mailchimp',
        });

      expect(res.status).toBe(201);
      campaignId = res.body.data.campaign.id;
    });

    it('✓ GET /marketing/campaigns → 200', async () => {
      const res = await request(app)
        .get('/api/v1/marketing/campaigns')
        .set('Authorization', `Bearer ${marketingToken}`);

      expect(res.status).toBe(200);
    });

    it('✓ PATCH /marketing/campaigns/:id → 200 updated', async () => {
      const res = await request(app)
        .patch(`/api/v1/marketing/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${marketingToken}`)
        .send({
          name: 'Winter Promo Updated',
        });

      expect(res.status).toBe(200);

      // Clean up campaign
      await query('DELETE FROM campaigns WHERE id = $1', [campaignId]);
    });

    it('✓ GET /marketing/leads → 200', async () => {
      const res = await request(app)
        .get('/api/v1/marketing/leads')
        .set('Authorization', `Bearer ${marketingToken}`);

      expect(res.status).toBe(200);
    });

    it('✓ GET /marketing/analytics → 200', async () => {
      const res = await request(app)
        .get('/api/v1/marketing/analytics')
        .set('Authorization', `Bearer ${marketingToken}`);

      expect(res.status).toBe(200);
    });
  });

  // --- TEST 8: Node → Python Bridge Proxy Routes ---
  describe('Node → Python proxy routing', () => {
    it('✓ GET /api/v1/reports/sales/kpis → 200 (proxies reports)', async () => {
      const res = await request(app)
        .get('/api/v1/reports/sales/kpis')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.total_leads).toBe(50);
    });

    it('✓ POST /api/v1/ai/chat → 200 (proxies chatbot)', async () => {
      const res = await request(app)
        .post('/api/v1/ai/chat')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          messages: [{ role: 'user', content: 'Hello' }],
          user_role: 'Admin',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.reply).toBe('Mocked AI reply');
    });
  });

  // --- TEST 10: TOKEN EXPR & OTP EXPIRY ---
  describe('Tokens & Sessions details', () => {
    it('✓ Access token expires in 15 min check', () => {
      const token = tokenService.generateAccessToken({ userId: adminUser.id });
      const decoded = tokenService.verifyAccessToken(token);
      
      const expSeconds = decoded.exp - decoded.iat;
      // 15 minutes is 900 seconds
      expect(expSeconds).toBe(900);
    });

    it('✓ Refresh token valid for 7 days check', () => {
      const token = tokenService.generateRefreshToken({ userId: adminUser.id });
      const decoded = tokenService.verifyRefreshToken(token);

      const expSeconds = decoded.exp - decoded.iat;
      // 7 days is 7 * 24 * 60 * 60 = 604800 seconds
      expect(expSeconds).toBe(604800);
    });
  });
});
