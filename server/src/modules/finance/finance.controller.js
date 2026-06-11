const { sendSuccess, sendError } = require('../../utils/helpers');
const svc = require('./finance.service');
const { generateInvoicePdf } = require('../../utils/generateInvoicePdf');

async function getDashboard(req, res) {
  const data = await svc.getFinanceDashboard(req.user.tenant_id);
  return sendSuccess(res, data, 'Finance dashboard retrieved successfully');
}

// ─── INVOICES ─────────────────────────────────────────────────────────────────

async function listInvoices(req, res) {
  const { status, search, page, limit } = req.query;
  const data = await svc.listInvoices(req.user.tenant_id, {
    status,
    search,
    page: +page || 1,
    limit: +limit || 50
  });
  return sendSuccess(res, data, 'Invoices retrieved successfully');
}

async function getInvoice(req, res) {
  const data = await svc.getInvoiceById(req.user.tenant_id, req.params.id);
  if (!data) return sendError(res, 'Invoice not found', 404);
  return sendSuccess(res, data, 'Invoice retrieved successfully');
}

async function createInvoice(req, res) {
  const { invoice_number, customer_name, amount, due_date } = req.body;
  if (!invoice_number || !customer_name || !amount || !due_date) {
    return sendError(res, 'invoice_number, customer_name, amount, and due_date are required', 400);
  }
  const invoice = await svc.createInvoice(req.user.tenant_id, req.body);
  return sendSuccess(res, { invoice }, 'Invoice created successfully', 201);
}

async function updateInvoice(req, res) {
  const invoice = await svc.updateInvoice(req.user.tenant_id, req.params.id, req.body);
  if (!invoice) return sendError(res, 'Invoice not found or no updates provided', 404);
  return sendSuccess(res, { invoice }, 'Invoice updated successfully');
}

async function downloadInvoice(req, res) {
  const result = await svc.getInvoiceById(req.user.tenant_id, req.params.id);
  if (!result) return sendError(res, 'Invoice not found', 404);

  const inv = result.invoice || result;
  const pdfBuffer = generateInvoicePdf({
    invoiceNumber: inv.invoice_number,
    tenantName: inv.customer_name,
    amount: inv.total || inv.amount,
    currency: 'INR',
    status: inv.status,
    issuedDate: inv.created_at,
    dueDate: inv.due_date,
  });

  const filename = `invoice_${inv.invoice_number || req.params.id}.pdf`;
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Content-Length': pdfBuffer.length,
  });
  return res.end(pdfBuffer);
}

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────

async function listPayments(req, res) {
  const { status, method, search, page, limit } = req.query;
  const data = await svc.listPayments(req.user.tenant_id, {
    status,
    method,
    search,
    page: +page || 1,
    limit: +limit || 50
  });
  return sendSuccess(res, data, 'Payments retrieved successfully');
}

async function createPayment(req, res) {
  const { amount } = req.body;
  if (!amount) {
    return sendError(res, 'amount is required', 400);
  }
  const payment = await svc.createPayment(req.user.tenant_id, req.body);
  return sendSuccess(res, { payment }, 'Payment recorded successfully', 201);
}

// ─── EXPENSES ─────────────────────────────────────────────────────────────────

async function listExpenses(req, res) {
  const { status, category, search, page, limit } = req.query;
  const data = await svc.listExpenses(req.user.tenant_id, {
    status,
    category,
    search,
    page: +page || 1,
    limit: +limit || 50
  });
  return sendSuccess(res, data, 'Expenses retrieved successfully');
}

async function createExpense(req, res) {
  const { description, amount } = req.body;
  if (!description || !amount) {
    return sendError(res, 'description and amount are required', 400);
  }
  const expense = await svc.createExpense(req.user.tenant_id, req.body);
  return sendSuccess(res, { expense }, 'Expense created successfully', 201);
}

async function updateExpense(req, res) {
  const expense = await svc.updateExpense(req.user.tenant_id, req.params.id, req.body);
  if (!expense) return sendError(res, 'Expense not found or no updates provided', 404);
  return sendSuccess(res, { expense }, 'Expense updated successfully');
}

// ─── VENDORS ──────────────────────────────────────────────────────────────────

async function listVendors(req, res) {
  const { status, category, search, page, limit } = req.query;
  const data = await svc.listVendors(req.user.tenant_id, {
    status,
    category,
    search,
    page: +page || 1,
    limit: +limit || 50
  });
  return sendSuccess(res, data, 'Vendors retrieved successfully');
}

async function getVendor(req, res) {
  const data = await svc.getVendorById(req.user.tenant_id, req.params.id);
  if (!data) return sendError(res, 'Vendor not found', 404);
  return sendSuccess(res, data, 'Vendor retrieved successfully');
}

async function createVendor(req, res) {
  const { name } = req.body;
  if (!name) {
    return sendError(res, 'name is required', 400);
  }
  const vendor = await svc.createVendor(req.user.tenant_id, req.body);
  return sendSuccess(res, { vendor }, 'Vendor created successfully', 201);
}

async function updateVendor(req, res) {
  const vendor = await svc.updateVendor(req.user.tenant_id, req.params.id, req.body);
  if (!vendor) return sendError(res, 'Vendor not found or no updates provided', 404);
  return sendSuccess(res, { vendor }, 'Vendor updated successfully');
}

// ─── PAYROLL ──────────────────────────────────────────────────────────────────

async function listPayroll(req, res) {
  const { status, pay_period, page, limit } = req.query;
  const data = await svc.listPayroll(req.user.tenant_id, {
    status,
    pay_period,
    page: +page || 1,
    limit: +limit || 50
  });
  return sendSuccess(res, data, 'Payroll records retrieved successfully');
}

// ─── TAX RECORDS ──────────────────────────────────────────────────────────────

async function listTaxRecords(req, res) {
  const { status, tax_type, page, limit } = req.query;
  const data = await svc.listTaxRecords(req.user.tenant_id, {
    status,
    tax_type,
    page: +page || 1,
    limit: +limit || 50
  });
  return sendSuccess(res, data, 'Tax records retrieved successfully');
}

// ─── ANALYTICS ────────────────────────────────────────────────────────────────

async function getAnalytics(req, res) {
  const data = await svc.getFinanceAnalytics(req.user.tenant_id);
  return sendSuccess(res, data, 'Finance analytics retrieved successfully');
}

module.exports = {
  getDashboard,
  listInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  downloadInvoice,
  listPayments,
  createPayment,
  listExpenses,
  createExpense,
  updateExpense,
  listVendors,
  getVendor,
  createVendor,
  updateVendor,
  listPayroll,
  listTaxRecords,
  getAnalytics
};
