const subscriptionService = require('../../services/subscriptionService');
const { sendSuccess, sendError } = require('../../utils/helpers');
const logger = require('../../utils/logger');

/**
 * GET /subscription/plans — list all available plans (public)
 */
async function getPlans(req, res) {
  try {
    const plans = await subscriptionService.getAvailablePlans();
    return sendSuccess(res, { plans }, 'Plans retrieved successfully');
  } catch (err) {
    logger.error('Failed to retrieve plans', { message: err.message });
    return sendError(res, err.message || 'Failed to retrieve plans', 500);
  }
}

/**
 * GET /subscription/current — get the authenticated tenant's current plan
 */
async function getCurrentPlan(req, res) {
  const tenantId = req.user.tenant_id;
  if (!tenantId) {
    return sendError(res, 'Tenant context required', 400);
  }

  try {
    const plan = await subscriptionService.getTenantPlan(tenantId);
    if (!plan) {
      return sendError(res, 'No active subscription found for this tenant', 404);
    }
    return sendSuccess(res, { subscription: plan }, 'Current plan retrieved successfully');
  } catch (err) {
    logger.error('Failed to retrieve current plan', { tenantId, message: err.message });
    return sendError(res, err.message || 'Failed to retrieve current plan', 500);
  }
}

/**
 * GET /subscription/usage — usage dashboard for the authenticated tenant
 */
async function getUsageDashboard(req, res) {
  const tenantId = req.user.tenant_id;
  if (!tenantId) {
    return sendError(res, 'Tenant context required', 400);
  }

  try {
    const usage = await subscriptionService.getUsage(tenantId);
    const plan = await subscriptionService.getTenantPlan(tenantId);

    return sendSuccess(res, {
      plan: plan ? { name: plan.plan.name, slug: plan.plan.slug } : null,
      usage,
    }, 'Usage dashboard retrieved successfully');
  } catch (err) {
    logger.error('Failed to retrieve usage dashboard', { tenantId, message: err.message });
    return sendError(res, err.message || 'Failed to retrieve usage dashboard', 500);
  }
}

/**
 * POST /subscription/upgrade — upgrade (or change) the tenant's plan
 * Body: { planSlug, billingCycle }
 */
async function upgradePlan(req, res) {
  const tenantId = req.user.tenant_id;
  const { planSlug, billingCycle } = req.body;

  if (!tenantId) {
    return sendError(res, 'Tenant context required', 400);
  }
  if (!planSlug) {
    return sendError(res, 'planSlug is required', 400);
  }

  try {
    const result = await subscriptionService.assignPlan(tenantId, planSlug, billingCycle || 'monthly');
    return sendSuccess(res, result, 'Plan upgraded successfully');
  } catch (err) {
    logger.error('Failed to upgrade plan', { tenantId, planSlug, message: err.message });
    return sendError(res, err.message || 'Failed to upgrade plan', err.statusCode || 500);
  }
}

module.exports = {
  getPlans,
  getCurrentPlan,
  getUsageDashboard,
  upgradePlan,
};
