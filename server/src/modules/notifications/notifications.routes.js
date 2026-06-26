
const express = require('express');
const router = express.Router();
const ctrl = require('./notifications.controller');
const { authenticate } = require('../../middleware/auth');

router.get('/', authenticate, ctrl.getNotifications);
router.put('/:id/read', authenticate, ctrl.markAsRead);

module.exports = router;
