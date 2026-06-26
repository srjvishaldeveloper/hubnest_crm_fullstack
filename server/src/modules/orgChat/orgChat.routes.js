const express = require('express');
const router = express.Router();
const controller = require('./orgChat.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);

router.get('/departments', controller.getDepartments);
router.get('/conversations', controller.getConversations);
router.post('/conversations', controller.createConversation);
router.get('/conversations/:conversationId/messages', controller.getMessages);
router.put('/messages/:messageId', controller.editMessage);
router.delete('/messages/:messageId', controller.deleteMessage);
router.post('/conversations/:conversationId/pin/:messageId', controller.pinMessage);
router.delete('/conversations/:conversationId/pin/:messageId', controller.unpinMessage);
router.get('/conversations/:conversationId/pinned', controller.getPinnedMessages);
router.post('/announcements', controller.sendAnnouncement);
router.get('/announcements', controller.getAnnouncements);
router.get('/search', controller.searchMessages);
router.get('/users', controller.getOrganizationUsers);

// File upload (base64 data URL — consistent with avatar/documents)
router.post('/upload', controller.uploadFile);

// Conversation member management
router.get('/conversations/:conversationId/members', controller.getConversationMembers);
router.post('/conversations/:conversationId/members', controller.addConversationMembers);
router.delete('/conversations/:conversationId/members/:userId', controller.removeConversationMember);

module.exports = router;
