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

  // Parse metadata stored as JSON in notes if present
  let meta = {};
  try { if (inv.notes) meta = JSON.parse(inv.notes); } catch { /* plain text notes */ }

  const pdfBuffer = generateInvoicePdf({
    invoiceNumber:   inv.invoice_number,
    customerName:    inv.customer_name,
    sellerName:      meta.sellerName     || '',
    sellerGstin:     meta.sellerGstin    || '',
    sellerAddress:   meta.sellerAddress  || '',
    customerGstin:   meta.customerGstin  || '',
    customerAddress: meta.customerAddress|| '',
    subTotal:        parseFloat(inv.amount) || 0,
    totalCgst:       meta.totalCgst      || 0,
    totalSgst:       meta.totalSgst      || 0,
    totalIgst:       meta.totalIgst      || 0,
    tax:             parseFloat(inv.tax) || 0,
    grandTotal:      parseFloat(inv.total) || 0,
    status:          inv.status,
    issuedDate:      inv.created_at,
    dueDate:         inv.due_date,
    bankName:        meta.bankName   || '',
    accountNo:       meta.accountNo  || '',
    ifsc:            meta.ifsc       || '',
    notes:           inv.notes,
    template:        meta.template   || 'modern',
  });

  const filename = `invoice_${inv.invoice_number || req.params.id}.pdf`;
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Content-Length': pdfBuffer.length,
  });
  return res.end(pdfBuffer);
}

// Public — no auth required
async function getPublicInvoice(req, res) {
  try {
    const inv = await svc.getInvoiceByNumber(req.params.number);
    if (!inv) return sendError(res, 'Invoice not found', 404);
    // Only expose safe fields to public
    return sendSuccess(res, {
      invoice_number: inv.invoice_number,
      customer_name: inv.customer_name,
      amount: inv.amount,
      tax: inv.tax,
      total: inv.total,
      status: inv.status,
      due_date: inv.due_date,
      created_at: inv.created_at,
      paid_date: inv.paid_date,
      tenant_name: inv.tenant_name,
      notes: inv.notes || null,
    }, 'Invoice retrieved');
  } catch (err) {
    return sendError(res, 'Failed to fetch invoice', 500);
  }
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

async function deletePayment(req, res) {
  const payment = await svc.deletePayment(req.user.tenant_id, req.params.id);
  if (!payment) return sendError(res, 'Payment not found', 404);
  return sendSuccess(res, { payment }, 'Payment deleted');
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

async function deleteExpense(req, res) {
  const expense = await svc.deleteExpense(req.user.tenant_id, req.params.id);
  if (!expense) return sendError(res, 'Expense not found', 404);
  return sendSuccess(res, { expense }, 'Expense deleted');
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
  getPublicInvoice,
  listPayments,
  createPayment,
  deletePayment,
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  listVendors,
  getVendor,
  createVendor,
  updateVendor,
  listPayroll,
  listTaxRecords,
  getAnalytics
};
