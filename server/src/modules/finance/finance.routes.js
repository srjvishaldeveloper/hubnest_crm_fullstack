const express = require('express');
const router = express.Router();
const ctrl = require('./finance.controller');
const { authenticate } = require('../../middleware/auth');
const { authorizeFinance } = require('../../middleware/rbac');

// Helper: extract invoice number from wildcard param (supports slashes like TF/2024-25/188)
function extractInvoiceNumber(req, res, next) {
  // Express wildcard stores matched path in req.params[0]
  req.params.number = req.params[0];
  next();
}

router.get('/invoices/public/*/payment-config', extractInvoiceNumber, ctrl.getPublicInvoicePaymentConfig);
router.post('/invoices/public/*/create-order', extractInvoiceNumber, ctrl.createPublicInvoiceOrder);
router.post('/invoices/public/*/create-payment-intent', extractInvoiceNumber, ctrl.createPublicInvoicePaymentIntent);
router.post('/invoices/public/*/payment-verify', extractInvoiceNumber, ctrl.verifyPublicInvoicePayment);
router.get('/invoices/public/*', extractInvoiceNumber, ctrl.getPublicInvoice);

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
router.get('/invoices/:id/credit-notes', ctrl.listCreditNotes);
router.post('/invoices/:id/credit-notes', ctrl.createCreditNote);
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
