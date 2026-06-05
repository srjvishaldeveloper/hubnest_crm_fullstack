function sendSuccess(res, data = {}, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, data });
}

function sendError(res, message = 'Internal Server Error', statusCode = 500, errors = null) {
  const payload = { success: false, message };
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
}

function maskEmail(email) {
  const [local, domain] = email.split('@');
  const visible = local.length > 2 ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1] : local[0] + '**';
  return `${visible}@${domain}`;
}

function sanitizeUser(user) {
  const { password_hash, ...safe } = user;
  return safe;
}

module.exports = { sendSuccess, sendError, maskEmail, sanitizeUser };
