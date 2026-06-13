const svc = require('./marketing.service');
const { sendSuccess, sendError } = require('../../utils/helpers');
const axios = require('axios');

// Microservice endpoints config
const SERVICES = {
  form: 'http://localhost:8004',
  workflow: 'http://localhost:8005',
  campaign: 'http://localhost:8006',
  content: 'http://localhost:8007',
  segmentation: 'http://localhost:8008',
  analytics: 'http://localhost:8009',
  leadScoring: 'http://localhost:8010',
  queryBuilder: 'http://localhost:8011'
};

// --- Campaigns ---
async function createCampaign(req, res) {
  const campaign = await svc.createCampaign(req.user.tenant_id, req.user.id, req.body);
  sendSuccess(res, { campaign }, 'Campaign created', 201);
}

async function listCampaigns(req, res) {
  const { status, platform } = req.query;
  const campaigns = await svc.listCampaigns(req.user.tenant_id, { status, platform });
  sendSuccess(res, { campaigns });
}

async function getCampaign(req, res) {
  const campaign = await svc.getCampaignById(req.user.tenant_id, req.params.id);
  if (!campaign) return sendError(res, 'Campaign not found', 404);
  sendSuccess(res, { campaign });
}

async function updateCampaign(req, res) {
  const campaign = await svc.updateCampaign(req.user.tenant_id, req.params.id, req.body);
  if (!campaign) return sendError(res, 'Campaign not found', 404);
  sendSuccess(res, { campaign });
}

async function deleteCampaign(req, res) {
  const deleted = await svc.deleteCampaign(req.user.tenant_id, req.params.id);
  if (!deleted) return sendError(res, 'Campaign not found', 404);
  sendSuccess(res, {}, 'Campaign deleted');
}

// --- Leads & Assignment ---
async function listLeads(req, res) {
  const { status, source, platform, campaign_id } = req.query;
  const leads = await svc.listLeads(req.user.tenant_id, { status, source, platform, campaign_id });
  sendSuccess(res, { leads });
}

async function updateLead(req, res) {
  const lead = await svc.updateLead(req.user.tenant_id, req.params.id, req.body);
  if (!lead) return sendError(res, 'Lead not found', 404);
  sendSuccess(res, { lead });
}

async function bulkAssignLeads(req, res) {
  const { leadIds, assignedTo } = req.body;
  if (!Array.isArray(leadIds) || !leadIds.length || !assignedTo) {
    return sendError(res, 'leadIds array and assignedTo are required', 400);
  }
  const result = await svc.bulkAssignLeads(req.user.tenant_id, leadIds, assignedTo);
  sendSuccess(res, result, 'Leads assigned');
}

async function getDashboardAnalytics(req, res) {
  const data = await svc.getDashboardAnalytics(req.user.tenant_id);
  sendSuccess(res, data);
}

async function getROIData(req, res) {
  const data = await svc.getROIData(req.user.tenant_id);
  sendSuccess(res, { roi: data });
}

// --- Contact Lists & Import Center ---
async function listContactLists(req, res) {
  const lists = await svc.listContactLists(req.user.tenant_id);
  sendSuccess(res, { lists });
}

async function createContactList(req, res) {
  const list = await svc.createContactList(req.user.tenant_id, req.body);
  sendSuccess(res, { list }, 'Contact list created', 201);
}

async function deleteContactList(req, res) {
  const success = await svc.deleteContactList(req.user.tenant_id, req.params.id);
  if (!success) return sendError(res, 'Contact list not found', 404);
  sendSuccess(res, {}, 'Contact list deleted');
}

async function importContacts(req, res) {
  const { listId, contacts } = req.body;
  if (!listId || !Array.isArray(contacts)) {
    return sendError(res, 'listId and contacts array are required', 400);
  }
  
  // Create leads in leads_marketing table first
  const contactIds = [];
  for (const c of contacts) {
    const queryStr = `
      INSERT INTO leads_marketing (tenant_id, name, email, phone, source, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT DO NOTHING
      RETURNING id
    `;
    const result = await svc.query ? await svc.query(queryStr, [req.user.tenant_id, c.name, c.email || null, c.phone || null, 'CSV Import', 'New']) : { rows: [] };
    if (result.rows[0]) {
      contactIds.push(result.rows[0].id);
    }
  }

  // Bind to marketing list
  if (contactIds.length > 0) {
    await svc.addContactsToList(req.user.tenant_id, listId, contactIds);
  }

  sendSuccess(res, { importedCount: contactIds.length }, 'Import completed successfully');
}

