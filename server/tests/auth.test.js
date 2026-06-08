const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/database');
const { ensureRoles, createTestTenant, createTestUser, cleanup, redis } = require('./testHelper');

describe('Auth Routes Suite', () => {
  let tenantId;
  let activeUser;
  let inactiveUser;
  const password = 'Password123!';

  beforeAll(async () => {
    await ensureRoles();
    tenantId = await createTestTenant('Test Tenant Auth', 'tenant_auth_test');
    
    // Create an active admin user
    activeUser = await createTestUser(
      tenantId,
      'Admin',
      'Active User',
      `active_${Date.now()}@test.com`,
      `ADM_${Date.now()}`,
      password,
      'Active'
    );

    // Create an inactive admin user
    inactiveUser = await createTestUser(
      tenantId,
      'Admin',
      'Inactive User',
      `inactive_${Date.now()}@test.com`,
      `INA_${Date.now()}`,
      password,
      'Inactive'
    );
  });

  afterAll(async () => {
    await cleanup();
    await pool.end();
    await redis.quit();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with valid credentials and return userId', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          emailOrAdminId: activeUser.email,
          password: password,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userId).toBe(activeUser.id);
      expect(res.body.data.maskedEmail).toBeDefined();
    });

    it('should fail (401) with wrong password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          emailOrAdminId: activeUser.email,
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
    });

    it('should fail (403) with inactive account', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          emailOrAdminId: inactiveUser.email,
          password: password,
        });

      expect(res.status).toBe(403);
    });

    it('should fail (422) with missing fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          emailOrAdminId: activeUser.email,
        });

      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/v1/auth/verify-otp', () => {
    let otp;

    beforeEach(async () => {
      // Trigger a login to generate OTP
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          emailOrAdminId: activeUser.email,
          password: password,
        });

      // Get OTP from Redis
      otp = await redis.get(`otp:${activeUser.id}`);
    });

    it('should succeed (200) with correct OTP and return tokens', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({
          userId: activeUser.id,
          otp: otp,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('should fail (400) with wrong OTP', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({
          userId: activeUser.id,
          otp: '123456', // wrong OTP
        });

      expect(res.status).toBe(400);
    });

    it('should fail (400) with expired OTP', async () => {
      // Delete OTP to simulate expiry
      await redis.del(`otp:${activeUser.id}`);

      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({
          userId: activeUser.id,
          otp: otp,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('expired');
    });

    it('should hit rate limit (429) on 6th failed OTP attempt', async () => {
      // Clear attempts first
      await redis.del(`otp_attempts:${activeUser.id}`);

      // Perform 5 wrong attempts (all should return 400)
      for (let i = 0; i < 5; i++) {
        const res = await request(app)
          .post('/api/v1/auth/verify-otp')
          .send({
            userId: activeUser.id,
            otp: '111111',
          });
        expect(res.status).toBe(400);
      }

      // The 6th attempt should fail with 429
      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({
          userId: activeUser.id,
          otp: '111111',
        });
      expect(res.status).toBe(429);
      expect(res.body.message).toContain('attempts exceeded');
    });
  });

  describe('POST /api/v1/auth/refresh and logout', () => {
    let refreshToken;

    beforeEach(async () => {
      // Clear attempts first to avoid rate-limiting from previous tests
      await redis.del(`otp_attempts:${activeUser.id}`);

      // Get tokens via valid login flow
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          emailOrAdminId: activeUser.email,
          password: password,
        });

      const otp = await redis.get(`otp:${activeUser.id}`);
      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({
          userId: activeUser.id,
          otp: otp,
        });

      refreshToken = res.body.data.refreshToken;
    });

    it('should get new access token (200) with valid refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: refreshToken,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should fail (401) with invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: 'invalid_token',
        });

      expect(res.status).toBe(401);
    });

    it('should logout successfully (200) and revoke token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .send({
          refreshToken: refreshToken,
        });

      expect(res.status).toBe(200);

      // Now verify refresh token fails (revoked)
      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: refreshToken,
        });
      expect(refreshRes.status).toBe(401);
    });
  });

  describe('GET /api/v1/auth/check-email', () => {
    it('should return available: true for unused email', async () => {
      const res = await request(app)
        .get(`/api/v1/auth/check-email?email=unused_${Date.now()}@test.com`);

      expect(res.status).toBe(200);
      expect(res.body.data.available).toBe(true);
    });

    it('should return available: false for used email', async () => {
      const res = await request(app)
        .get(`/api/v1/auth/check-email?email=${activeUser.email}`);

      expect(res.status).toBe(200);
      expect(res.body.data.available).toBe(false);
    });
  });
});
