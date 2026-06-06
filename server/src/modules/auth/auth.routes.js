const express = require('express');
const router = express.Router();
const ctrl = require('./auth.controller');
const {
  loginValidator,
  verifyOtpValidator,
  refreshTokenValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  resendOtpValidator,
} = require('./auth.validator');
const { loginRateLimiter, otpRateLimiter } = require('../../middleware/rateLimiter');

const { authenticate } = require('../../middleware/auth');
const { authorizeSuperAdmin } = require('../../middleware/rbac');

router.post('/login',           loginRateLimiter, loginValidator,          ctrl.login);
router.post('/verify-otp',      otpRateLimiter,   verifyOtpValidator,      ctrl.verifyOtp);
router.post('/resend-otp',      otpRateLimiter,   resendOtpValidator,      ctrl.resendOtp);
router.post('/refresh',                           refreshTokenValidator,   ctrl.refresh);
router.post('/logout',                                                     ctrl.logout);
router.post('/forgot-password', otpRateLimiter,   forgotPasswordValidator, ctrl.forgotPassword);
router.post('/reset-password',                    resetPasswordValidator,  ctrl.resetPassword);
// Super Admin only — all tenant management endpoints require authentication
router.post('/send-credentials',   authenticate, authorizeSuperAdmin, ctrl.sendCredentials);
router.post('/create-tenant',      authenticate, authorizeSuperAdmin, ctrl.createTenant);
router.post('/reset-tenant-admin', authenticate, authorizeSuperAdmin, ctrl.resetTenantAdmin);
router.post('/block-tenant-admin', authenticate, authorizeSuperAdmin, ctrl.blockTenantAdmin);
router.post('/delete-tenant-admin',authenticate, authorizeSuperAdmin, ctrl.deleteTenantAdmin);
router.get('/tenant-admins',       authenticate, authorizeSuperAdmin, ctrl.getTenantAdmins);

// Tenant User management
router.post('/create-user',         authenticate, ctrl.createUser);
router.get('/users',               authenticate, ctrl.getUsers);
router.delete('/users/:id',        authenticate, ctrl.deleteUser);
router.post('/users/toggle-block', authenticate, ctrl.toggleBlockUser);
router.post('/users/:id/reset-password', authenticate, ctrl.resetUserPassword);

module.exports = router;