// --- Audience Segments ---
async function listSegments(req, res) {
  const segments = await svc.listSegments(req.user.tenant_id);
  sendSuccess(res, { segments });
}

async function createSegment(req, res) {
  const segment = await svc.createSegment(req.user.tenant_id, req.body);
  sendSuccess(res, { segment }, 'Segment created', 201);
}

async function deleteSegment(req, res) {
  const success = await svc.deleteSegment(req.user.tenant_id, req.params.id);
  if (!success) return sendError(res, 'Segment not found', 404);
  sendSuccess(res, {}, 'Segment deleted');
}

// --- Visual Workflows ---
async function listWorkflows(req, res) {
  const workflows = await svc.listWorkflows(req.user.tenant_id);
  sendSuccess(res, { workflows });
}

async function createWorkflow(req, res) {
  const workflow = await svc.createWorkflow(req.user.tenant_id, req.user.id, req.body);
  sendSuccess(res, { workflow }, 'Workflow created', 201);
}

async function getWorkflow(req, res) {
  const workflow = await svc.getWorkflow(req.user.tenant_id, req.params.id);
  if (!workflow) return sendError(res, 'Workflow not found', 404);
  sendSuccess(res, { workflow });
}

async function updateWorkflow(req, res) {
  const workflow = await svc.updateWorkflow(req.user.tenant_id, req.params.id, req.body);
  if (!workflow) return sendError(res, 'Workflow not found', 404);
  sendSuccess(res, { workflow }, 'Workflow updated');
}

async function executeWorkflow(req, res) {
  const run = await svc.triggerWorkflowRun(req.user.tenant_id, req.params.id);
  sendSuccess(res, { run }, 'Workflow execution started');
}

async function deleteWorkflow(req, res) {
  const success = await svc.deleteWorkflow(req.user.tenant_id, req.params.id);
  if (!success) return sendError(res, 'Workflow not found', 404);
  sendSuccess(res, {}, 'Workflow deleted');
}

async function getWorkflowRuns(req, res) {
  const runs = await svc.getWorkflowRuns(req.user.tenant_id, req.params.id);
  sendSuccess(res, { runs });
}

// --- Form Builder ---
async function listForms(req, res) {
  const forms = await svc.listForms(req.user.tenant_id);
  sendSuccess(res, { forms });
}

async function createForm(req, res) {
  const form = await svc.createForm(req.user.tenant_id, req.body);
  sendSuccess(res, { form }, 'Form created', 201);
}

async function updateForm(req, res) {
  const form = await svc.updateForm(req.user.tenant_id, req.params.id, req.body);
  if (!form) return sendError(res, 'Form not found', 404);
  sendSuccess(res, { form }, 'Form updated');
}

async function deleteFormCtrl(req, res) {
  const deleted = await svc.deleteForm(req.user.tenant_id, req.params.id);
  if (!deleted) return sendError(res, 'Form not found', 404);
  sendSuccess(res, {}, 'Form deleted');
}

async function getFormPublic(req, res) {
  const form = await svc.getFormByIdPublic(req.params.id);
  if (!form) return sendError(res, 'Form not found', 404);
  // Never expose tenant_id or internal fields to public
  const { tenant_id: _t, ...publicForm } = form;
  sendSuccess(res, { form: publicForm });
}

async function submitFormPublic(req, res) {
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];
  const submission = await svc.submitFormPublic(req.params.id, req.body, ip, userAgent);
  if (!submission) return sendError(res, 'Form not found', 404);
  sendSuccess(res, { submission }, 'Submission received', 201);
}

async function submitForm(req, res) {
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];
  const submission = await svc.submitForm(req.user.tenant_id, req.params.id, req.body, ip, userAgent);
  sendSuccess(res, { submission }, 'Submission logged', 201);
}

async function getFormSubmissions(req, res) {
  const submissions = await svc.getFormSubmissions(req.user.tenant_id, req.params.id);
  sendSuccess(res, { submissions });
}

// --- Landing Pages ---
async function listLandingPages(req, res) {
  const pages = await svc.listLandingPages(req.user.tenant_id);
  sendSuccess(res, { pages });
}

async function createLandingPage(req, res) {
  const page = await svc.createLandingPage(req.user.tenant_id, req.body);
  sendSuccess(res, { page }, 'Landing page created', 201);
}

