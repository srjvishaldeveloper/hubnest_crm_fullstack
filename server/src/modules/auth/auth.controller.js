const { validationResult } = require('express-validator');
const authService = require('./auth.service');
const { sendSuccess, sendError } = require('../../utils/helpers');

function validate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    sendError(res, 'Validation failed', 422, errors.array());
    return false;
  }
  return true;
}

async function login(req, res) {
  if (!validate(req, res)) return;
  const { emailOrAdminId, password } = req.body;
  const result = await authService.login(emailOrAdminId, password);
  return sendSuccess(res, result, result.message);
}

async function verifyOtp(req, res) {
  if (!validate(req, res)) return;
  const { userId, otp } = req.body;
  const result = await authService.verifyOtp(userId, otp);
  return sendSuccess(res, result, 'Login successful');
}

async function refresh(req, res) {
  if (!validate(req, res)) return;
  const { refreshToken } = req.body;
  const result = await authService.refreshAccessToken(refreshToken);
  return sendSuccess(res, result, 'Token refreshed successfully');
}

async function logout(req, res) {
  const { refreshToken } = req.body;
  await authService.logout(refreshToken);
  return sendSuccess(res, {}, 'Logged out successfully');
}

async function forgotPassword(req, res) {
  if (!validate(req, res)) return;
  const { email } = req.body;
  const result = await authService.forgotPassword(email);
  return sendSuccess(res, result, result.message);
}

async function resetPassword(req, res) {
  if (!validate(req, res)) return;
  const { email, otp, newPassword } = req.body;
  const result = await authService.resetPassword(email, otp, newPassword);
  return sendSuccess(res, {}, result.message);
}

module.exports = { login, verifyOtp, refresh, logout, forgotPassword, resetPassword };
