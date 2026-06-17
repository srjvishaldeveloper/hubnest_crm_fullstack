const express = require('express');
const router = express.Router();
const ctrl = require('./marketing.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');

router.use(authenticate);

// Leads
router.get('/',               authorize('leads', 'read'),   ctrl.listLeads);
router.patch('/:id',          authorize('leads', 'update'), ctrl.updateLead);
router.post('/assign',        authorize('leads', 'update'), ctrl.bulkAssignLeads);
router.get('/sales-users',    authorize('leads', 'read'),   ctrl.listSalesUsers);

// Analytics
router.get('/analytics',      authorize('campaigns', 'read'), ctrl.getDashboardAnalytics);
router.get('/analytics/roi',  authorize('campaigns', 'read'), ctrl.getROIData);

module.exports = router;
