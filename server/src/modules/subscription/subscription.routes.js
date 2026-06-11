const express = require('express');
const router = express.Router();
const ctrl = require('./subscription.controller');
const { authenticate } = require('../../middleware/auth');

// Public — list available plans (still requires auth to protect pricing info)
router.get('/plans',    authenticate, ctrl.getPlans);

// Authenticated — tenant's current plan & usage
router.get('/current',  authenticate, ctrl.getCurrentPlan);
router.get('/usage',    authenticate, ctrl.getUsageDashboard);

// Admin only — upgrade / change plan
router.post('/upgrade', authenticate, ctrl.upgradePlan);

module.exports = router;
