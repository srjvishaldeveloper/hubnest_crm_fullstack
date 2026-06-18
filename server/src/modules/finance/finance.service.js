const { query } = require('../../config/database');

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

async function getFinanceDashboard(tenantId) {
  // Revenue: total of all paid invoices
  const revenueResult = await query(
    `SELECT COALESCE(SUM(total), 0) AS total_revenue FROM invoices WHERE tenant_id = $1 AND status = 'Paid'`,
    [tenantId]
  );

  // Total Expenses
  const expensesResult = await query(
    `SELECT COALESCE(SUM(amount), 0) AS total_expenses FROM expenses WHERE tenant_id = $1 AND status = 'Approved'`,
    [tenantId]
  );

  // Outstanding Invoices (Sent + Overdue)
  const outstandingResult = await query(
    `SELECT COUNT(*) AS count, COALESCE(SUM(total), 0) AS amount FROM invoices WHERE tenant_id = $1 AND status IN ('Sent', 'Overdue')`,
    [tenantId]
  );

  // Overdue Invoices
  const overdueResult = await query(
    `SELECT COUNT(*) AS count, COALESCE(SUM(total), 0) AS amount FROM invoices WHERE tenant_id = $1 AND status = 'Overdue'`,
    [tenantId]
  );

  // Tax Summary
  const taxSummary = await query(
    `SELECT tax_type, COALESCE(SUM(amount), 0) AS total, status FROM tax_records WHERE tenant_id = $1 GROUP BY tax_type, status ORDER BY tax_type`,
    [tenantId]
  );

  // Total taxes pending
  const taxPendingResult = await query(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM tax_records WHERE tenant_id = $1 AND status IN ('Pending', 'Overdue')`,
    [tenantId]
  );

  // Total taxes filed/paid
  const taxPaidResult = await query(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM tax_records WHERE tenant_id = $1 AND status IN ('Filed', 'Paid')`,
    [tenantId]
  );

  // Monthly Revenue Trend (last 6 months)
  const revenueTrend = await query(
    `SELECT 
       TO_CHAR(DATE_TRUNC('month', paid_date), 'Mon') AS month,
       COALESCE(SUM(total), 0) AS revenue
     FROM invoices
     WHERE tenant_id = $1 AND status = 'Paid' AND paid_date >= NOW() - INTERVAL '6 months'
     GROUP BY DATE_TRUNC('month', paid_date)
     ORDER BY DATE_TRUNC('month', paid_date)`,
    [tenantId]
  );

  // Monthly Expense Trend (last 6 months)
  const expenseTrend = await query(
    `SELECT 
       TO_CHAR(DATE_TRUNC('month', expense_date), 'Mon') AS month,
       COALESCE(SUM(amount), 0) AS expenses
     FROM expenses
     WHERE tenant_id = $1 AND status = 'Approved' AND expense_date >= NOW() - INTERVAL '6 months'
     GROUP BY DATE_TRUNC('month', expense_date)
     ORDER BY DATE_TRUNC('month', expense_date)`,
    [tenantId]
  );

  // Expense Category Breakdown
  const expenseByCategory = await query(
    `SELECT category, COALESCE(SUM(amount), 0) AS total FROM expenses WHERE tenant_id = $1 AND status = 'Approved' GROUP BY category ORDER BY total DESC`,
    [tenantId]
  );

  // Recent Invoices
  const recentInvoices = await query(
    `SELECT id, invoice_number, customer_name, total, status, due_date, created_at
     FROM invoices WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 5`,
    [tenantId]
  );

  // Recent Payments
  const recentPayments = await query(
    `SELECT p.id, p.amount, p.method, p.status, p.paid_at, i.invoice_number
     FROM payments p
     LEFT JOIN invoices i ON i.id = p.invoice_id
     WHERE p.tenant_id = $1 ORDER BY p.created_at DESC LIMIT 5`,
    [tenantId]
  );

  // Pending Expenses
  const pendingExpenses = await query(
    `SELECT e.id, e.category, e.description, e.amount, e.expense_date, v.name AS vendor_name
     FROM expenses e
     LEFT JOIN vendors v ON v.id = e.vendor_id
     WHERE e.tenant_id = $1 AND e.status = 'Pending'
     ORDER BY e.created_at DESC LIMIT 5`,
    [tenantId]
  );

  // Payroll summary
  const payrollSummary = await query(
    `SELECT COALESCE(SUM(net_pay), 0) AS total_payroll, COUNT(*) AS employee_count
     FROM payroll WHERE tenant_id = $1 AND status IN ('Paid', 'Processed')`,
    [tenantId]
  );

  const totalRevenue = parseFloat(revenueResult.rows[0]?.total_revenue || 0);
  const totalExpenses = parseFloat(expensesResult.rows[0]?.total_expenses || 0);

  return {
    kpis: {
      totalRevenue,
      totalExpenses,
      profit: totalRevenue - totalExpenses,
      outstandingInvoices: {
        count: parseInt(outstandingResult.rows[0]?.count || 0),
        amount: parseFloat(outstandingResult.rows[0]?.amount || 0)
      },
      overdueInvoices: {
        count: parseInt(overdueResult.rows[0]?.count || 0),
        amount: parseFloat(overdueResult.rows[0]?.amount || 0)
      },
      taxPending: parseFloat(taxPendingResult.rows[0]?.total || 0),
      taxPaid: parseFloat(taxPaidResult.rows[0]?.total || 0),
      totalPayroll: parseFloat(payrollSummary.rows[0]?.total_payroll || 0),
      employeeCount: parseInt(payrollSummary.rows[0]?.employee_count || 0)
    },
    revenueTrend: revenueTrend.rows.map(r => ({ month: r.month, revenue: parseFloat(r.revenue) })),
    expenseTrend: expenseTrend.rows.map(r => ({ month: r.month, expenses: parseFloat(r.expenses) })),
    expenseByCategory: expenseByCategory.rows.map(r => ({ category: r.category, total: parseFloat(r.total) })),
    taxSummary: taxSummary.rows.map(r => ({ taxType: r.tax_type, total: parseFloat(r.total), status: r.status })),
    recentInvoices: recentInvoices.rows,
    recentPayments: recentPayments.rows,
    pendingExpenses: pendingExpenses.rows
  };
}

