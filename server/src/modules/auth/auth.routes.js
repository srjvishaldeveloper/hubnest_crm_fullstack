const express = require('express');
const router = express.Router();
const ctrl = require('./auth.controller');
const {
  loginValidator,
  verifyOtpValidator,
  refreshTokenValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require('./auth.validator');
const { loginRateLimiter, otpRateLimiter } = require('../../middleware/rateLimiter');

router.post('/login',           loginRateLimiter, loginValidator,          ctrl.login);
router.post('/verify-otp',      otpRateLimiter,   verifyOtpValidator,      ctrl.verifyOtp);
router.post('/refresh',                           refreshTokenValidator,   ctrl.refresh);
router.post('/logout',                                                     ctrl.logout);
router.post('/forgot-password', otpRateLimiter,   forgotPasswordValidator, ctrl.forgotPassword);
router.post('/reset-password',                    resetPasswordValidator,  ctrl.resetPassword);

module.exports = router;
