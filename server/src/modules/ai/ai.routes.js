const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { forwardChat, forwardReset, forwardHealth } = require('../../utils/pythonBridge');
const { sendSuccess, sendError } = require('../../utils/helpers');

router.get('/health', async (req, res) => {
  try {
    await forwardHealth();
    return sendSuccess(res, { status: 'ok' }, 'AI Chatbot service is online');
  } catch (error) {
    return res.status(502).json({
      success: false,
      error: 'AI service unavailable',
      detail: error.message
    });
  }
});

router.post('/chat', authenticate, async (req, res) => {
  try {
    const { messages } = req.body;
    const userRole = req.body.user_role || req.user.role_name || 'Admin';

    if (!messages || !Array.isArray(messages)) {
      return sendError(res, 'Messages array is required', 400);
    }

    const result = await forwardChat(messages, userRole);
    return sendSuccess(res, result, 'Chat response generated');
  } catch (error) {
    console.error("Chatbot error:", error.message);
    const status = error.response?.status || 502;
    const message = error.response?.data?.detail || error.message || 'Error communicating with AI Chatbot service';
    return res.status(status).json({
      success: false,
      error: "AI service unavailable",
      detail: message
    });
  }
});

router.post('/chat/reset', authenticate, async (req, res) => {
  try {
    const result = await forwardReset();
    return sendSuccess(res, result, 'Chat history reset successful');
  } catch (error) {
    const status = error.response?.status || 502;
    const message = error.response?.data?.detail || error.message || 'Error communicating with AI Chatbot service';
    return res.status(status).json({
      success: false,
      error: "AI service unavailable",
      detail: message
    });
  }
});

module.exports = router;
