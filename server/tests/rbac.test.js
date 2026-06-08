const request = require('supertest');
const app = require('../src/app');
const { pool, query } = require('../src/config/database');
const { ensureRoles, createTestTenant, createTestUser, generateTokenForUser, cleanup, redis } = require('./testHelper');

describe('RBAC & Scoping Suite', () => {
  let tenantId;
  let tokens = {};
  let users = {};
  let leads = {};

  beforeAll(async () => {
    await ensureRoles();
    tenantId = await createTestTenant('Test Tenant RBAC', 'tenant_rbac_test');

    // Create users for 5 roles
    const rolesList = [
      { key: 'superAdmin', name: 'Super Admin', email: 'super@rbac.com', empId: 'SUP_R' },
      { key: 'admin', name: 'Admin', email: 'admin@rbac.com', empId: 'ADM_R' },
      { key: 'salesManager', name: 'Sales Manager', email: 'sm@rbac.com', empId: 'MGR_R' },
      { key: 'salesExec', name: 'Sales Executive', email: 'se@rbac.com', empId: 'EXE_R' },
      { key: 'marketing', name: 'Marketing Executive', email: 'mkt@rbac.com', empId: 'MKT_R' },
    ];

    for (const r of rolesList) {
      users[r.key] = await createTestUser(tenantId, r.name, r.name, r.email, r.empId);
      tokens[r.key] = generateTokenForUser(users[r.key]);
    }

    // Set noToken to empty
    tokens['noToken'] = null;

    // --- Scope Test Setup ---
    // Exec A and Exec B
    users['execA'] = await createTestUser(tenantId, 'Sales Executive', 'Exec A', 'execa@rbac.com', 'EXE_A');
    tokens['execA'] = generateTokenForUser(users['execA']);

    users['execB'] = await createTestUser(tenantId, 'Sales Executive', 'Exec B', 'execb@rbac.com', 'EXE_B');
    tokens['execB'] = generateTokenForUser(users['execB']);

    // Manager A and Manager B
    users['managerA'] = await createTestUser(tenantId, 'Sales Manager', 'Manager A', 'mgra@rbac.com', 'MGR_A');
    tokens['managerA'] = generateTokenForUser(users['managerA']);

    users['managerB'] = await createTestUser(tenantId, 'Sales Manager', 'Manager B', 'mgrb@rbac.com', 'MGR_B');
    tokens['managerB'] = generateTokenForUser(users['managerB']);

    // Create Team A and Team B in DB
    const teamARes = await query('INSERT INTO teams (tenant_id, manager_id, name) VALUES ($1, $2, $3) RETURNING id', [tenantId, users['managerA'].id, 'Team A']);
    const teamIdA = teamARes.rows[0].id;

    const teamBRes = await query('INSERT INTO teams (tenant_id, manager_id, name) VALUES ($1, $2, $3) RETURNING id', [tenantId, users['managerB'].id, 'Team B']);
    const teamIdB = teamBRes.rows[0].id;

    // Map Exec A -> Team A, Exec B -> Team B
    await query('INSERT INTO team_members (team_id, user_id, tenant_id) VALUES ($1, $2, $3)', [teamIdA, users['execA'].id, tenantId]);
    await query('INSERT INTO team_members (team_id, user_id, tenant_id) VALUES ($1, $2, $3)', [teamIdB, users['execB'].id, tenantId]);

    // Insert Lead A assigned to Exec A, Lead B assigned to Exec B
    const leadARes = await query(
      `INSERT INTO leads_marketing (tenant_id, name, email, status, assigned_to) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [tenantId, 'Lead A', 'leada@test.com', 'New', users['execA'].id]
    );
    leads['leadA'] = leadARes.rows[0].id;

    const leadBRes = await query(
      `INSERT INTO leads_marketing (tenant_id, name, email, status, assigned_to) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [tenantId, 'Lead B', 'leadb@test.com', 'New', users['execB'].id]
    );
    leads['leadB'] = leadBRes.rows[0].id;
  });

  afterAll(async () => {
    // Clean up leads
    if (leads['leadA'] || leads['leadB']) {
      await query('DELETE FROM leads_marketing WHERE id IN ($1, $2)', [leads['leadA'], leads['leadB']]);
    }
    await query('DELETE FROM team_members WHERE tenant_id = $1', [tenantId]);
    await query('DELETE FROM teams WHERE tenant_id = $1', [tenantId]);
    await cleanup();
    await pool.end();
    await redis.quit();
  });

  // --- Super Admin Route Access ---
  describe('Super Admin Routes Access', () => {
    const route = '/api/v1/super-admin/tenants';

    it('✓ superAdmin token → GET /super-admin/tenants → 200', async () => {
      const res = await request(app).get(route).set('Authorization', `Bearer ${tokens.superAdmin}`);
      expect(res.status).toBe(200);
    });

    it('✗ admin token → 403', async () => {
      const res = await request(app).get(route).set('Authorization', `Bearer ${tokens.admin}`);
      expect(res.status).toBe(403);
    });

    it('✗ salesExec token → 403', async () => {
      const res = await request(app).get(route).set('Authorization', `Bearer ${tokens.salesExec}`);
      expect(res.status).toBe(403);
    });

    it('✗ no token → 401', async () => {
      const res = await request(app).get(route);
      expect(res.status).toBe(401);
    });
  });

  // --- Admin Route Access ---
  describe('Admin Routes Access', () => {
    const route = '/api/v1/admin/users';

    it('✓ admin token → GET /admin/users → 200', async () => {
      const res = await request(app).get(route).set('Authorization', `Bearer ${tokens.admin}`);
      expect(res.status).toBe(200);
    });

    it('✗ superAdmin token → 403', async () => {
      const res = await request(app).get(route).set('Authorization', `Bearer ${tokens.superAdmin}`);
      expect(res.status).toBe(403);
    });

    it('✗ salesExec token → 403', async () => {
      const res = await request(app).get(route).set('Authorization', `Bearer ${tokens.salesExec}`);
      expect(res.status).toBe(403);
    });
  });

  // --- Sales Manager Route Access ---
  describe('Sales Manager Routes Access', () => {
    const route = '/api/v1/manager/team';

    it('✓ salesManager → GET /manager/team → 200', async () => {
      const res = await request(app).get(route).set('Authorization', `Bearer ${tokens.salesManager}`);
      expect(res.status).toBe(200);
    });

    it('✗ salesExec → 403', async () => {
      const res = await request(app).get(route).set('Authorization', `Bearer ${tokens.salesExec}`);
      expect(res.status).toBe(403);
    });

    it('✗ admin → 403', async () => {
      const res = await request(app).get(route).set('Authorization', `Bearer ${tokens.admin}`);
      expect(res.status).toBe(403);
    });
  });

  // --- Sales Executive Route Access ---
  describe('Sales Executive Routes Access', () => {
    const route = '/api/v1/sales/leads';

    it('✓ salesExec → GET /sales/leads → 200', async () => {
      const res = await request(app).get(route).set('Authorization', `Bearer ${tokens.salesExec}`);
      expect(res.status).toBe(200);
    });

    it('✗ salesManager → 403 (own scope only)', async () => {
      const res = await request(app).get(route).set('Authorization', `Bearer ${tokens.salesManager}`);
      expect(res.status).toBe(403);
    });
  });

  // --- Marketing Route Access ---
  describe('Marketing Routes Access', () => {
    const route = '/api/v1/marketing/campaigns';

    it('✓ marketing → GET /marketing/campaigns → 200', async () => {
      const res = await request(app).get(route).set('Authorization', `Bearer ${tokens.marketing}`);
      expect(res.status).toBe(200);
    });

    it('✗ salesExec → 403', async () => {
      const res = await request(app).get(route).set('Authorization', `Bearer ${tokens.salesExec}`);
      expect(res.status).toBe(403);
    });
  });

  // --- SCOPE TESTS ---
  describe('Data Scoping Enforcement', () => {
    it('✓ Exec A token → GET /sales/leads sees only Exec A leads', async () => {
      const res = await request(app).get('/api/v1/sales/leads').set('Authorization', `Bearer ${tokens.execA}`);
      
      expect(res.status).toBe(200);
      const leadIds = res.body.data.leads.map(l => l.id);
      expect(leadIds).toContain(leads.leadA);
      expect(leadIds).not.toContain(leads.leadB);
    });

    it('✓ Manager A → GET /manager/leads sees only Team A leads', async () => {
      const res = await request(app).get('/api/v1/manager/leads').set('Authorization', `Bearer ${tokens.managerA}`);
      
      expect(res.status).toBe(200);
      const leadIds = res.body.data.leads.map(l => l.id);
      expect(leadIds).toContain(leads.leadA);
      expect(leadIds).not.toContain(leads.leadB);
    });
  });
});
