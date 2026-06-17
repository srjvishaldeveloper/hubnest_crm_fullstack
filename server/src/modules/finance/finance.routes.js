const express = require('express');
const router = express.Router();
const ctrl = require('./finance.controller');
const { authenticate } = require('../../middleware/auth');
const { authorizeFinance } = require('../../middleware/rbac');

// ── Public (no auth) ──────────────────────────────────────────────────────────
// Must be declared BEFORE the authenticate middleware
router.get('/invoices/public/:number', ctrl.getPublicInvoice);
router.get('/invoices/public/:number/payment-config', ctrl.getPublicInvoicePaymentConfig);
router.post('/invoices/public/:number/create-order', ctrl.createPublicInvoiceOrder);
router.post('/invoices/public/:number/create-payment-intent', ctrl.createPublicInvoicePaymentIntent);
router.post('/invoices/public/:number/payment-verify', ctrl.verifyPublicInvoicePayment);

// All other routes require authentication + Finance role
router.use(authenticate);
router.use(authorizeFinance);

// Dashboard
router.get('/dashboard', ctrl.getDashboard);
router.get('/payment-stats', ctrl.getPaymentStats);

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
router.delete('/payments/:id', ctrl.deletePayment);

// Expenses
router.get('/expenses', ctrl.listExpenses);
router.post('/expenses', ctrl.createExpense);
router.patch('/expenses/:id', ctrl.updateExpense);
router.delete('/expenses/:id', ctrl.deleteExpense);

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
