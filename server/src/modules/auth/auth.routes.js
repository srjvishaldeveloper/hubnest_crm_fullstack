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
const { loginRateLimiter, otpRateLimiter, emailCheckRateLimiter } = require('../../middleware/rateLimiter');

const { authenticate } = require('../../middleware/auth');
const { authorizeSuperAdmin } = require('../../middleware/rbac');

router.get('/check-email',       emailCheckRateLimiter,                    ctrl.checkEmail);
router.post('/login',           loginRateLimiter, loginValidator,          ctrl.login);
router.post('/verify-otp',      otpRateLimiter,   verifyOtpValidator,      ctrl.verifyOtp);
router.post('/resend-otp',      otpRateLimiter,   resendOtpValidator,      ctrl.resendOtp);
router.post('/refresh',                           refreshTokenValidator,   ctrl.refresh);
router.post('/logout',                                                     ctrl.logout);
router.post('/forgot-password', otpRateLimiter,   forgotPasswordValidator, ctrl.forgotPassword);
router.post('/reset-password',                    resetPasswordValidator,  ctrl.resetPassword);

// Google OAuth login (no OTP step — Google already verified the identity)
router.post('/google',          loginRateLimiter,                          ctrl.googleLogin);

// Phone-based login (OTP via Fast2SMS)
router.post('/send-phone-otp',  otpRateLimiter, ctrl.sendPhoneOtp);
router.post('/login-phone',     otpRateLimiter, ctrl.loginWithPhone);
// Spec-named aliases
router.post('/send-otp',        otpRateLimiter, ctrl.sendPhoneOtp);
router.post('/verify-otp-phone',otpRateLimiter, ctrl.loginWithPhone);
// Super Admin only — all tenant management endpoints require authentication
router.post('/send-credentials',   authenticate, authorizeSuperAdmin, ctrl.sendCredentials);
router.post('/create-tenant',      authenticate, authorizeSuperAdmin, ctrl.createTenant);
router.post('/reset-tenant-admin', authenticate, authorizeSuperAdmin, ctrl.resetTenantAdmin);
router.post('/block-tenant-admin', authenticate, authorizeSuperAdmin, ctrl.blockTenantAdmin);
router.post('/delete-tenant-admin',authenticate, authorizeSuperAdmin, ctrl.deleteTenantAdmin);
router.get('/tenant-admins',       authenticate, authorizeSuperAdmin, ctrl.getTenantAdmins);

// Profile management
router.get('/profile',              authenticate, ctrl.getProfile);
router.put('/profile',              authenticate, ctrl.updateProfile);
router.patch('/profile',            authenticate, ctrl.updateProfile);
router.post('/profile/avatar',      authenticate, ctrl.uploadAvatar);
router.get('/profile/documents',    authenticate, ctrl.getDocuments);
router.post('/profile/documents',   authenticate, ctrl.uploadDocument);
router.delete('/profile/documents/:id', authenticate, ctrl.deleteDocument);
router.put('/change-password',      authenticate, ctrl.changePassword);
router.post('/change-password',     authenticate, ctrl.changePassword);
router.get('/active-sessions',      authenticate, ctrl.getActiveSessions);
router.post('/logout-other-devices',authenticate, ctrl.logoutOtherDevices);
router.post('/revoke-session',      authenticate, ctrl.revokeSession);

// Tenant User management
router.post('/create-user',         authenticate, ctrl.createUser);
router.get('/users',               authenticate, ctrl.getUsers);
router.patch('/users/:id',         authenticate, ctrl.updateUser);
router.delete('/users/:id',        authenticate, ctrl.deleteUser);
router.post('/users/:id/restore',   authenticate, ctrl.restoreUser);
router.post('/users/toggle-block', authenticate, ctrl.toggleBlockUser);
router.post('/users/:id/reset-password', authenticate, ctrl.resetUserPassword);

module.exports = router;
