const { verifyAccessToken } = require('../services/tokenService');
const { findById } = require('../models/userModel');
const { sendError } = require('../utils/helpers');
const logger = require('../utils/logger');

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Authorization token required', 401);
  }

  const token = authHeader.slice(7);

  try {
    const decoded = verifyAccessToken(token);
    const user = await findById(decoded.userId);

    if (!user) {
      return sendError(res, 'User not found', 401);
    }

    if (user.status !== 'Active') {
      return sendError(res, 'Account is inactive or suspended', 403);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'Access token expired', 401);
    }
    if (err.name === 'JsonWebTokenError') {
      return sendError(res, 'Invalid access token', 401);
    }
    logger.error('Authentication middleware error', { message: err.message });
    return sendError(res, 'Authentication failed', 500);
  }
}

module.exports = { authenticate };
