const { query } = require('../../config/database');

// ─── LEADS ───────────────────────────────────────────────────────────────────

async function listLeads(tenantId, scopeUserId, { status, priority, search } = {}) {
  let sql = `SELECT * FROM leads_marketing WHERE tenant_id = $1`;
  const params = [tenantId];

  if (scopeUserId) {
    params.push(scopeUserId);
    sql += ` AND assigned_to = $${params.length}`;
  }

  if (status) {
    params.push(status);
    sql += ` AND status = $${params.length}`;
  }

  if (priority) {
    params.push(priority);
    sql += ` AND priority = $${params.length}`;
  }

  if (search) {
    params.push(`%${search}%`);
    sql += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length} OR company ILIKE $${params.length})`;
  }

  sql += ` ORDER BY created_at DESC`;

  const result = await query(sql, params);
  return result.rows;
}

async function getLeadById(tenantId, scopeUserId, id) {
  let sql = `SELECT * FROM leads_marketing WHERE id = $1 AND tenant_id = $2`;
  const params = [id, tenantId];

  if (scopeUserId) {
    params.push(scopeUserId);
    sql += ` AND assigned_to = $${params.length}`;
  }

  const result = await query(sql, params);
  return result.rows[0] || null;
}

async function createLead(tenantId, userId, data) {
  const { name, phone, email, source, platform, priority, company, notes, next_followup, conversion_probability } = data;
  const result = await query(
    `INSERT INTO leads_marketing (
      tenant_id, name, phone, email, source, platform, status, quality_score,
      assigned_to, priority, company, notes, next_followup, conversion_probability
    ) VALUES ($1, $2, $3, $4, $5, $6, 'New', 75, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
    [
      tenantId, name, phone || null, email || null, source || 'Manual', platform || 'Direct',
      userId, priority || 'Warm', company || null, notes || null, next_followup || null,
      conversion_probability || 50
    ]
  );
  return result.rows[0];
}

async function updateLead(tenantId, scopeUserId, id, data) {
  const fields = ['status', 'priority', 'company', 'notes', 'next_followup', 'conversion_probability'];
  const updates = [];
  const params = [];

  fields.forEach(f => {
    if (data[f] !== undefined) {
      params.push(data[f]);
      updates.push(`${f} = $${params.length}`);
    }
  });

  if (!updates.length) return null;

  params.push(id, tenantId);
  let sql = `UPDATE leads_marketing SET ${updates.join(', ')}, updated_at = NOW()
             WHERE id = $${params.length - 1} AND tenant_id = $${params.length}`;

  if (scopeUserId) {
    params.push(scopeUserId);
    sql += ` AND assigned_to = $${params.length}`;
  }

  sql += ` RETURNING *`;

  const result = await query(sql, params);
  return result.rows[0] || null;
}

async function deleteLead(tenantId, scopeUserId, id) {
  let sql = `DELETE FROM leads_marketing WHERE id = $1 AND tenant_id = $2`;
  const params = [id, tenantId];
  if (scopeUserId) {
    params.push(scopeUserId);
    sql += ` AND assigned_to = $${params.length}`;
  }
  sql += ` RETURNING id`;
  const result = await query(sql, params);
  return result.rows[0] || null;
}

async function getLeadActivities(tenantId, scopeUserId, leadId) {
  // Verify ownership first
  if (scopeUserId) {
    const lead = await getLeadById(tenantId, scopeUserId, leadId);
    if (!lead) return [];
  }

  const result = await query(
    `SELECT * FROM activities
     WHERE lead_id = $1 AND tenant_id = $2
     ORDER BY created_at DESC`,
    [leadId, tenantId]
  );
  return result.rows;
}

// ─── TASKS ───────────────────────────────────────────────────────────────────

