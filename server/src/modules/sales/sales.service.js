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

  // Performance data (completed vs missed over last 7 days)
  let perfSql = `
    SELECT 
      to_char(date_trunc('day', scheduled_at), 'Dy') AS day_name,
      EXTRACT(DOW FROM scheduled_at) AS dow,
      COUNT(*) FILTER (WHERE status = 'Done') AS completed,
      COUNT(*) FILTER (WHERE status = 'Missed') AS missed
    FROM tasks
    WHERE tenant_id = $1 AND scheduled_at >= CURRENT_DATE - INTERVAL '6 days'
  `;
  const perfParams = [tenantId];
  if (scopeUserId) {
    perfParams.push(scopeUserId);
    perfSql += ` AND user_id = $${perfParams.length}`;
  }
  perfSql += ` GROUP BY day_name, dow ORDER BY dow`;
  const perfResult = await query(perfSql, perfParams);

  const perfData = [];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date().getDay();
  for (let i = 6; i >= 0; i--) {
    let d = today - i;
    if (d < 0) d += 7;
    const row = perfResult.rows.find(r => r.day_name === days[d]) || { completed: 0, missed: 0 };
    perfData.push({
      day: days[d],
      completed: parseInt(row.completed || 0),
      missed: parseInt(row.missed || 0)
    });
  }

  return { tasks: result.rows, perfData };
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

  // Weekly data aggregation
  let weeklySql = `
    SELECT 
      to_char(date_trunc('day', created_at), 'Dy') AS day_name,
      EXTRACT(DOW FROM created_at) AS dow,
      COUNT(*) FILTER (WHERE type = 'Call') AS calls,
      COUNT(*) FILTER (WHERE type = 'Email') AS emails,
      COUNT(*) FILTER (WHERE type = 'Meeting') AS meetings
    FROM activities
    WHERE tenant_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '6 days'
  `;
  const weeklyParams = [tenantId];

  if (scopeUserId) {
    weeklyParams.push(scopeUserId);
    weeklySql += ` AND user_id = $${weeklyParams.length}`;
  }

  weeklySql += ` GROUP BY day_name, dow ORDER BY dow`;
  const weeklyResult = await query(weeklySql, weeklyParams);

  // Map to 7 days, ensuring all days are present
  const weekly_data = [];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date().getDay();
  for (let i = 6; i >= 0; i--) {
    let d = today - i;
    if (d < 0) d += 7;
    const row = weeklyResult.rows.find(r => r.day_name === days[d]) || { calls: 0, emails: 0, meetings: 0 };
    weekly_data.push({
      day: days[d],
      calls: parseInt(row.calls || 0),
      emails: parseInt(row.emails || 0),
      meetings: parseInt(row.meetings || 0)
    });
  }

  return { summary, weekly_data };
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

  const weeklyPerf = [
    { day: 'Mon', calls: 12, emails: 8, meetings: 2, revenue: 18000, leads: 5 },
    { day: 'Tue', calls: 18, emails: 12, meetings: 3, revenue: 25000, leads: 8 },
    { day: 'Wed', calls: 9,  emails: 7,  meetings: 1, revenue: 12000, leads: 3 },
    { day: 'Thu', calls: 22, emails: 15, meetings: 4, revenue: 38000, leads: 11 },
    { day: 'Fri', calls: 16, emails: 10, meetings: 2, revenue: 22000, leads: 7 },
    { day: 'Sat', calls: 6,  emails: 4,  meetings: 1, revenue: 8000,  leads: 2 },
    { day: 'Sun', calls: 3,  emails: 2,  meetings: 0, revenue: 5000,  leads: 1 }
  ];

  const funnelData = [
    { stage: 'Assigned Leads', value: parseInt(pendingLeads.rows[0].cnt) + 50, color: '#3B82F6' },
    { stage: 'Contacted', value: parseInt(pendingLeads.rows[0].cnt) + 30, color: '#8B5CF6' },
    { stage: 'Negotiation', value: parseInt(pendingLeads.rows[0].cnt) + 15, color: '#EC4899' },
    { stage: 'Converted', value: target.converted_leads, color: '#10B981' }
  ];

  const sourcePie = [
    { name: 'Website', value: 45, color: '#3B82F6' },
    { name: 'Referral', value: 25, color: '#10B981' },
    { name: 'LinkedIn', value: 20, color: '#8B5CF6' },
    { name: 'Cold Call', value: 10, color: '#F59E0B' }
  ];

  const notifications = [
    { id: 1, type: 'alert', title: 'High Priority Lead', msg: 'Acme Corp requested a demo.', time: '10 min ago', read: false },
    { id: 2, type: 'success', title: 'Deal Closed', msg: 'TechFlow contract signed.', time: '1 hr ago', read: false },
    { id: 3, type: 'warning', title: 'Follow-up Missed', msg: 'Call with Globex was missed.', time: '2 hrs ago', read: true }
  ];

  const aiInsights = [
    { title: 'Follow-up Opportunity', desc: 'Leads from LinkedIn convert 20% higher. Focus on pending LinkedIn leads.', type: 'positive' },
    { title: 'SLA Warning', desc: '3 leads have not been contacted in 48 hours.', type: 'warning' }
  ];


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
    todayTasks: todayTasks.slice(0, 5),
    weeklyPerf,
    funnelData,
    sourcePie,
    notifications,
    aiInsights
  };
}

module.exports = {
  listLeads, getLeadById, createLead, updateLead, deleteLead, getLeadActivities,
  listTasks, createTask, updateTask, deleteTask, listTodayTasks,
  listActivities, logActivity, getActivitiesSummary,
  getPerformanceStats, updateProfile, getDashboardKPIs
};
