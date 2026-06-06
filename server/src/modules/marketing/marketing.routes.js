const express = require('express');
const router = express.Router();
const ctrl = require('./marketing.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');

router.use(authenticate);

// Campaigns
router.post('/',         authorize('campaigns', 'create'), ctrl.createCampaign);
router.get('/',          authorize('campaigns', 'read'),   ctrl.listCampaigns);
router.get('/:id',       authorize('campaigns', 'read'),   ctrl.getCampaign);
router.patch('/:id',     authorize('campaigns', 'update'), ctrl.updateCampaign);
router.delete('/:id',    authorize('campaigns', 'delete'), ctrl.deleteCampaign);

module.exports = router;