// ─── INVOICES ─────────────────────────────────────────────────────────────────

async function listInvoices(tenantId, filters = {}) {
  const { status, search, page = 1, limit = 50 } = filters;
  let sql = `SELECT * FROM invoices WHERE tenant_id = $1`;
  const params = [tenantId];

  if (status) {
    params.push(status);
    sql += ` AND status = $${params.length}`;
  }

  if (search) {
    params.push(`%${search}%`);
    sql += ` AND (invoice_number ILIKE $${params.length} OR customer_name ILIKE $${params.length})`;
  }

  sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, (page - 1) * limit);

  const result = await query(sql, params);

  // Count
  let countSql = `SELECT COUNT(*) AS cnt FROM invoices WHERE tenant_id = $1`;
  const countParams = [tenantId];
  if (status) { countParams.push(status); countSql += ` AND status = $${countParams.length}`; }
  if (search) { countParams.push(`%${search}%`); countSql += ` AND (invoice_number ILIKE $${countParams.length} OR customer_name ILIKE $${countParams.length})`; }
  const countResult = await query(countSql, countParams);

  // Get sum from gst_amount table
  const gstSumResult = await query(
    `SELECT COALESCE(SUM(amount), 0) AS total_gst FROM gst_amount WHERE tenant_id = $1`,
    [tenantId]
  );
  const totalGst = parseFloat(gstSumResult.rows[0]?.total_gst || 0);

  return {
    invoices: result.rows,
    total: parseInt(countResult.rows[0]?.cnt || 0),
    totalGst,
    page,
    limit
  };
}

async function getInvoiceById(tenantId, invoiceId) {
  const result = await query(
    `SELECT * FROM invoices WHERE id = $1 AND tenant_id = $2`,
    [invoiceId, tenantId]
  );
  if (result.rows.length === 0) return null;

  const payments = await query(
    `SELECT * FROM payments WHERE invoice_id = $1 AND tenant_id = $2 ORDER BY paid_at DESC`,
    [invoiceId, tenantId]
  );

  return { invoice: result.rows[0], payments: payments.rows };
}

