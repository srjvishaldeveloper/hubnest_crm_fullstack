const { getClient } = require('../config/database');
const { sendError } = require('../utils/helpers');
const logger = require('../utils/logger');

// Validates schema name to prevent SQL injection (only alphanumeric + underscore)
const SAFE_SCHEMA_RE = /^[a-zA-Z][a-zA-Z0-9_]{0,62}$/;

async function resolveTenant(req, res, next) {
  const user = req.user;

  if (!user || !user.schema_name) {
    return next();
  }

  if (!SAFE_SCHEMA_RE.test(user.schema_name)) {
    logger.error(`Unsafe schema name rejected: ${user.schema_name}`);
    return sendError(res, 'Invalid tenant configuration', 500);
  }

  req.tenantSchema = user.schema_name;
  next();
}

/**
 * Run a callback inside a tenant-scoped DB client.
 * The client is released automatically after the callback completes.
 */
async function withTenantSchema(schemaName, callback) {
  if (!SAFE_SCHEMA_RE.test(schemaName)) {
    throw new Error(`Unsafe schema name: ${schemaName}`);
  }

  const client = await getClient();
  try {
    await client.query(`SET search_path TO ${schemaName}, public`);
    return await callback(client);
  } finally {
    client.release();
  }
}

module.exports = { resolveTenant, withTenantSchema };
