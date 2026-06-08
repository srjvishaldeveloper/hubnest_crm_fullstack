const express = require('express');
const router = express.Router();
const ctrl = require('./marketing.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');

router.use(authenticate);

// GET /marketing/dashboard
router.get('/dashboard', authorize('campaigns', 'read'), ctrl.getDashboardAnalytics);

// GET /marketing/campaigns
router.get('/campaigns', authorize('campaigns', 'read'), ctrl.listCampaigns);

// POST /marketing/campaigns
router.post('/campaigns', authorize('campaigns', 'create'), ctrl.createCampaign);

// PATCH /marketing/campaigns/:id
router.patch('/campaigns/:id', authorize('campaigns', 'update'), ctrl.updateCampaign);

// GET /marketing/leads
router.get('/leads', authorize('leads', 'read'), ctrl.listLeads);

// GET /marketing/analytics
router.get('/analytics', authorize('campaigns', 'read'), ctrl.getDashboardAnalytics);

module.exports = router;
