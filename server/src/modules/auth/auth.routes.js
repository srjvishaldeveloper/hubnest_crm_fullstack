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

router.post('/login',           loginRateLimiter, loginValidator,          ctrl.login);
router.post('/verify-otp',      otpRateLimiter,   verifyOtpValidator,      ctrl.verifyOtp);
router.post('/resend-otp',      otpRateLimiter,   resendOtpValidator,      ctrl.resendOtp);
router.post('/refresh',                           refreshTokenValidator,   ctrl.refresh);
router.post('/logout',                                                     ctrl.logout);
router.post('/forgot-password', otpRateLimiter,   forgotPasswordValidator, ctrl.forgotPassword);
router.post('/reset-password',                    resetPasswordValidator,  ctrl.resetPassword);
router.post('/send-credentials',                                           ctrl.sendCredentials);
router.post('/create-tenant',                                              ctrl.createTenant);
router.post('/reset-tenant-admin',                                         ctrl.resetTenantAdmin);
router.post('/block-tenant-admin',                                         ctrl.blockTenantAdmin);
router.post('/delete-tenant-admin',                                        ctrl.deleteTenantAdmin);

module.exports = router;