async function getInvoiceByNumber(invoiceNumber) {
  const result = await query(
    `SELECT i.*, t.name AS tenant_name FROM invoices i
     JOIN tenants t ON t.id = i.tenant_id
     WHERE i.invoice_number = $1`,
    [invoiceNumber]
  );
  if (result.rows.length === 0) return null;
  return result.rows[0];
}

async function deletePayment(tenantId, paymentId) {
  const result = await query(
    `DELETE FROM payments WHERE id = $1 AND tenant_id = $2 RETURNING *`,
    [paymentId, tenantId]
  );
  return result.rows[0] || null;
}

async function deleteExpense(tenantId, expenseId) {
  const result = await query(
    `DELETE FROM expenses WHERE id = $1 AND tenant_id = $2 RETURNING *`,
    [expenseId, tenantId]
  );
  return result.rows[0] || null;
}

async function createInvoice(tenantId, data) {
  const { invoice_number, customer_name, amount, tax, total, status, due_date, notes } = data;
  const result = await query(
    `INSERT INTO invoices (tenant_id, invoice_number, customer_name, amount, tax, total, status, due_date, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [tenantId, invoice_number, customer_name, parseFloat(amount) || 0, parseFloat(tax) || 0, parseFloat(total) || 0, status || 'Draft', due_date, notes || null]
  );
  const invoice = result.rows[0];
  if (invoice) {
    await query(
      `INSERT INTO gst_amount (tenant_id, invoice_id, amount, created_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (invoice_id) DO UPDATE SET amount = EXCLUDED.amount`,
      [tenantId, invoice.id, invoice.tax, invoice.created_at]
    );
  }
  return invoice;
}

async function updateInvoice(tenantId, invoiceId, data) {
  const fields = ['invoice_number', 'customer_name', 'amount', 'tax', 'total', 'status', 'due_date', 'paid_date', 'notes'];
  const updates = [];
  const params = [];

  fields.forEach(f => {
    if (data[f] !== undefined) {
      params.push(data[f] === '' ? null : data[f]);
      updates.push(`${f} = $${params.length}`);
    }
  });

  if (updates.length === 0) return null;

  params.push(invoiceId, tenantId);
  const sql = `
    UPDATE invoices 
    SET ${updates.join(', ')}, updated_at = NOW()
    WHERE id = $${params.length - 1} AND tenant_id = $${params.length}
    RETURNING *
  `;

  const result = await query(sql, params);
  const updatedInvoice = result.rows[0];
  if (updatedInvoice) {
    await query(
      `INSERT INTO gst_amount (tenant_id, invoice_id, amount)
       VALUES ($1, $2, $3)
       ON CONFLICT (invoice_id) DO UPDATE SET amount = EXCLUDED.amount`,
      [tenantId, invoiceId, updatedInvoice.tax]
    );
  }
  return updatedInvoice;
}

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────

async function listPayments(tenantId, filters = {}) {
  const { status, method, search, page = 1, limit = 50 } = filters;
  let sql = `
    SELECT p.*, i.invoice_number, i.customer_name
    FROM payments p
    LEFT JOIN invoices i ON i.id = p.invoice_id
    WHERE p.tenant_id = $1
  `;
  const params = [tenantId];

  if (status) { params.push(status); sql += ` AND p.status = $${params.length}`; }
  if (method) { params.push(method); sql += ` AND p.method = $${params.length}`; }
  if (search) {
    params.push(`%${search}%`);
    sql += ` AND (i.invoice_number ILIKE $${params.length} OR i.customer_name ILIKE $${params.length} OR p.reference ILIKE $${params.length})`;
  }

  sql += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, (page - 1) * limit);
  const result = await query(sql, params);

  let countSql = `SELECT COUNT(*) AS cnt FROM payments p LEFT JOIN invoices i ON i.id = p.invoice_id WHERE p.tenant_id = $1`;
  const countParams = [tenantId];
  if (status) { countParams.push(status); countSql += ` AND p.status = $${countParams.length}`; }
  if (method) { countParams.push(method); countSql += ` AND p.method = $${countParams.length}`; }
  if (search) { countParams.push(`%${search}%`); countSql += ` AND (i.invoice_number ILIKE $${countParams.length} OR i.customer_name ILIKE $${countParams.length} OR p.reference ILIKE $${countParams.length})`; }
  const countResult = await query(countSql, countParams);

  return {
    payments: result.rows,
    total: parseInt(countResult.rows[0]?.cnt || 0),
    page,
    limit
  };
}

async function createPayment(tenantId, data) {
  const { invoice_id, amount, method, reference, status, paid_at } = data;
  const result = await query(
    `INSERT INTO payments (tenant_id, invoice_id, amount, method, reference, status, paid_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [tenantId, invoice_id || null, parseFloat(amount) || 0, method || 'Bank Transfer', reference || null, status || 'Completed', paid_at || new Date()]
  );

  // If linked to an invoice, check if fully paid and update invoice status
  if (invoice_id) {
    const totalPaid = await query(
      `SELECT COALESCE(SUM(amount), 0) AS total_paid FROM payments WHERE invoice_id = $1 AND status = 'Completed'`,
      [invoice_id]
    );
    const invoice = await query(`SELECT total FROM invoices WHERE id = $1`, [invoice_id]);
    if (invoice.rows[0] && parseFloat(totalPaid.rows[0].total_paid) >= parseFloat(invoice.rows[0].total)) {
      await query(`UPDATE invoices SET status = 'Paid', paid_date = CURRENT_DATE, updated_at = NOW() WHERE id = $1`, [invoice_id]);
    }
  }

  return result.rows[0];
}

// ─── EXPENSES ─────────────────────────────────────────────────────────────────

async function listExpenses(tenantId, filters = {}) {
  const { status, category, search, page = 1, limit = 50 } = filters;
  let sql = `
    SELECT e.*, v.name AS vendor_name, u.name AS approver_name
    FROM expenses e
    LEFT JOIN vendors v ON v.id = e.vendor_id
    LEFT JOIN users u ON u.id = e.approved_by
    WHERE e.tenant_id = $1
  `;
  const params = [tenantId];

  if (status) { params.push(status); sql += ` AND e.status = $${params.length}`; }
  if (category) { params.push(category); sql += ` AND e.category = $${params.length}`; }
  if (search) {
    params.push(`%${search}%`);
    sql += ` AND (e.description ILIKE $${params.length} OR e.category ILIKE $${params.length} OR v.name ILIKE $${params.length})`;
  }

  sql += ` ORDER BY e.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, (page - 1) * limit);
  const result = await query(sql, params);

  let countSql = `SELECT COUNT(*) AS cnt FROM expenses e LEFT JOIN vendors v ON v.id = e.vendor_id WHERE e.tenant_id = $1`;
  const countParams = [tenantId];
  if (status) { countParams.push(status); countSql += ` AND e.status = $${countParams.length}`; }
  if (category) { countParams.push(category); countSql += ` AND e.category = $${countParams.length}`; }
  if (search) { countParams.push(`%${search}%`); countSql += ` AND (e.description ILIKE $${countParams.length} OR e.category ILIKE $${countParams.length} OR v.name ILIKE $${countParams.length})`; }
  const countResult = await query(countSql, countParams);

  return {
    expenses: result.rows,
    total: parseInt(countResult.rows[0]?.cnt || 0),
    page,
    limit
  };
}

async function createExpense(tenantId, data) {
  const { category, description, amount, vendor_id, status, expense_date } = data;
  const result = await query(
    `INSERT INTO expenses (tenant_id, category, description, amount, vendor_id, status, expense_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [tenantId, category || 'General', description, parseFloat(amount) || 0, vendor_id || null, status || 'Pending', expense_date || new Date()]
  );
  return result.rows[0];
}

async function updateExpense(tenantId, expenseId, data) {
  const fields = ['category', 'description', 'amount', 'vendor_id', 'approved_by', 'status', 'expense_date'];
  const updates = [];
  const params = [];

  fields.forEach(f => {
    if (data[f] !== undefined) {
      params.push(data[f] === '' ? null : data[f]);
      updates.push(`${f} = $${params.length}`);
    }
  });

  if (updates.length === 0) return null;

  params.push(expenseId, tenantId);
  const sql = `UPDATE expenses SET ${updates.join(', ')} WHERE id = $${params.length - 1} AND tenant_id = $${params.length} RETURNING *`;
  const result = await query(sql, params);
  return result.rows[0] || null;
}

// ─── VENDORS ──────────────────────────────────────────────────────────────────

async function listVendors(tenantId, filters = {}) {
  const { status, category, search, page = 1, limit = 50 } = filters;
  let sql = `SELECT * FROM vendors WHERE tenant_id = $1`;
  const params = [tenantId];

  if (status) { params.push(status); sql += ` AND status = $${params.length}`; }
  if (category) { params.push(category); sql += ` AND category = $${params.length}`; }
  if (search) {
    params.push(`%${search}%`);
    sql += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length})`;
  }

  sql += ` ORDER BY name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, (page - 1) * limit);
  const result = await query(sql, params);

  let countSql = `SELECT COUNT(*) AS cnt FROM vendors WHERE tenant_id = $1`;
  const countParams = [tenantId];
  if (status) { countParams.push(status); countSql += ` AND status = $${countParams.length}`; }
  if (category) { countParams.push(category); countSql += ` AND category = $${countParams.length}`; }
  if (search) { countParams.push(`%${search}%`); countSql += ` AND (name ILIKE $${countParams.length} OR email ILIKE $${countParams.length})`; }
  const countResult = await query(countSql, countParams);

  return {
    vendors: result.rows,
    total: parseInt(countResult.rows[0]?.cnt || 0),
    page,
    limit
  };
}