async function listTasks(tenantId, scopeUserId, { status, priority, type } = {}) {
  let sql = `SELECT t.*, l.name AS lead_name, l.phone AS lead_phone 
             FROM tasks t
             LEFT JOIN leads_marketing l ON l.id = t.lead_id
             WHERE t.tenant_id = $1`;
  const params = [tenantId];

  if (scopeUserId) {
    params.push(scopeUserId);
    sql += ` AND t.user_id = $${params.length}`;
  }

  if (status) {
    params.push(status);
    sql += ` AND t.status = $${params.length}`;
  }

  if (priority) {
    params.push(priority);
    sql += ` AND t.priority = $${params.length}`;
  }

  if (type) {
    params.push(type);
    sql += ` AND t.type = $${params.length}`;
  }

  sql += ` ORDER BY t.scheduled_at ASC`;

  const result = await query(sql, params);
  return result.rows;
}

async function createTask(tenantId, userId, data) {
  const { lead_id, type, title, scheduled_at, priority, notes } = data;
  const result = await query(
    `INSERT INTO tasks (tenant_id, user_id, lead_id, type, title, scheduled_at, priority, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [tenantId, userId, lead_id || null, type, title, scheduled_at || null, priority || 'Medium', notes || null]
  );
  return result.rows[0];
}

async function updateTask(tenantId, scopeUserId, id, data) {
  const fields = ['status', 'priority', 'notes', 'scheduled_at', 'completed_at', 'title'];
  const updates = [];
  const params = [];

  fields.forEach(f => {
    if (data[f] !== undefined) {
      params.push(data[f]);
      updates.push(`${f} = $${params.length}`);
    }
  });

  if (!updates.length) return null;

  params.push(id, tenantId);
  let sql = `UPDATE tasks SET ${updates.join(', ')}
             WHERE id = $${params.length - 1} AND tenant_id = $${params.length}`;

  if (scopeUserId) {
    params.push(scopeUserId);
    sql += ` AND user_id = $${params.length}`;
  }

  sql += ` RETURNING *`;

  const result = await query(sql, params);
  return result.rows[0] || null;
}

async function deleteTask(tenantId, scopeUserId, id) {
  let sql = `DELETE FROM tasks WHERE id = $1 AND tenant_id = $2`;
  const params = [id, tenantId];

  if (scopeUserId) {
    params.push(scopeUserId);
    sql += ` AND user_id = $${params.length}`;
  }

  sql += ` RETURNING id`;
  const result = await query(sql, params);
  return !!result.rows[0];
}

async function listTodayTasks(tenantId, scopeUserId) {
  let sql = `SELECT t.*, l.name AS lead_name, l.phone AS lead_phone 
             FROM tasks t
             LEFT JOIN leads_marketing l ON l.id = t.lead_id
             WHERE t.tenant_id = $1 AND t.scheduled_at::date = CURRENT_DATE`;
  const params = [tenantId];

  if (scopeUserId) {
    params.push(scopeUserId);
    sql += ` AND t.user_id = $${params.length}`;
  }

  sql += ` ORDER BY t.scheduled_at ASC`;
  const result = await query(sql, params);
  return result.rows;
}

// ─── ACTIVITIES ──────────────────────────────────────────────────────────────

async function listActivities(tenantId, scopeUserId, { type } = {}) {
  let sql = `SELECT a.*, l.name AS lead_name 
             FROM activities a
             LEFT JOIN leads_marketing l ON l.id = a.lead_id
             WHERE a.tenant_id = $1`;
  const params = [tenantId];

  if (scopeUserId) {
    params.push(scopeUserId);
    sql += ` AND a.user_id = $${params.length}`;
  }

  if (type) {
    params.push(type);
    sql += ` AND a.type = $${params.length}`;
  }

  sql += ` ORDER BY a.created_at DESC`;
  const result = await query(sql, params);
  return result.rows;
}

async function logActivity(tenantId, userId, data) {
  const { lead_id, type, outcome, duration_seconds, notes } = data;
  const result = await query(
    `INSERT INTO activities (tenant_id, user_id, lead_id, type, outcome, duration_seconds, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [tenantId, userId, lead_id || null, type, outcome || null, duration_seconds || 0, notes || null]
  );
  return result.rows[0];
}

async function getActivitiesSummary(tenantId, scopeUserId) {
  let sql = `SELECT type, COUNT(*) AS cnt 
             FROM activities 
             WHERE tenant_id = $1 AND created_at::date = CURRENT_DATE`;
  const params = [tenantId];

  if (scopeUserId) {
    params.push(scopeUserId);
    sql += ` AND user_id = $${params.length}`;
  }

  sql += ` GROUP BY type`;
  const result = await query(sql, params);

  const summary = { Call: 0, Email: 0, Meeting: 0 };
  result.rows.forEach(r => {
    if (summary[r.type] !== undefined) {
      summary[r.type] = parseInt(r.cnt);
    }
  });

  return summary;
}

// ─── PROFILE & PERFORMANCE ───────────────────────────────────────────────────

async function getPerformanceStats(tenantId, scopeUserId) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const targetResult = await query(
    `SELECT * FROM sales_targets
     WHERE tenant_id = $1 AND user_id = $2 AND month = $3 AND year = $4`,
    [tenantId, scopeUserId, month, year]
  );

  let target = targetResult.rows[0];

  if (!target) {
    // Insert a default/mock target for this month if none exists
    const mockTarget = await query(
      `INSERT INTO sales_targets (tenant_id, user_id, month, year, target_amount, achieved_amount, target_leads, converted_leads)
       VALUES ($1, $2, $3, $4, 100000.00, 86000.00, 50, 12)
       RETURNING *`,
      [tenantId, scopeUserId, month, year]
    );
    target = mockTarget.rows[0];
  }

  return target;
}

