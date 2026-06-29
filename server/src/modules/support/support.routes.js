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

// Profile
router.get('/profile', ctrl.getSupportProfile);
router.patch('/profile', ctrl.updateSupportProfile);

// Tickets
router.get('/tickets', ctrl.listTickets);
router.post('/tickets/bulk', ctrl.bulkUpdateTickets);
router.post('/tickets', ctrl.createTicket);
router.get('/tickets/:id', ctrl.getTicket);
router.patch('/tickets/:id', ctrl.updateTicket);
router.post('/tickets/:id/messages', ctrl.addMessage);
router.post('/tickets/:id/escalate', ctrl.escalateTicket);
router.post('/tickets/:id/assign', ctrl.assignTicket);

// Customers
router.get('/customers', ctrl.listCustomers);
router.post('/customers/bulk', ctrl.bulkUpdateCustomers);
router.post('/customers', ctrl.createCustomer);
router.get('/customers/:id', ctrl.getCustomer);
router.patch('/customers/:id', ctrl.updateCustomer);
router.post('/customers/:id/notes', ctrl.addCustomerNote);

// Knowledge Base Articles
router.get('/knowledge-base/analytics', ctrl.getKbAnalytics);
router.get('/knowledge-base', ctrl.listArticles);
router.post('/knowledge-base', ctrl.createArticle);
router.get('/knowledge-base/:id', ctrl.getArticle);
router.patch('/knowledge-base/:id', ctrl.updateArticle);
router.post('/knowledge-base/:id/rate', ctrl.rateArticle);
router.post('/knowledge-base/:id/comments', ctrl.addKbComment);

module.exports = router;
