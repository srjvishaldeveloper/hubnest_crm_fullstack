const { sendError } = require('../utils/helpers');

/**
 * Authorize a specific action on a module.
 * Super Admin bypasses all RBAC checks.
 * Usage: router.get('/users', authenticate, authorize('users', 'read'), handler)
 */
function authorize(module, action) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    // Super Admin has full access
    if (req.user.role_name === 'Super Admin') {
      return next();
    }

    // Sales Manager has broad access to team + sales modules
    if (req.user.role_name === 'Sales Manager') {
      const smModules = ['leads', 'tasks', 'activities', 'team', 'reports', 'users'];
      if (smModules.includes(module)) return next();
    }

    // Admin has full access to all modules
    if (req.user.role_name === 'Admin') {
      return next();
    }

    // Marketing roles have full access to all marketing modules
    if (['Marketing Head', 'Marketing Executive'].includes(req.user.role_name)) {
      const marketingModules = ['campaigns', 'leads', 'reports'];
      if (marketingModules.includes(module)) return next();
    }

    // Sales Executives always have permission to read/create/update/delete their own leads, tasks, and activities
    if (req.user.role_name === 'Sales Executive') {
      if (['leads', 'tasks', 'activities'].includes(module) && ['read', 'create', 'update', 'delete'].includes(action)) {
        return next();
      }
    }

    const perms = req.user.permissions;
    if (!perms || !perms[module] || !perms[module][action]) {
      return sendError(
        res,
        `Access denied. You do not have permission to ${action} ${module}.`,
        403
      );
    }

    next();
  };
}

/**
 * Middleware to restrict routes to Sales Manager (and Admin/Super Admin) only.
 */
function authorizeSalesManager(req, res, next) {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const allowed = ['Sales Manager', 'Admin', 'Super Admin'];
  if (!allowed.includes(req.user.role_name)) {
    return sendError(res, 'Access denied. Sales Manager role required.', 403);
  }
  next();
}

/**
 * Middleware to restrict routes to Support Agent/Manager (and Admin/Super Admin) only.
 */
function authorizeSupport(req, res, next) {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const allowed = ['Support Agent', 'Support Manager', 'Admin', 'Super Admin'];
  if (!allowed.includes(req.user.role_name)) {
    return sendError(res, 'Access denied. Support role required.', 403);
  }
  next();
}

/**
 * Middleware to restrict routes to Finance roles (and Admin/Super Admin) only.
 */
function authorizeFinance(req, res, next) {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const allowed = ['Finance Manager', 'Accountant', 'Auditor', 'Finance Executive', 'Admin', 'Super Admin'];
  if (!allowed.includes(req.user.role_name)) {
    return sendError(res, 'Access denied. Finance role required.', 403);
  }
  next();
}

/**
 * Middleware to restrict routes to Super Admin only.
 */
function authorizeSuperAdmin(req, res, next) {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  if (req.user.role_name !== 'Super Admin') {
    return sendError(res, 'Access denied. Super Admin role required.', 403);
  }
  next();
}

module.exports = { authorize, authorizeSalesManager, authorizeSupport, authorizeFinance, authorizeSuperAdmin };
