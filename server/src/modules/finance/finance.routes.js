const express = require('express');
const router = express.Router();
const ctrl = require('./finance.controller');
const { authenticate } = require('../../middleware/auth');
const { authorizeFinance } = require('../../middleware/rbac');

// All finance routes require authentication and Finance role check
router.use(authenticate);
router.use(authorizeFinance);

// Dashboard
router.get('/dashboard', ctrl.getDashboard);

// Analytics
router.get('/analytics', ctrl.getAnalytics);

// Invoices
router.get('/invoices', ctrl.listInvoices);
router.get('/invoices/:id/download', ctrl.downloadInvoice);
router.get('/invoices/:id', ctrl.getInvoice);
router.post('/invoices', ctrl.createInvoice);
router.patch('/invoices/:id', ctrl.updateInvoice);

// Payments
router.get('/payments', ctrl.listPayments);
router.post('/payments', ctrl.createPayment);

// Expenses
router.get('/expenses', ctrl.listExpenses);
router.post('/expenses', ctrl.createExpense);
router.patch('/expenses/:id', ctrl.updateExpense);

// Vendors
router.get('/vendors', ctrl.listVendors);
router.get('/vendors/:id', ctrl.getVendor);
router.post('/vendors', ctrl.createVendor);
router.patch('/vendors/:id', ctrl.updateVendor);

// Payroll
router.get('/payroll', ctrl.listPayroll);

// Tax Records
router.get('/tax-records', ctrl.listTaxRecords);

module.exports = router;
