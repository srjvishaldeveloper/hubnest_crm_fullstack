const svc = require('./marketing.service');
const { sendSuccess, sendError } = require('../../utils/helpers');

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

module.exports = {
  createCampaign, listCampaigns, getCampaign, updateCampaign, deleteCampaign,
  listLeads, updateLead, bulkAssignLeads,
  getDashboardAnalytics, getROIData,
};
