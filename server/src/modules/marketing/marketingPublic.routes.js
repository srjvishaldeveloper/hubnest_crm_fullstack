const express = require('express');
const router = express.Router();
const ctrl = require('./marketing.controller');

// No authenticate middleware — these routes are publicly accessible
router.get('/forms/:id/public', ctrl.getFormPublic);
router.post('/forms/:id/submit', ctrl.submitFormPublic);

module.exports = router;
