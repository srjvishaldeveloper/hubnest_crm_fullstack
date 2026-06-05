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

    if (req.user.role_name === 'Super Admin') {
      return next();
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

module.exports = { authorize };