async function updateLandingPage(req, res) {
  const page = await svc.updateLandingPage(req.user.tenant_id, req.params.id, req.body);
  if (!page) return sendError(res, 'Landing page not found', 404);
  sendSuccess(res, { page }, 'Landing page updated');
}

async function deleteLandingPage(req, res) {
  const success = await svc.deleteLandingPage(req.user.tenant_id, req.params.id);
  if (!success) return sendError(res, 'Landing page not found', 404);
  sendSuccess(res, {}, 'Landing page deleted');
}

// --- Templates ---
async function listTemplates(req, res) {
  const { type } = req.query;
  const templates = await svc.listTemplates(req.user.tenant_id, type);
  sendSuccess(res, { templates });
}

async function createTemplate(req, res) {
  const template = await svc.createTemplate(req.user.tenant_id, req.body);
  sendSuccess(res, { template }, 'Template created', 201);
}

async function deleteTemplate(req, res) {
  const success = await svc.deleteTemplate(req.user.tenant_id, req.params.id);
  if (!success) return sendError(res, 'Template not found', 404);
  sendSuccess(res, {}, 'Template deleted');
}

// --- Media ---
async function listMedia(req, res) {
  const media = await svc.listMedia(req.user.tenant_id);
  sendSuccess(res, { media });
}

async function createMedia(req, res) {
  const asset = await svc.createMedia(req.user.tenant_id, req.body);
  sendSuccess(res, { asset }, 'Media asset created', 201);
}

// --- Subscriptions ---
async function listSubscriptions(req, res) {
  const subscriptions = await svc.listSubscriptions(req.user.tenant_id);
  sendSuccess(res, { subscriptions });
}

async function updateSubscription(req, res) {
  const subscription = await svc.updateSubscription(req.user.tenant_id, req.body);
  sendSuccess(res, { subscription }, 'Subscription updated');
}

// --- Webhooks ---
async function listWebhooks(req, res) {
  const webhooks = await svc.listWebhooks(req.user.tenant_id);
  sendSuccess(res, { webhooks });
}

async function createWebhook(req, res) {
  const webhook = await svc.createWebhook(req.user.tenant_id, req.body);
  sendSuccess(res, { webhook }, 'Webhook created', 201);
}

async function deleteWebhook(req, res) {
  const success = await svc.deleteWebhook(req.user.tenant_id, req.params.id);
  if (!success) return sendError(res, 'Webhook not found', 404);
  sendSuccess(res, {}, 'Webhook deleted');
}

// --- Campaign Builder: Send + Stats + Import ---

async function sendCampaign(req, res) {
  const { id } = req.params;
  const { tenantId = req.user.tenant_id } = {};
  try {
    const campaign = await svc.getCampaignById(tenantId, id);
    if (!campaign) return sendError(res, 'Campaign not found', 404);

    // Get contacts for the campaign's list
    const contacts = await svc.getCampaignContacts(tenantId, id);
    if (!contacts.length) return sendError(res, 'No contacts found for this campaign', 400);

    // Queue logs as 'queued' initially
    await svc.queueCampaignLogs(tenantId, id, contacts.map(c => c.id));

    // Update campaign status to Sending
    await svc.updateCampaign(tenantId, id, { status: 'Sending' });

    sendSuccess(res, {
      queued: contacts.length,
      campaignId: id,
      status: 'Sending',
    }, `Campaign queued for ${contacts.length} contacts`);
  } catch (err) {
    sendError(res, err.message, 500);
  }
}

async function getCampaignStats(req, res) {
  try {
    const stats = await svc.getCampaignStats(req.user.tenant_id, req.params.id);
    sendSuccess(res, { stats });
  } catch (err) {
    sendError(res, err.message, 500);
  }
}

async function importCampaignContacts(req, res) {
  const { listId, contacts, createList, listName } = req.body;
  const tenantId = req.user.tenant_id;

  if (!Array.isArray(contacts) || !contacts.length) {
    return sendError(res, 'contacts array is required', 400);
  }

  try {
    let targetListId = listId;

    // Auto-create list if requested
    if (createList && listName) {
      const newList = await svc.createContactList(tenantId, { name: listName, description: 'Imported via Campaign Builder' });
      targetListId = newList.id;
    }

    if (!targetListId) return sendError(res, 'listId or createList+listName required', 400);

    const { imported, skipped } = await svc.importContactsToList(tenantId, targetListId, contacts);
    sendSuccess(res, { imported, skipped, listId: targetListId }, `${imported} contacts imported`);
  } catch (err) {
    sendError(res, err.message, 500);
  }
}

