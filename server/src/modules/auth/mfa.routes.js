const express = require('express');
const router = express.Router();
const ctrl = require('./mfa.controller');
const { authenticate } = require('../../middleware/auth');

// All MFA routes require authentication
router.use(authenticate);

// MFA Settings
router.get('/settings',               ctrl.getMFASettings);
router.put('/settings',               ctrl.updateMFASettings);

// Phone Verification
router.post('/send-phone-verification', ctrl.sendPhoneVerification);
router.post('/verify-phone',            ctrl.verifyPhone);

// Audit Log
router.get('/audit-log',              ctrl.getAuditLog);
router.get('/login-stats',            ctrl.getLoginStats);

module.exports = router;
