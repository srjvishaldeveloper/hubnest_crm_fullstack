const express = require('express');
const router = express.Router();
const ctrl = require('./support.controller');
const { authenticate } = require('../../middleware/auth');
const { authorizeSupport } = require('../../middleware/rbac');

// All support routes require authentication and Support membership role check
router.use(authenticate);
router.use(authorizeSupport);

// Dashboard
router.get('/dashboard', ctrl.getDashboard);

// Tickets
router.get('/tickets', ctrl.listTickets);
router.get('/tickets/:id', ctrl.getTicket);
router.post('/tickets', ctrl.createTicket);
router.patch('/tickets/:id', ctrl.updateTicket);
router.post('/tickets/:id/messages', ctrl.addMessage);

// Customers
router.get('/customers', ctrl.listCustomers);
router.get('/customers/:id', ctrl.getCustomer);

// Knowledge Base Articles
router.get('/knowledge-base', ctrl.listArticles);
router.get('/knowledge-base/:id', ctrl.getArticle);
router.post('/knowledge-base', ctrl.createArticle);
router.patch('/knowledge-base/:id', ctrl.updateArticle);
router.post('/knowledge-base/:id/rate', ctrl.rateArticle);

module.exports = router;
