const smsService = require('../../services/smsService');
const { sendSuccess, sendError } = require('../../utils/helpers');
const logger = require('../../utils/logger');

async function getLogs(req, res) {
  const { limit = 50, offset = 0, status, message_type } = req.query;
  const logs = await smsService.getSmsLogs({
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
    status: status || null,
    messageType: message_type || null,
  });
  return sendSuccess(res, { logs }, 'SMS logs retrieved');
}

async function getStats(req, res) {
  const stats = await smsService.getSmsStats();
  return sendSuccess(res, { stats }, 'SMS stats retrieved');
}

async function getSettings(req, res) {
  const settings = await smsService.getSmsSettings();
  if (!settings) return sendError(res, 'SMS settings not found', 404);
  return sendSuccess(res, { settings }, 'SMS settings retrieved');
}

async function updateSettings(req, res) {
  const result = await smsService.updateSmsSettings(req.body, req.user.id);
  if (!result.success) return sendError(res, result.error || 'Failed to update settings', 500);
  return sendSuccess(res, {}, 'SMS settings updated');
}

async function testSms(req, res) {
  const { phone, message } = req.body;
  if (!phone) return sendError(res, 'Phone number is required', 400);

  const result = await smsService.sendTestSMS(phone, message, { userId: req.user.id });
  if (!result.success) return sendError(res, result.error || 'Failed to send test SMS', 500);
  return sendSuccess(res, { sid: result.sid }, 'Test SMS sent successfully');
}

module.exports = { getLogs, getStats, getSettings, updateSettings, testSms };
