const express = require('express');
const router = express.Router();
const ctrl = require('./marketing.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');

router.use(authenticate);


// Dashboard
router.get('/dashboard', authorize('campaigns', 'read'), ctrl.getDashboard);
router.get('/roi',       authorize('campaigns', 'read'), ctrl.getRoi);

// Campaign Analytics — record and retrieve real performance data
router.get('/analytics',  authorize('campaigns', 'read'),   ctrl.getAnalytics);
router.post('/analytics', authorize('campaigns', 'create'), ctrl.recordAnalytics);

// Campaigns

router.post('/',         authorize('campaigns', 'create'), ctrl.createCampaign);
router.get('/',          authorize('campaigns', 'read'),   ctrl.listCampaigns);
router.get('/:id',       authorize('campaigns', 'read'),   ctrl.getCampaign);
router.patch('/:id',     authorize('campaigns', 'update'), ctrl.updateCampaign);
router.delete('/:id',    authorize('campaigns', 'delete'), ctrl.deleteCampaign);

module.exports = router;
