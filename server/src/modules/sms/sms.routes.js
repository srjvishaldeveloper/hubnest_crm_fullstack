const express  = require('express');
const router   = express.Router();
const ctrl     = require('./sms.controller');
const { authenticate }       = require('../../middleware/auth');
const { authorizeSuperAdmin } = require('../../middleware/rbac');

// All SMS routes require authentication
router.use(authenticate);

// SMS logs — Super Admin only
router.get('/logs',    authorizeSuperAdmin, ctrl.getLogs);
router.get('/stats',   authorizeSuperAdmin, ctrl.getStats);

// SMS settings — Super Admin only
router.get('/settings',  authorizeSuperAdmin, ctrl.getSettings);
router.put('/settings',  authorizeSuperAdmin, ctrl.updateSettings);

// Test SMS — Super Admin only
router.post('/test',   authorizeSuperAdmin, ctrl.testSms);

module.exports = router;