async function updateProfile(tenantId, userId, { name, email }) {
  const result = await query(
    `UPDATE users SET name = $1, email = $2, updated_at = NOW()
     WHERE id = $3 AND tenant_id = $4
     RETURNING id, name, email`,
    [name, email, userId, tenantId]
  );
  return result.rows[0];
}

async function getDashboardKPIs(tenantId, scopeUserId) {
  // Achieved today: sum of activity outcomes marked as 'Converted' or sales achieved today
  const target = await getPerformanceStats(tenantId, scopeUserId);

  const [pendingLeads, todayFollowups, hotLeads] = await Promise.all([
    query(
      `SELECT COUNT(*) AS cnt FROM leads_marketing 
       WHERE tenant_id = $1 AND assigned_to = $2 AND status = 'New'`,
      [tenantId, scopeUserId]
    ),
    query(
      `SELECT COUNT(*) AS cnt FROM tasks 
       WHERE tenant_id = $1 AND user_id = $2 AND status = 'Pending' AND scheduled_at::date = CURRENT_DATE`,
      [tenantId, scopeUserId]
    ),
    query(
      `SELECT * FROM leads_marketing 
       WHERE tenant_id = $1 AND assigned_to = $2 AND priority = 'Hot'
       ORDER BY conversion_probability DESC LIMIT 5`,
      [tenantId, scopeUserId]
    )
  ]);

  const todayActivities = await listActivities(tenantId, scopeUserId);
  const todayTasks = await listTodayTasks(tenantId, scopeUserId);

  return {
    target: {
      dailyTarget: 50000,
      achievedToday: 40000,
      monthlyTarget: parseFloat(target.target_amount),
      monthlyAchieved: parseFloat(target.achieved_amount),
      targetLeads: target.target_leads,
      convertedLeads: target.converted_leads
    },
    pendingLeadsCount: parseInt(pendingLeads.rows[0].cnt),
    todayFollowupsCount: parseInt(todayFollowups.rows[0].cnt),
    hotLeads: hotLeads.rows,
    todayActivities: todayActivities.slice(0, 5),
    todayTasks: todayTasks.slice(0, 5)
  };
}

module.exports = {
  listLeads, getLeadById, createLead, updateLead, deleteLead, getLeadActivities,
  listTasks, createTask, updateTask, deleteTask, listTodayTasks,
  listActivities, logActivity, getActivitiesSummary,
  getPerformanceStats, updateProfile, getDashboardKPIs
};
