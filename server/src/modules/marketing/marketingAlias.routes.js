const express = require('express');
const router = express.Router();
const ctrl = require('./marketing.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');

// Middleware chain - authenticate all routes
router.use(authenticate);

// GET /marketing/dashboard
router.get('/dashboard', authorize('campaigns', 'read'), ctrl.getDashboardAnalytics);
router.get('/analytics', authorize('campaigns', 'read'), ctrl.getDashboardAnalytics);
router.get('/roi', authorize('campaigns', 'read'), ctrl.getROIData);

// Campaigns CRUD
router.get('/campaigns', authorize('campaigns', 'read'), ctrl.listCampaigns);
router.post('/campaigns', authorize('campaigns', 'create'), ctrl.createCampaign);
router.get('/campaigns/:id', authorize('campaigns', 'read'), ctrl.getCampaign);
router.patch('/campaigns/:id', authorize('campaigns', 'update'), ctrl.updateCampaign);
router.delete('/campaigns/:id', authorize('campaigns', 'delete'), ctrl.deleteCampaign);

// Leads CRUD
router.get('/leads', authorize('leads', 'read'), ctrl.listLeads);
router.patch('/leads/:id', authorize('leads', 'update'), ctrl.updateLead);
router.post('/leads/bulk-assign', authorize('leads', 'update'), ctrl.bulkAssignLeads);

// Lists & Import Center
router.get('/lists', authorize('campaigns', 'read'), ctrl.listContactLists);
router.post('/lists', authorize('campaigns', 'create'), ctrl.createContactList);
router.delete('/lists/:id', authorize('campaigns', 'delete'), ctrl.deleteContactList);
router.post('/lists/import', authorize('campaigns', 'create'), ctrl.importContacts);

// Audience Segments
router.get('/segments', authorize('campaigns', 'read'), ctrl.listSegments);
router.post('/segments', authorize('campaigns', 'create'), ctrl.createSegment);
router.delete('/segments/:id', authorize('campaigns', 'delete'), ctrl.deleteSegment);

// Visual Workflows
router.get('/workflows', authorize('campaigns', 'read'), ctrl.listWorkflows);
router.post('/workflows', authorize('campaigns', 'create'), ctrl.createWorkflow);
router.get('/workflows/:id', authorize('campaigns', 'read'), ctrl.getWorkflow);
router.patch('/workflows/:id', authorize('campaigns', 'update'), ctrl.updateWorkflow);
router.delete('/workflows/:id', authorize('campaigns', 'delete'), ctrl.deleteWorkflow);
router.get('/workflows/:id/runs', authorize('campaigns', 'read'), ctrl.getWorkflowRuns);
router.post('/workflows/:id/execute', authorize('campaigns', 'update'), ctrl.executeWorkflow);

// Form Builder
router.get('/forms', authorize('campaigns', 'read'), ctrl.listForms);
router.post('/forms', authorize('campaigns', 'create'), ctrl.createForm);
router.patch('/forms/:id', authorize('campaigns', 'update'), ctrl.updateForm);
router.delete('/forms/:id', authorize('campaigns', 'delete'), ctrl.deleteFormCtrl);
router.get('/forms/:id/public', ctrl.getFormPublic);
router.post('/forms/:id/submit', ctrl.submitForm);
router.get('/forms/:id/submissions', authorize('campaigns', 'read'), ctrl.getFormSubmissions);

// Landing Pages
router.get('/pages', authorize('campaigns', 'read'), ctrl.listLandingPages);
router.post('/pages', authorize('campaigns', 'create'), ctrl.createLandingPage);
router.patch('/pages/:id', authorize('campaigns', 'update'), ctrl.updateLandingPage);
router.delete('/pages/:id', authorize('campaigns', 'delete'), ctrl.deleteLandingPage);

// Template Library
router.get('/templates', authorize('campaigns', 'read'), ctrl.listTemplates);
router.post('/templates', authorize('campaigns', 'create'), ctrl.createTemplate);
router.delete('/templates/:id', authorize('campaigns', 'delete'), ctrl.deleteTemplate);

// Media Library
router.get('/media', authorize('campaigns', 'read'), ctrl.listMedia);
router.post('/media', authorize('campaigns', 'create'), ctrl.createMedia);

// Subscriptions
router.get('/subscriptions', authorize('campaigns', 'read'), ctrl.listSubscriptions);
router.post('/subscriptions', authorize('campaigns', 'update'), ctrl.updateSubscription);

// Webhooks & APIs
router.get('/webhooks', authorize('campaigns', 'read'), ctrl.listWebhooks);
router.post('/webhooks', authorize('campaigns', 'create'), ctrl.createWebhook);
router.delete('/webhooks/:id', authorize('campaigns', 'delete'), ctrl.deleteWebhook);

// Campaign Builder — send, stats, import
router.post('/campaigns/:id/send',     authorize('campaigns', 'create'), ctrl.sendCampaign);
router.get('/campaigns/:id/stats',     authorize('campaigns', 'read'),   ctrl.getCampaignStats);
router.post('/contacts/import',        authorize('campaigns', 'create'), ctrl.importCampaignContacts);

// Campaign Template Gallery
router.get('/campaign-templates',      authorize('campaigns', 'read'),   ctrl.listCampaignTemplates);
router.get('/campaign-templates/:id',  authorize('campaigns', 'read'),   ctrl.getCampaignTemplateById);

// AI Studio Proxies
router.post('/ai/:serviceName/:endpoint', authorize('campaigns', 'create'), ctrl.aiProxyHandler);

// Integration Settings (Meta / WhatsApp / etc.)
router.get('/integrations',             authorize('campaigns', 'read'),   ctrl.getIntegrationSettings);
router.post('/integrations',            authorize('campaigns', 'update'), ctrl.upsertIntegrationSettings);
router.delete('/integrations/:provider',authorize('campaigns', 'update'), ctrl.deleteIntegrationSettings);
router.post('/integrations/:provider/test', authorize('campaigns', 'update'), ctrl.testIntegration);

module.exports = router;
