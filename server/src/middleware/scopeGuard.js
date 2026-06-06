const { sendError } = require('../utils/helpers');

/**
 * scopeGuard middleware
 * If the user role is 'Sales Executive', it enforces that database queries only operate
 * on records belonging to the current user (e.g. user_id = req.user.id or assigned_to = req.user.id).
 * It attaches a `salesScope` user ID to `req`.
 */
function scopeGuard(req, res, next) {
  if (!req.user) {
    return sendError(res, 'Unauthorized', 401);
  }

  // Determine if scoping is needed
  if (req.user.role_name === 'Sales Executive') {
    req.salesScope = req.user.id;
  } else {
    req.salesScope = null; // Managers/Admins/Super Admins bypass user scope checks
  }

  next();
}

module.exports = { scopeGuard };