async function getVendorById(tenantId, vendorId) {
  const result = await query(
    `SELECT * FROM vendors WHERE id = $1 AND tenant_id = $2`,
    [vendorId, tenantId]
  );
  if (result.rows.length === 0) return null;

  // Get associated expenses
  const expenses = await query(
    `SELECT id, category, description, amount, status, expense_date FROM expenses WHERE vendor_id = $1 AND tenant_id = $2 ORDER BY expense_date DESC LIMIT 10`,
    [vendorId, tenantId]
  );

  return { vendor: result.rows[0], expenses: expenses.rows };
}

async function createVendor(tenantId, data) {
  const { name, email, phone, address, category, status } = data;
  const result = await query(
    `INSERT INTO vendors (tenant_id, name, email, phone, address, category, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [tenantId, name, email || null, phone || null, address || null, category || 'General', status || 'Active']
  );
  return result.rows[0];
}

async function updateVendor(tenantId, vendorId, data) {
  const fields = ['name', 'email', 'phone', 'address', 'category', 'status'];
  const updates = [];
  const params = [];

  fields.forEach(f => {
    if (data[f] !== undefined) {
      params.push(data[f] === '' ? null : data[f]);
      updates.push(`${f} = $${params.length}`);
    }
  });

  if (updates.length === 0) return null;

  params.push(vendorId, tenantId);
  const sql = `UPDATE vendors SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${params.length - 1} AND tenant_id = $${params.length} RETURNING *`;
  const result = await query(sql, params);
  return result.rows[0] || null;
}

// ─── PAYROLL ──────────────────────────────────────────────────────────────────

async function listPayroll(tenantId, filters = {}) {
  const { status, pay_period, page = 1, limit = 50 } = filters;
  let sql = `
    SELECT p.*, u.name AS employee_name, u.email AS employee_email
    FROM payroll p
    LEFT JOIN users u ON u.id = p.employee_id
    WHERE p.tenant_id = $1
  `;
  const params = [tenantId];

  if (status) { params.push(status); sql += ` AND p.status = $${params.length}`; }
  if (pay_period) { params.push(pay_period); sql += ` AND p.pay_period = $${params.length}`; }

  sql += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, (page - 1) * limit);
  const result = await query(sql, params);

  let countSql = `SELECT COUNT(*) AS cnt FROM payroll WHERE tenant_id = $1`;
  const countParams = [tenantId];
  if (status) { countParams.push(status); countSql += ` AND status = $${countParams.length}`; }
  if (pay_period) { countParams.push(pay_period); countSql += ` AND pay_period = $${countParams.length}`; }
  const countResult = await query(countSql, countParams);

  return {
    payroll: result.rows,
    total: parseInt(countResult.rows[0]?.cnt || 0),
    page,
    limit
  };
}

// ─── TAX RECORDS ──────────────────────────────────────────────────────────────

async function listTaxRecords(tenantId, filters = {}) {
  const { status, tax_type, page = 1, limit = 50 } = filters;
  let sql = `SELECT * FROM tax_records WHERE tenant_id = $1`;
  const params = [tenantId];

  if (status) { params.push(status); sql += ` AND status = $${params.length}`; }
  if (tax_type) { params.push(tax_type); sql += ` AND tax_type = $${params.length}`; }

  sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, (page - 1) * limit);
  const result = await query(sql, params);

  let countSql = `SELECT COUNT(*) AS cnt FROM tax_records WHERE tenant_id = $1`;
  const countParams = [tenantId];
  if (status) { countParams.push(status); countSql += ` AND status = $${countParams.length}`; }
  if (tax_type) { countParams.push(tax_type); countSql += ` AND tax_type = $${countParams.length}`; }
  const countResult = await query(countSql, countParams);

  return {
    taxRecords: result.rows,
    total: parseInt(countResult.rows[0]?.cnt || 0),
    page,
    limit
  };
}

// ─── ANALYTICS ────────────────────────────────────────────────────────────────

async function getFinanceAnalytics(tenantId) {
  // Cash flow: monthly inflow vs outflow over last 6 months
  const cashFlow = await query(
    `SELECT 
       months.month_label AS month,
       COALESCE(inv.total, 0) AS inflow,
       COALESCE(exp.total, 0) AS outflow
     FROM (
       SELECT TO_CHAR(d, 'Mon') AS month_label, DATE_TRUNC('month', d) AS month_start
       FROM generate_series(
         DATE_TRUNC('month', NOW() - INTERVAL '5 months'),
         DATE_TRUNC('month', NOW()),
         '1 month'
       ) d
     ) months
     LEFT JOIN (
       SELECT DATE_TRUNC('month', paid_date) AS m, SUM(total) AS total
       FROM invoices WHERE tenant_id = $1 AND status = 'Paid' AND paid_date >= NOW() - INTERVAL '6 months'
       GROUP BY DATE_TRUNC('month', paid_date)
     ) inv ON inv.m = months.month_start
     LEFT JOIN (
       SELECT DATE_TRUNC('month', expense_date) AS m, SUM(amount) AS total
       FROM expenses WHERE tenant_id = $1 AND status = 'Approved' AND expense_date >= NOW() - INTERVAL '6 months'
       GROUP BY DATE_TRUNC('month', expense_date)
     ) exp ON exp.m = months.month_start
     ORDER BY months.month_start`,
    [tenantId]
  );

  // Payment method distribution
  const paymentMethods = await query(
    `SELECT method, COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total 
     FROM payments WHERE tenant_id = $1 AND status = 'Completed' GROUP BY method ORDER BY total DESC`,
    [tenantId]
  );

  // Invoice status distribution
  const invoiceStatus = await query(
    `SELECT status, COUNT(*) AS count, COALESCE(SUM(total), 0) AS total
     FROM invoices WHERE tenant_id = $1 GROUP BY status ORDER BY count DESC`,
    [tenantId]
  );

  // Top customers by revenue
  const topCustomers = await query(
    `SELECT customer_name, COUNT(*) AS invoice_count, COALESCE(SUM(total), 0) AS total_revenue
     FROM invoices WHERE tenant_id = $1 AND status = 'Paid' GROUP BY customer_name ORDER BY total_revenue DESC LIMIT 5`,
    [tenantId]
  );

  // Vendor spend breakdown
  const vendorSpend = await query(
    `SELECT v.name, COALESCE(SUM(e.amount), 0) AS total_spend, COUNT(e.id) AS expense_count
     FROM vendors v
     LEFT JOIN expenses e ON e.vendor_id = v.id AND e.status = 'Approved'
     WHERE v.tenant_id = $1
     GROUP BY v.name ORDER BY total_spend DESC LIMIT 5`,
    [tenantId]
  );

  // Monthly profit trend
  const profitTrend = await query(
    `SELECT 
       months.month_label AS month,
       COALESCE(inv.total, 0) - COALESCE(exp.total, 0) AS profit
     FROM (
       SELECT TO_CHAR(d, 'Mon') AS month_label, DATE_TRUNC('month', d) AS month_start
       FROM generate_series(
         DATE_TRUNC('month', NOW() - INTERVAL '5 months'),
         DATE_TRUNC('month', NOW()),
         '1 month'
       ) d
     ) months
     LEFT JOIN (
       SELECT DATE_TRUNC('month', paid_date) AS m, SUM(total) AS total
       FROM invoices WHERE tenant_id = $1 AND status = 'Paid' AND paid_date >= NOW() - INTERVAL '6 months'
       GROUP BY DATE_TRUNC('month', paid_date)
     ) inv ON inv.m = months.month_start
     LEFT JOIN (
       SELECT DATE_TRUNC('month', expense_date) AS m, SUM(amount) AS total
       FROM expenses WHERE tenant_id = $1 AND status = 'Approved' AND expense_date >= NOW() - INTERVAL '6 months'
       GROUP BY DATE_TRUNC('month', expense_date)
     ) exp ON exp.m = months.month_start
     ORDER BY months.month_start`,
    [tenantId]
  );

  return {
    cashFlow: cashFlow.rows.map(r => ({ month: r.month, inflow: parseFloat(r.inflow), outflow: parseFloat(r.outflow) })),
    paymentMethods: paymentMethods.rows.map(r => ({ method: r.method, count: parseInt(r.count), total: parseFloat(r.total) })),
    invoiceStatus: invoiceStatus.rows.map(r => ({ status: r.status, count: parseInt(r.count), total: parseFloat(r.total) })),
    topCustomers: topCustomers.rows.map(r => ({ name: r.customer_name, invoiceCount: parseInt(r.invoice_count), revenue: parseFloat(r.total_revenue) })),
    vendorSpend: vendorSpend.rows.map(r => ({ name: r.name, spend: parseFloat(r.total_spend), expenseCount: parseInt(r.expense_count) })),
    profitTrend: profitTrend.rows.map(r => ({ month: r.month, profit: parseFloat(r.profit) }))
  };
}

// ─── CREDIT / DEBIT NOTES ─────────────────────────────────────────────────────

async function listCreditNotes(tenantId, invoiceId) {
  const result = await query(
    `SELECT * FROM credit_notes WHERE tenant_id = $1 AND invoice_id = $2 ORDER BY created_at DESC`,
    [tenantId, invoiceId]
  );
  return result.rows;
}

async function createCreditNote(tenantId, invoiceId, data) {
  const { note_number, type, reason, items, amount, notes } = data;

  // Ensure the parent invoice belongs to this tenant and is Paid
  const invResult = await query(
    `SELECT * FROM invoices WHERE id = $1 AND tenant_id = $2`,
    [invoiceId, tenantId]
  );
  if (!invResult.rows[0]) throw new Error('Invoice not found');
  if (invResult.rows[0].status !== 'Paid') throw new Error('Only Paid invoices can have a return / credit note');

  const result = await query(
    `INSERT INTO credit_notes (tenant_id, invoice_id, note_number, type, reason, items, amount, notes, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Issued')
     RETURNING *`,
    [
      tenantId, invoiceId,
      note_number, type || 'Credit Note',
      reason || null,
      items ? JSON.stringify(items) : null,
      parseFloat(amount) || 0,
      notes || null,
    ]
  );
  return result.rows[0];
}

module.exports = {
  getFinanceDashboard,
  listInvoices,
  getInvoiceById,
  getInvoiceByNumber,
  createInvoice,
  updateInvoice,
  listPayments,
  createPayment,
  deletePayment,
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  listVendors,
  getVendorById,
  createVendor,
  updateVendor,
  listPayroll,
  listTaxRecords,
  getFinanceAnalytics,
  listCreditNotes,
  createCreditNote,
};
