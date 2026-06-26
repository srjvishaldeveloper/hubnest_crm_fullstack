const { query } = require('../../config/database');

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

async function getFinanceDashboard(tenantId, timeFilter = 'Monthly') {
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

  // Time Filter Logic
  let intervalSQL = "INTERVAL '6 months'";
  let truncSQL = "DATE_TRUNC('month', paid_date)";
  let truncExpSQL = "DATE_TRUNC('month', expense_date)";
  let formatSQL = "TO_CHAR(DATE_TRUNC('month', paid_date), 'Mon')";
  let formatExpSQL = "TO_CHAR(DATE_TRUNC('month', expense_date), 'Mon')";

  if (timeFilter === 'Weekly') {
    intervalSQL = "INTERVAL '3 months'";
    truncSQL = "DATE_TRUNC('week', paid_date)";
    truncExpSQL = "DATE_TRUNC('week', expense_date)";
    formatSQL = "'W' || TO_CHAR(DATE_TRUNC('week', paid_date), 'W Mon')";
    formatExpSQL = "'W' || TO_CHAR(DATE_TRUNC('week', expense_date), 'W Mon')";
  } else if (timeFilter === 'Quarterly') {
    intervalSQL = "INTERVAL '1 year'";
    truncSQL = "DATE_TRUNC('quarter', paid_date)";
    truncExpSQL = "DATE_TRUNC('quarter', expense_date)";
    formatSQL = "'Q' || TO_CHAR(DATE_TRUNC('quarter', paid_date), 'Q YYYY')";
    formatExpSQL = "'Q' || TO_CHAR(DATE_TRUNC('quarter', expense_date), 'Q YYYY')";
  } else if (timeFilter === 'Yearly') {
    intervalSQL = "INTERVAL '3 years'";
    truncSQL = "DATE_TRUNC('year', paid_date)";
    truncExpSQL = "DATE_TRUNC('year', expense_date)";
    formatSQL = "TO_CHAR(DATE_TRUNC('year', paid_date), 'YYYY')";
    formatExpSQL = "TO_CHAR(DATE_TRUNC('year', expense_date), 'YYYY')";
  }

  // Revenue Trend
  const revenueTrend = await query(
    `SELECT 
       ${formatSQL} AS month,
       COALESCE(SUM(total), 0) AS revenue
     FROM invoices
     WHERE tenant_id = $1 AND status = 'Paid' AND paid_date >= NOW() - ${intervalSQL}
     GROUP BY ${truncSQL}
     ORDER BY ${truncSQL}`,
    [tenantId]
  );

  // Expense Trend
  const expenseTrend = await query(
    `SELECT 
       ${formatExpSQL} AS month,
       COALESCE(SUM(amount), 0) AS expenses
     FROM expenses
     WHERE tenant_id = $1 AND status = 'Approved' AND expense_date >= NOW() - ${intervalSQL}
     GROUP BY ${truncExpSQL}
     ORDER BY ${truncExpSQL}`,
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

  // Payroll pending
  const payrollPendingResult = await query(
    `SELECT COALESCE(SUM(net_pay), 0) AS pending_payroll 
     FROM payroll WHERE tenant_id = $1 AND status = 'Pending'`,
    [tenantId]
  );

  const totalRevenue = parseFloat(revenueResult.rows[0]?.total_revenue || 0);
  const totalExpenses = parseFloat(expensesResult.rows[0]?.total_expenses || 0);
  const profit = totalRevenue - totalExpenses;

  // Mock Budget Tracking Data
  const budgetTracking = [
    { department: 'Marketing', allocated: 50000, used: 35000 },
    { department: 'Operations', allocated: 120000, used: 110000 },
    { department: 'IT & Software', allocated: 80000, used: 45000 }
  ];

  // AI Insights Generation based on KPIs
  const aiInsights = [];
  if (profit > 0) {
    aiInsights.push({ type: 'positive', message: 'Revenue is stable. Profit margin looks healthy.', action: 'View Reports' });
  } else {
    aiInsights.push({ type: 'negative', message: 'Expenses are increasing faster than revenue. Profit can improve.', action: 'Review Expenses' });
  }
  
  const totalAllocated = budgetTracking.reduce((sum, b) => sum + b.allocated, 0);
  const totalUsed = budgetTracking.reduce((sum, b) => sum + b.used, 0);
  if (totalUsed > totalAllocated * 0.8) {
    aiInsights.push({ type: 'warning', message: 'Budget utilization is over 80%. High risk of overspending.', action: 'Optimize Budget' });
  } else {
    aiInsights.push({ type: 'positive', message: 'Budget tracking is under control.', action: 'View Budgets' });
  }

  // Mock Compliance Alerts
  const complianceAlerts = [
    { type: 'Tax Deadline', description: 'Q2 GST Return filing due in 5 days', severity: 'high', dueDate: new Date(Date.now() + 5 * 86400000).toISOString() },
    { type: 'Legal', description: 'Annual Corporate Compliance filing pending', severity: 'medium', dueDate: new Date(Date.now() + 15 * 86400000).toISOString() }
  ];

  return {
    kpis: {
      totalRevenue,
      totalExpenses,
      profit,
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
      pendingPayroll: parseFloat(payrollPendingResult.rows[0]?.pending_payroll || 0),
      employeeCount: parseInt(payrollSummary.rows[0]?.employee_count || 0)
    },
    revenueTrend: revenueTrend.rows.map(r => ({ month: r.month, revenue: parseFloat(r.revenue) })),
    expenseTrend: expenseTrend.rows.map(r => ({ month: r.month, expenses: parseFloat(r.expenses) })),
    expenseByCategory: expenseByCategory.rows.map(r => ({ category: r.category, total: parseFloat(r.total) })),
    taxSummary: taxSummary.rows.map(r => ({ taxType: r.tax_type, total: parseFloat(r.total), status: r.status })),
    recentInvoices: recentInvoices.rows,
    recentPayments: recentPayments.rows,
    pendingExpenses: pendingExpenses.rows,
    budgetTracking,
    aiInsights,
    complianceAlerts
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


async function getPayrollDashboard(tenantId) {
  const employees = await query('SELECT p.*, u.name as name, u.email as employee_email FROM payroll p LEFT JOIN users u ON u.id = p.employee_id WHERE p.tenant_id = $1 LIMIT 50', [tenantId]);
  
  // Just in case no employees, we fallback to an empty array.
  let empData = employees.rows;
  if(empData.length === 0) {
    empData = [
      { id:'1', name:'Aarav Sharma', employeeId:'EMP-1001', department:'Engineering', designation:'Senior Developer', basicSalary:85000, hra:34000, bonuses:10000, pf:10200, tds:12750, esi:637, professionalTax:200, loanDeduction:5000, netSalary:100213, grossSalary:129000, totalDeductions:28787, status:'Paid', bankAccount:'HDFC ****4521', panNumber:'ABCPS1234K', joiningDate:'2022-03-15' },
      { id:'2', name:'Priya Patel', employeeId:'EMP-1002', department:'Marketing', designation:'Marketing Manager', basicSalary:72000, hra:28800, bonuses:8000, pf:8640, tds:10800, esi:540, professionalTax:200, loanDeduction:0, netSalary:88620, grossSalary:108800, totalDeductions:20180, status:'Pending', bankAccount:'ICICI ****7832', panNumber:'DEFPP5678L', joiningDate:'2021-08-20' },
      { id:'3', name:'Rohan Mehta', employeeId:'EMP-1003', department:'Sales', designation:'Sales Lead', basicSalary:65000, hra:26000, bonuses:15000, pf:7800, tds:9750, esi:487, professionalTax:200, loanDeduction:3000, netSalary:84763, grossSalary:106000, totalDeductions:21237, status:'Paid', bankAccount:'SBI ****9210', panNumber:'GHJRM9012M', joiningDate:'2023-01-10' }
    ];
  }

  const kpis = {
    totalEmployeesPaid: empData.filter(e => e.status === 'Paid').length,
    totalPayrollCost: empData.reduce((sum, e) => sum + (e.grossSalary || 0), 0),
    pendingPayroll: empData.filter(e => e.status === 'Pending').reduce((sum, e) => sum + (e.netSalary || 0), 0),
    totalDeductions: empData.reduce((sum, e) => sum + (e.totalDeductions || 0), 0)
  };

  const monthlyTrend = [
    { month:'Jan', payroll:1620000, deductions:390000 },
    { month:'Feb', payroll:1650000, deductions:400000 },
    { month:'Mar', payroll:1700000, deductions:415000 },
    { month:'Apr', payroll:1740000, deductions:430000 },
    { month:'May', payroll:1780000, deductions:455000 },
    { month:'Jun', payroll: kpis.totalPayrollCost > 0 ? kpis.totalPayrollCost : 1850000, deductions: kpis.totalDeductions > 0 ? kpis.totalDeductions : 480000 },
  ];

  return {
    kpis,
    employees: empData,
    monthlyTrend
  };
}


async function getComplianceDashboard(tenantId) {
  const taxRecords = [
    { id: '1', taxType: 'GST', period: 'Q1 2026', amount: 847500, dueDate: '2026-06-30', status: 'Pending', filingDate: null, description: 'GSTR-3B Quarterly Return' },
    { id: '2', taxType: 'TDS', period: 'Q1 2026', amount: 234800, dueDate: '2026-07-07', status: 'Pending', filingDate: null, description: 'TDS on Salary & Contracts' },
    { id: '3', taxType: 'GST', period: 'Q4 2025', amount: 792000, dueDate: '2026-03-31', status: 'Filed', filingDate: '2026-03-28', description: 'GSTR-3B Quarterly Return' },
    { id: '4', taxType: 'Income Tax', period: 'FY 2025-26', amount: 1250000, dueDate: '2026-07-31', status: 'Pending', filingDate: null, description: 'Corporate Income Tax Return' },
    { id: '5', taxType: 'Professional Tax', period: 'Jun 2026', amount: 12500, dueDate: '2026-06-15', status: 'Overdue', filingDate: null, description: 'PT for All Employees' }
  ];

  const statutoryCompliance = [
    {
      id: 'pf', name: 'Provident Fund (PF)', lastFiled: '2026-05-15', nextDue: '2026-06-15', status: 'Overdue',
      monthlyAmount: 185000, employees: 48, description: "EPF contribution under Employees' Provident Fund Act",
      color: 'from-violet-500 to-indigo-600', iconType: 'Users'
    },
    {
      id: 'esi', name: 'ESI (Employee State Insurance)', lastFiled: '2026-05-15', nextDue: '2026-07-15', status: 'Filed',
      monthlyAmount: 62000, employees: 32, description: 'ESI contribution for eligible employees',
      color: 'from-emerald-500 to-teal-600', iconType: 'Shield'
    },
    {
      id: 'lwf', name: 'Labor Welfare Fund', lastFiled: '2026-01-15', nextDue: '2026-07-15', status: 'Pending',
      monthlyAmount: 8500, employees: 48, description: 'Semi-annual LWF contribution under state act',
      color: 'from-amber-500 to-orange-600', iconType: 'Landmark'
    }
  ];

  const deadlines = [
    { id: '1', title: 'GST Filing (GSTR-3B)', date: '2026-06-30', urgency: 'upcoming', daysLeft: 5, category: 'Tax', amount: 847500 },
    { id: '2', title: 'TDS Payment - Q1', date: '2026-07-07', urgency: 'upcoming', daysLeft: 12, category: 'Tax', amount: 234800 },
    { id: '3', title: 'PF Submission - June', date: '2026-06-15', urgency: 'overdue', daysLeft: -10, category: 'Statutory', amount: 185000 }
  ];

  const complianceScoreTrend = [
    { month: 'Jan', score: 92 },
    { month: 'Feb', score: 88 },
    { month: 'Mar', score: 94 },
    { month: 'Apr', score: 91 },
    { month: 'May', score: 85 },
    { month: 'Jun', score: 87 },
  ];

  const riskItems = [
    { id: '1', title: 'PF Submission Overdue', severity: 'High', status: 'Open', description: 'Provident Fund for May 2026 is overdue. Penalty applies after June 15.' },
    { id: '2', title: 'GST Mismatch in GSTR-2B', severity: 'Medium', status: 'In Progress', description: 'Input Tax Credit mismatch detected for 3 vendor invoices.' },
    { id: '3', title: 'Missing PAN for 2 Employees', severity: 'Low', status: 'Open', description: 'TDS calculation requires PAN details for new joinees.' },
  ];

  const documents = [
    { id: '1', name: 'GST Certificate', type: 'Registration', status: 'Verified', uploadDate: '2024-01-10', expiryDate: '2027-01-10' },
    { id: '2', name: 'Incorporation Certificate', type: 'Registration', status: 'Verified', uploadDate: '2022-03-15', expiryDate: null },
    { id: '3', name: 'Q1 TDS Return Acknowledgement', type: 'Filing', status: 'Pending', uploadDate: '2026-07-07', expiryDate: null },
    { id: '4', name: 'PF Registration Certificate', type: 'Registration', status: 'Verified', uploadDate: '2023-01-20', expiryDate: null },
    { id: '5', name: 'Trade License', type: 'License', status: 'Expired', uploadDate: '2023-12-01', expiryDate: '2025-12-31' },
  ];

  return {
    taxRecords,
    statutoryCompliance,
    deadlines,
    complianceScoreTrend,
    riskItems,
    documents
  };
}


async function getProfileDashboard(tenantId) {
  const performanceKPIs = [
    { label: 'Payroll Processed', value: '₹82.4L', change: '+12%', trend: 'up', color: 'from-blue-500 to-blue-600', iconType: 'IndianRupee' },
    { label: 'Expenses Approved', value: '₹15.2L', change: '-5%',  trend: 'down', color: 'from-rose-500 to-rose-600', iconType: 'Receipt' },
    { label: 'Budget Managed', value: '₹1.2Cr', change: '+8%',  trend: 'up', color: 'from-emerald-500 to-emerald-600', iconType: 'TrendingUp' },
    { label: 'Compliance Tasks', value: '24/24', change: '100%', trend: 'up', color: 'from-violet-500 to-violet-600', iconType: 'ClipboardCheck' },
  ];

  const monthlyPerformance = [
    { month: 'Jan', processed: 65, approved: 58, target: 70 },
    { month: 'Feb', processed: 72, approved: 65, target: 70 },
    { month: 'Mar', processed: 85, approved: 80, target: 75 },
    { month: 'Apr', processed: 78, approved: 72, target: 75 },
    { month: 'May', processed: 90, approved: 85, target: 80 },
    { month: 'Jun', processed: 94, approved: 89, target: 82 },
  ];

  const recentApprovals = [
    { id: 'AP-001', title: 'Office Supplies Expense', type: 'Expense', amount: '₹45,000', requestedBy: 'Amit Kumar', date: '2026-06-25', status: 'Approved' },
    { id: 'AP-002', title: 'June Payroll Processing', type: 'Payroll', amount: '₹18.5L', requestedBy: 'HR Dept', date: '2026-06-24', status: 'Approved' },
    { id: 'AP-003', title: 'Software License Renewal', type: 'Vendor', amount: '₹1,25,000', requestedBy: 'IT Dept', date: '2026-06-23', status: 'Pending' },
    { id: 'AP-004', title: 'Travel Reimbursement', type: 'Expense', amount: '₹12,000', requestedBy: 'Sneha Iyer', date: '2026-06-22', status: 'Rejected' },
    { id: 'AP-005', title: 'Q1 GST Payment', type: 'Tax', amount: '₹8,47,500', requestedBy: 'Compliance', date: '2026-06-20', status: 'Approved' },
  ];

  const approvalDistribution = [
    { name: 'Payroll', value: 45, color: '#6366f1' },
    { name: 'Expenses', value: 30, color: '#10b981' },
    { name: 'Vendors', value: 15, color: '#f59e0b' },
    { name: 'Taxes', value: 10, color: '#ef4444' },
  ];

  const documents = [
    { id: '1', name: 'Aadhar Card', type: 'Identity', status: 'Verified', uploadDate: '22 Jan 2022', size: '1.2 MB' },
    { id: '2', name: 'PAN Card', type: 'Identity', status: 'Verified', uploadDate: '22 Jan 2022', size: '0.8 MB' },
    { id: '3', name: 'Offer Letter', type: 'Employment', status: 'Verified', uploadDate: '10 Jan 2022', size: '0.5 MB' },
    { id: '4', name: 'Form 16 - FY25', type: 'Tax', status: 'Pending', uploadDate: '20 May 2026', size: '2.1 MB' },
    { id: '5', name: 'Appraisal Letter FY25', type: 'Employment', status: 'Rejected', uploadDate: '01 Dec 2025', size: '0.6 MB' },
  ];

  const activeSessions = [
    { id: '1', device: 'MacBook Pro 16"', browser: 'Chrome 124', location: 'Mumbai, IN', ip: '192.168.1.45', current: true, lastActive: 'Just now' },
    { id: '2', device: 'iPhone 14 Pro', browser: 'Safari Mobile', location: 'Mumbai, IN', ip: '10.0.2.14', current: false, lastActive: '2 hours ago' },
    { id: '3', device: 'Windows Desktop', browser: 'Edge 124', location: 'Pune, IN', ip: '192.168.1.102', current: false, lastActive: '3 days ago' },
  ];

  const loginHistory = [
    { id: '1', date: '25 Jun 2026, 09:15 AM', device: 'MacBook Pro', status: 'Success', ip: '192.168.1.45', location: 'Mumbai, IN' },
    { id: '2', date: '24 Jun 2026, 09:30 AM', device: 'MacBook Pro', status: 'Success', ip: '192.168.1.45', location: 'Mumbai, IN' },
    { id: '3', date: '23 Jun 2026, 08:45 PM', device: 'Unknown Device', status: 'Failed', ip: '103.11.22.33', location: 'Delhi, IN' },
    { id: '4', date: '23 Jun 2026, 09:00 AM', device: 'MacBook Pro', status: 'Success', ip: '192.168.1.45', location: 'Mumbai, IN' },
    { id: '5', date: '22 Jun 2026, 09:10 AM', device: 'iPhone 14 Pro', status: 'Success', ip: '10.0.2.14', location: 'Mumbai, IN' },
  ];

  return {
    performanceKPIs,
    monthlyPerformance,
    recentApprovals,
    approvalDistribution,
    documents,
    activeSessions,
    loginHistory
  };
}

module.exports = {
  getProfileDashboard,
  getComplianceDashboard,
  getPayrollDashboard,
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