// --- Integration Settings (Meta / WhatsApp / etc.) ---
async function getIntegrationSettings(req, res) {
  try {
    const settings = await svc.getIntegrationSettings(req.user.tenant_id);
    sendSuccess(res, { settings });
  } catch (err) {
    sendError(res, err.message, 500);
  }
}

async function upsertIntegrationSettings(req, res) {
  const { provider, credentials, enabled } = req.body;
  if (!provider) return sendError(res, 'provider is required', 400);
  try {
    const settings = await svc.upsertIntegrationSettings(req.user.tenant_id, provider, credentials || {}, enabled !== false);
    sendSuccess(res, { settings }, 'Integration saved');
  } catch (err) {
    sendError(res, err.message, 500);
  }
}

async function deleteIntegrationSettings(req, res) {
  const { provider } = req.params;
  try {
    await svc.deleteIntegrationSettings(req.user.tenant_id, provider);
    sendSuccess(res, {}, 'Integration disconnected');
  } catch (err) {
    sendError(res, err.message, 500);
  }
}

async function testIntegration(req, res) {
  const { provider } = req.params;
  try {
    const result = await svc.testIntegration(req.user.tenant_id, provider);
    sendSuccess(res, result, result.success ? 'Connection successful' : 'Connection failed');
  } catch (err) {
    sendError(res, err.message, 500);
  }
}

// --- AI Studio proxies ---
async function aiProxyHandler(req, res) {
  const { serviceName, endpoint } = req.params;
  const baseUrl = SERVICES[serviceName];
  if (!baseUrl) {
    return sendError(res, `Invalid microservice: ${serviceName}`, 400);
  }
  
  try {
    const response = await axios.post(`${baseUrl}/${endpoint}`, req.body, {
      headers: { 'Content-Type': 'application/json' }
    });
    sendSuccess(res, response.data);
  } catch (err) {
    // If microservice is not online locally, trigger mock fallback directly
    if (serviceName === 'form') {
      sendSuccess(res, {
        success: true,
        form: {
          fields: [
            {"id": "name", "label": "Full Name", "type": "text", "required": true},
            {"id": "email", "label": "Email Address", "type": "email", "required": true}
          ],
          settings: { "title": "AI Generated Form" }
        }
      });
    } else {
      sendError(res, `Failed calling microservice: ${err.message}`, 500);
    }
  }
}

module.exports = {
  createCampaign, listCampaigns, getCampaign, updateCampaign, deleteCampaign,
  listLeads, updateLead, bulkAssignLeads,
  getIntegrationSettings, upsertIntegrationSettings, deleteIntegrationSettings, testIntegration,
  getDashboardAnalytics, getROIData,
  
  // Lists
  listContactLists, createContactList, deleteContactList, importContacts,
  
  // Segments
  listSegments, createSegment, deleteSegment,
  
  // Workflows
  listWorkflows, createWorkflow, getWorkflow, updateWorkflow, deleteWorkflow, getWorkflowRuns, executeWorkflow,
  
  // Forms
  listForms, createForm, updateForm, deleteFormCtrl, getFormPublic, submitFormPublic, submitForm, getFormSubmissions,
  
  // Landing Pages
  listLandingPages, createLandingPage, updateLandingPage, deleteLandingPage,
  
  // Templates
  listTemplates, createTemplate, deleteTemplate,
  
  // Media
  listMedia, createMedia,
  
  // Subscriptions
  listSubscriptions, updateSubscription,
  
  // Webhooks
  listWebhooks, createWebhook, deleteWebhook,
  
  // Campaign Builder
  sendCampaign, getCampaignStats, importCampaignContacts,

  // Campaign Template Gallery
  listCampaignTemplates, getCampaignTemplateById,

  // AI Proxy
  aiProxyHandler
};

// ─── Campaign Template Gallery ────────────────────────────────────────────────

async function listCampaignTemplates(req, res) {
  const { type, category, search } = req.query;
  const templates = await svc.listCampaignTemplates(req.user.tenant_id, { type, category, search });
  sendSuccess(res, { templates });
}

async function getCampaignTemplateById(req, res) {
  const tpl = await svc.getCampaignTemplateById(req.user.tenant_id, req.params.id);
  if (!tpl) return sendError(res, 'Template not found', 404);
  sendSuccess(res, { template: tpl });
}
