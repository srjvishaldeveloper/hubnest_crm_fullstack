const { sendSuccess, sendError } = require('../../utils/helpers');
const svc = require('./finance.service');
const { generateInvoicePdf } = require('../../utils/generateInvoicePdf');
const { query } = require('../../config/database');
const { decrypt } = require('../../utils/encryption');
const axios = require('axios');
const crypto = require('crypto');

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

// ─── PUBLIC CHECKOUTS & STATS ──────────────────────────────────────────────────

async function getPublicInvoicePaymentConfig(req, res) {
  try {
    const { number } = req.params;
    const inv = await svc.getInvoiceByNumber(number);
    if (!inv) return sendError(res, 'Invoice not found', 404);

    const gatewaysRes = await query(
      `SELECT gateway, is_active, is_verified, stripe_publishable_key_enc, razorpay_key_id_enc 
       FROM tenant_payment_gateways 
       WHERE tenant_id = $1 AND is_active = TRUE`,
      [inv.tenant_id]
    );

    const config = {
      amount: inv.total,
      currency: 'INR',
      gateways: []
    };

    for (const row of gatewaysRes.rows) {
      if (row.gateway === 'stripe') {
        const publishableKey = row.stripe_publishable_key_enc ? decrypt(row.stripe_publishable_key_enc) : null;
        config.gateways.push({
          gateway: 'stripe',
          publishableKey
        });
      } else if (row.gateway === 'razorpay') {
        const keyId = row.razorpay_key_id_enc ? decrypt(row.razorpay_key_id_enc) : null;
        config.gateways.push({
          gateway: 'razorpay',
          keyId
        });
      }
    }

    return sendSuccess(res, config, 'Payment configurations retrieved');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

async function createPublicInvoiceOrder(req, res) {
  try {
    const { number } = req.params;
    const inv = await svc.getInvoiceByNumber(number);
    if (!inv) return sendError(res, 'Invoice not found', 404);
    if (inv.status === 'Paid') {
      return sendError(res, 'Invoice is already paid', 400);
    }

    const credentialsRes = await query(
      `SELECT * FROM tenant_payment_gateways 
       WHERE tenant_id = $1 AND gateway = 'razorpay' AND is_active = TRUE`,
      [inv.tenant_id]
    );

    if (credentialsRes.rows.length === 0) {
      return sendError(res, 'Razorpay gateway not configured for this tenant', 400);
    }

    const gatewayRow = credentialsRes.rows[0];
    const keyId = decrypt(gatewayRow.razorpay_key_id_enc);
    const keySecret = decrypt(gatewayRow.razorpay_key_secret_enc);

    if (!keyId || !keySecret) {
      return sendError(res, 'Invalid Razorpay configurations', 500);
    }

    const amountPaise = Math.round(parseFloat(inv.total) * 100);
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    
    const orderRes = await axios.post('https://api.razorpay.com/v1/orders', {
      amount: amountPaise,
      currency: 'INR',
      receipt: `inv_${inv.id.substring(0, 8)}`
    }, {
      headers: { Authorization: `Basic ${auth}` }
    });

    await query(
      `INSERT INTO invoice_payments (invoice_id, tenant_id, amount, currency, gateway, gateway_order_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
      [inv.id, inv.tenant_id, inv.total, 'INR', 'razorpay', orderRes.data.id]
    );

    return sendSuccess(res, {
      orderId: orderRes.data.id,
      amount: orderRes.data.amount,
      currency: orderRes.data.currency,
      razorpayKeyId: keyId
    }, 'Razorpay order created successfully');
  } catch (err) {
    return sendError(res, err.response?.data?.error?.message || err.message, 500);
  }
}

async function createPublicInvoicePaymentIntent(req, res) {
  try {
    const { number } = req.params;
    const inv = await svc.getInvoiceByNumber(number);
    if (!inv) return sendError(res, 'Invoice not found', 404);
    if (inv.status === 'Paid') {
      return sendError(res, 'Invoice is already paid', 400);
    }

    const credentialsRes = await query(
      `SELECT * FROM tenant_payment_gateways 
       WHERE tenant_id = $1 AND gateway = 'stripe' AND is_active = TRUE`,
      [inv.tenant_id]
    );

    if (credentialsRes.rows.length === 0) {
      return sendError(res, 'Stripe gateway not configured for this tenant', 400);
    }

    const gatewayRow = credentialsRes.rows[0];
    const secretKey = decrypt(gatewayRow.stripe_secret_key_enc);
    const publishableKey = decrypt(gatewayRow.stripe_publishable_key_enc);

    if (!secretKey) {
      return sendError(res, 'Invalid Stripe configurations', 500);
    }

    const amountCents = Math.round(parseFloat(inv.total) * 100);
    const urlParams = new URLSearchParams();
    urlParams.append('amount', String(amountCents));
    urlParams.append('currency', 'inr');
    urlParams.append('metadata[invoice_id]', inv.id);
    urlParams.append('metadata[tenant_id]', inv.tenant_id);

    const intentRes = await axios.post('https://api.stripe.com/v1/payment_intents', urlParams, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    await query(
      `INSERT INTO invoice_payments (invoice_id, tenant_id, amount, currency, gateway, gateway_order_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
      [inv.id, inv.tenant_id, inv.total, 'INR', 'stripe', intentRes.data.id]
    );

    return sendSuccess(res, {
      clientSecret: intentRes.data.client_secret,
      publishableKey
    }, 'Stripe payment intent created successfully');
  } catch (err) {
    return sendError(res, err.response?.data?.error?.message || err.message, 500);
  }
}

async function verifyPublicInvoicePayment(req, res) {
  try {
    const { number } = req.params;
    const { gateway, gateway_payment_id, gateway_order_id, gateway_signature } = req.body;
    
    const inv = await svc.getInvoiceByNumber(number);
    if (!inv) return sendError(res, 'Invoice not found', 404);

    if (gateway === 'razorpay') {
      if (!gateway_payment_id || !gateway_order_id || !gateway_signature) {
        return sendError(res, 'Razorpay signature details required', 400);
      }

      const credentialsRes = await query(
        `SELECT * FROM tenant_payment_gateways 
         WHERE tenant_id = $1 AND gateway = 'razorpay' AND is_active = TRUE`,
        [inv.tenant_id]
      );

      if (credentialsRes.rows.length === 0) {
        return sendError(res, 'Razorpay not configured', 400);
      }

      const keySecret = decrypt(credentialsRes.rows[0].razorpay_key_secret_enc);
      const shasum = crypto.createHmac('sha256', keySecret);
      shasum.update(`${gateway_order_id}|${gateway_payment_id}`);
      const digest = shasum.digest('hex');

      if (digest !== gateway_signature) {
        return sendError(res, 'Payment signature verification failed', 400);
      }

      await query(
        `UPDATE invoice_payments 
         SET status = 'success', gateway_payment_id = $1, gateway_signature = $2, paid_at = NOW()
         WHERE gateway_order_id = $3`,
        [gateway_payment_id, gateway_signature, gateway_order_id]
      );

      await query(
        `INSERT INTO payments (tenant_id, invoice_id, amount, method, reference, status, paid_at)
         VALUES ($1, $2, $3, $4, $5, 'Completed', NOW())`,
        [inv.tenant_id, inv.id, inv.total, 'Razorpay', gateway_payment_id]
      );

      await query(
        `UPDATE invoices SET status = 'Paid', paid_date = CURRENT_DATE, updated_at = NOW() WHERE id = $1`,
        [inv.id]
      );

      return sendSuccess(res, { success: true }, 'Payment verified and completed successfully');
    } else if (gateway === 'stripe') {
      if (!gateway_order_id) {
        return sendError(res, 'Stripe payment intent ID required', 400);
      }

      const credentialsRes = await query(
        `SELECT * FROM tenant_payment_gateways 
         WHERE tenant_id = $1 AND gateway = 'stripe' AND is_active = TRUE`,
        [inv.tenant_id]
      );

      if (credentialsRes.rows.length === 0) {
        return sendError(res, 'Stripe not configured', 400);
      }

      const secretKey = decrypt(credentialsRes.rows[0].stripe_secret_key_enc);
      const intentRes = await axios.get(`https://api.stripe.com/v1/payment_intents/${gateway_order_id}`, {
        headers: { Authorization: `Bearer ${secretKey}` }
      });

      if (intentRes.data.status !== 'succeeded') {
        return sendError(res, `Payment intent status: ${intentRes.data.status}`, 400);
      }

      const chargeId = intentRes.data.latest_charge || gateway_payment_id || gateway_order_id;

      await query(
        `UPDATE invoice_payments 
         SET status = 'success', gateway_payment_id = $1, paid_at = NOW()
         WHERE gateway_order_id = $2`,
        [chargeId, gateway_order_id]
      );

      await query(
        `INSERT INTO payments (tenant_id, invoice_id, amount, method, reference, status, paid_at)
         VALUES ($1, $2, $3, $4, $5, 'Completed', NOW())`,
        [inv.tenant_id, inv.id, inv.total, 'Stripe', chargeId]
      );

      await query(
        `UPDATE invoices SET status = 'Paid', paid_date = CURRENT_DATE, updated_at = NOW() WHERE id = $1`,
        [inv.id]
      );

      return sendSuccess(res, { success: true }, 'Payment verified and completed successfully');
    }

    return sendError(res, 'Invalid gateway', 400);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

async function getPaymentStats(req, res) {
  if (req.user.role_name === 'Super Admin' || req.user.role_name === 'super_admin') {
    return sendError(res, 'Super Admin cannot access tenant payment data', 403);
  }
  const tenantId = req.user.tenant_id;
  try {
    const collectedResult = await query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE tenant_id = $1 AND status = 'Completed'`,
      [tenantId]
    );
    const pendingResult = await query(
      `SELECT COALESCE(SUM(total), 0) AS total FROM invoices WHERE tenant_id = $1 AND status IN ('Sent', 'Overdue')`,
      [tenantId]
    );
    const failedResult = await query(
      `SELECT COUNT(*)::int AS count FROM invoice_payments WHERE tenant_id = $1 AND status = 'failed'`,
      [tenantId]
    );
    const recentPaymentsResult = await query(
      `SELECT ip.*, i.invoice_number, i.customer_name 
       FROM invoice_payments ip 
       JOIN invoices i ON i.id = ip.invoice_id 
       WHERE ip.tenant_id = $1 
       ORDER BY ip.created_at DESC LIMIT 10`,
      [tenantId]
    );

    return sendSuccess(res, {
      totalCollected: parseFloat(collectedResult.rows[0]?.total || 0),
      pending: parseFloat(pendingResult.rows[0]?.total || 0),
      failed: failedResult.rows[0]?.count || 0,
      recentPayments: recentPaymentsResult.rows
    }, 'Payment stats retrieved successfully');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

// ─── CREDIT / DEBIT NOTES ─────────────────────────────────────────────────────

async function listCreditNotes(req, res) {
  try {
    const notes = await svc.listCreditNotes(req.user.tenant_id, req.params.id);
    return sendSuccess(res, { notes }, 'Credit notes retrieved');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

async function createCreditNote(req, res) {
  try {
    const { type, reason, items, amount, notes } = req.body;
    if (!amount) return sendError(res, 'amount is required', 400);
    const year = new Date().getFullYear();
    const rand = String(Math.floor(Math.random() * 9000) + 1000);
    const prefix = (type === 'Debit Note') ? 'DN' : 'CN';
    const note_number = `${prefix}-${year}-${rand}`;
    const note = await svc.createCreditNote(req.user.tenant_id, req.params.id, {
      note_number, type, reason, items, amount, notes,
    });
    return sendSuccess(res, { note }, 'Credit note created successfully', 201);
  } catch (err) {
    return sendError(res, err.message, err.message.includes('Only Paid') ? 400 : 500);
  }
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
  getAnalytics,
  getPublicInvoicePaymentConfig,
  createPublicInvoiceOrder,
  createPublicInvoicePaymentIntent,
  verifyPublicInvoicePayment,
  getPaymentStats,
  listCreditNotes,
  createCreditNote,
};
