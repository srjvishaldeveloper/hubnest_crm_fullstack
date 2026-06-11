const { checkLimit } = require('../services/subscriptionService');
const { sendError } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Middleware factory that enforces plan limits for a specific resource.
 * Usage: router.post('/leads', authenticate, enforcePlanLimit('leads'), handler)
 *
 * Super Admin bypasses all plan limit checks.
 */
function enforcePlanLimit(resource) {
  return async (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    // Super Admin bypasses plan enforcement
    if (req.user.role_name === 'Super Admin') {
      return next();
    }

    const tenantId = req.user.tenant_id;
    if (!tenantId) {
      return sendError(res, 'Tenant context required', 400);
    }

    try {
      const result = await checkLimit(tenantId, resource);

      if (!result.allowed) {
        logger.warn('Plan limit reached', { tenantId, resource, current: result.current, limit: result.limit });
        return sendError(
          res,
          `Plan limit reached for ${resource}. Current: ${result.current}/${result.limit}. Please upgrade your plan to add more.`,
          403
        );
      }

      // Attach limit info to request for downstream use
      req.planLimit = result;
      next();
    } catch (err) {
      logger.error('Plan enforcement check failed', { tenantId, resource, message: err.message });
      return sendError(res, 'Failed to verify plan limits', 500);
    }
  };
}

module.exports = { enforcePlanLimit };
