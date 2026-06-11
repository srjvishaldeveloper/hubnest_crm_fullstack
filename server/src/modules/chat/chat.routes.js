const express = require('express');
const router = express.Router();
const ctrl = require('./chat.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);

router.get('/conversations', ctrl.listConversations);
router.post('/conversations', ctrl.startConversation);
router.get('/messages/:conversationId', ctrl.listMessages);
router.post('/messages/read/:conversationId', ctrl.readMessages);
router.get('/unread-count', ctrl.getUnreadCount);
router.get('/metrics', ctrl.getDashboardMetrics);

module.exports = router;
