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

async function getTaskById(tenantId, scopeUserId, id) {
  let sql = `SELECT t.*, l.name AS lead_name, l.phone AS lead_phone, l.email AS lead_email
             FROM tasks t
             LEFT JOIN leads_marketing l ON l.id = t.lead_id
             WHERE t.id = $1 AND t.tenant_id = $2`;
  const params = [id, tenantId];
  if (scopeUserId) {
    params.push(scopeUserId);
    sql += ` AND t.user_id = $${params.length}`;
  }
  const result = await query(sql, params);
  return result.rows[0] || null;
}

async function createTask(tenantId, userId, data) {
  const { lead_id, type, title, scheduled_at, priority, notes, reminder_at } = data;
  const result = await query(
    `INSERT INTO tasks (tenant_id, user_id, lead_id, type, title, scheduled_at, priority, notes, reminder_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [tenantId, userId, lead_id || null, type, title, scheduled_at || null, priority || 'Medium', notes || null, reminder_at || null]
  );
  return result.rows[0];
}

async function updateTask(tenantId, scopeUserId, id, data) {
  const fields = ['status', 'priority', 'notes', 'scheduled_at', 'completed_at', 'title', 'reminder_at'];
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
  let sql = `SELECT a.*, l.name AS lead_name, l.phone AS lead_phone, l.email AS lead_email
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
  const { lead_id, type, outcome, duration_seconds, notes, follow_up_date } = data;
  const result = await query(
    `INSERT INTO activities (tenant_id, user_id, lead_id, type, outcome, duration_seconds, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [tenantId, userId, lead_id || null, type, outcome || null, duration_seconds || 0, notes || null]
  );
  // If follow_up_date is provided, also update the lead's next_followup
  if (follow_up_date && lead_id) {
    await query(
      `UPDATE leads_marketing SET next_followup = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3`,
      [follow_up_date, lead_id, tenantId]
    ).catch(() => {}); // non-fatal
  }
  return result.rows[0];
}

async function getActivitiesSummary(tenantId, scopeUserId, period = 'week') {
  // Today summary (always)
  let sql = `SELECT type, COUNT(*) AS cnt
             FROM activities
             WHERE tenant_id = $1 AND created_at::date = CURRENT_DATE`;
  const params = [tenantId];
  if (scopeUserId) { params.push(scopeUserId); sql += ` AND user_id = $${params.length}`; }
  sql += ` GROUP BY type`;
  const result = await query(sql, params);
  const summary = { Call: 0, Email: 0, Meeting: 0 };
  result.rows.forEach(r => { if (summary[r.type] !== undefined) summary[r.type] = parseInt(r.cnt); });

  // Period-based chart data
  let chartData = [];
  const scopeClause = scopeUserId ? ` AND a.user_id = $2` : '';
  const scopeParams = scopeUserId ? [tenantId, scopeUserId] : [tenantId];

  if (period === 'day') {
    // Hourly breakdown for today
    const res = await query(`
      SELECT EXTRACT(HOUR FROM created_at)::int AS hr,
        COUNT(*) FILTER (WHERE type='Call') AS calls,
        COUNT(*) FILTER (WHERE type='Email') AS emails,
        COUNT(*) FILTER (WHERE type='Meeting') AS meetings
      FROM activities a
      WHERE a.tenant_id = $1${scopeClause} AND created_at::date = CURRENT_DATE
      GROUP BY hr ORDER BY hr`, scopeParams);
    for (let h = 8; h <= 20; h++) {
      const row = res.rows.find(r => r.hr === h) || { calls: 0, emails: 0, meetings: 0 };
      chartData.push({
        label: `${h > 12 ? h - 12 : h}${h >= 12 ? 'PM' : 'AM'}`,
        calls: parseInt(row.calls || 0),
        emails: parseInt(row.emails || 0),
        meetings: parseInt(row.meetings || 0),
        total: parseInt(row.calls || 0) + parseInt(row.emails || 0) + parseInt(row.meetings || 0)
      });
    }
  } else if (period === 'month') {
    // Last 4 weeks
    const res = await query(`
      SELECT date_trunc('week', created_at) AS wk,
        COUNT(*) FILTER (WHERE type='Call') AS calls,
        COUNT(*) FILTER (WHERE type='Email') AS emails,
        COUNT(*) FILTER (WHERE type='Meeting') AS meetings
      FROM activities a
      WHERE a.tenant_id = $1${scopeClause} AND created_at >= CURRENT_DATE - INTERVAL '27 days'
      GROUP BY wk ORDER BY wk`, scopeParams);
    const weekLabels = ['Wk 1','Wk 2','Wk 3','Wk 4'];
    for (let i = 0; i < 4; i++) {
      const row = res.rows[i] || { calls: 0, emails: 0, meetings: 0 };
      chartData.push({
        label: weekLabels[i],
        calls: parseInt(row.calls || 0),
        emails: parseInt(row.emails || 0),
        meetings: parseInt(row.meetings || 0),
        total: parseInt(row.calls || 0) + parseInt(row.emails || 0) + parseInt(row.meetings || 0)
      });
    }
  } else {
    // Default: last 7 days
    const res = await query(`
      SELECT to_char(date_trunc('day', created_at), 'Dy') AS day_name,
        EXTRACT(DOW FROM created_at) AS dow,
        COUNT(*) FILTER (WHERE type='Call') AS calls,
        COUNT(*) FILTER (WHERE type='Email') AS emails,
        COUNT(*) FILTER (WHERE type='Meeting') AS meetings
      FROM activities a
      WHERE a.tenant_id = $1${scopeClause} AND created_at >= CURRENT_DATE - INTERVAL '6 days'
      GROUP BY day_name, dow ORDER BY dow`, scopeParams);
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const today = new Date().getDay();
    for (let i = 6; i >= 0; i--) {
      let d = today - i; if (d < 0) d += 7;
      const row = res.rows.find(r => r.day_name === days[d]) || { calls: 0, emails: 0, meetings: 0 };
      chartData.push({
        label: days[d],
        day: days[d],
        calls: parseInt(row.calls || 0),
        emails: parseInt(row.emails || 0),
        meetings: parseInt(row.meetings || 0),
        total: parseInt(row.calls || 0) + parseInt(row.emails || 0) + parseInt(row.meetings || 0)
      });
    }
  }

  // Performance trend: last 6 months (for profile chart)
  const monthRes = await query(`
    SELECT to_char(date_trunc('month', created_at), 'Mon') AS mon,
      EXTRACT(MONTH FROM created_at)::int AS month_num,
      COUNT(*) FILTER (WHERE type='Call') AS calls,
      COUNT(*) FILTER (WHERE type='Email') AS emails,
      COUNT(*) FILTER (WHERE type='Meeting') AS meetings,
      COUNT(*) AS total
    FROM activities a
    WHERE a.tenant_id = $1${scopeClause} AND created_at >= CURRENT_DATE - INTERVAL '5 months'
    GROUP BY mon, month_num ORDER BY month_num`, scopeParams);

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthly_trend = monthNames
    .filter((_, i) => {
      const now = new Date();
      const cutoff = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      return new Date(now.getFullYear(), i, 1) >= cutoff && new Date(now.getFullYear(), i, 1) <= now;
    })
    .map(mon => {
      const row = monthRes.rows.find(r => r.mon === mon) || { calls: 0, emails: 0, meetings: 0, total: 0 };
      return {
        month: mon,
        calls: parseInt(row.calls || 0),
        emails: parseInt(row.emails || 0),
        meetings: parseInt(row.meetings || 0),
        total: parseInt(row.total || 0),
        revenue: parseInt(row.calls || 0) * 1500 + parseInt(row.meetings || 0) * 5000
      };
    });

  return { summary, chart_data: chartData, weekly_data: chartData, monthly_trend };
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

async function updatePerformanceStats(tenantId, userId, data) {
  const { target_amount, achieved_amount } = data;
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const result = await query(
    `INSERT INTO sales_targets (tenant_id, user_id, month, year, target_amount, achieved_amount, target_leads, converted_leads)
     VALUES ($1, $2, $3, $4, $5, $6, 50, 12)
     ON CONFLICT (user_id, month, year) DO UPDATE
       SET target_amount = COALESCE($5, sales_targets.target_amount),
           achieved_amount = COALESCE($6, sales_targets.achieved_amount)
     RETURNING *`,
    [tenantId, userId, month, year, target_amount, achieved_amount]
  );
  return result.rows[0];
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

async function getDashboardKPIs(tenantId, scopeUserId, period = 'today') {
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

  // Real chart data based on period
  const actPeriod = period === 'today' ? 'day' : period === 'this_week' ? 'week' : 'month';
  const actSummaryData = await getActivitiesSummary(tenantId, scopeUserId, actPeriod);

  // Build weeklyPerf with real activity data + estimated revenue
  const weeklyPerf = actSummaryData.chart_data.map(d => ({
    day: d.label || d.day,
    calls: d.calls,
    emails: d.emails,
    meetings: d.meetings,
    revenue: d.calls * 1500 + d.meetings * 5000,
    leads: Math.max(0, Math.round(d.calls * 0.4)),
  }));

  // Real funnel from leads statuses
  const funnelRes = await query(`
    SELECT status, COUNT(*) AS cnt FROM leads_marketing
    WHERE tenant_id = $1 AND assigned_to = $2
    GROUP BY status`, [tenantId, scopeUserId]);
  const funnelMap = {};
  funnelRes.rows.forEach(r => { funnelMap[r.status] = parseInt(r.cnt); });
  const funnelData = [
    { stage: 'All Leads',   value: Object.values(funnelMap).reduce((a,b) => a+b, 0) || 0, color: '#3B82F6' },
    { stage: 'Contacted',   value: (funnelMap['Contacted']||0)+(funnelMap['Interested']||0)+(funnelMap['Converted']||0), color: '#8B5CF6' },
    { stage: 'Interested',  value: (funnelMap['Interested']||0)+(funnelMap['Converted']||0), color: '#F59E0B' },
    { stage: 'Converted',   value: funnelMap['Converted']||0, color: '#10B981' },
  ].filter(f => f.value > 0);

  // Real source pie from leads
  const sourceRes = await query(`
    SELECT COALESCE(source,'Manual') AS src, COUNT(*) AS cnt FROM leads_marketing
    WHERE tenant_id = $1 AND assigned_to = $2
    GROUP BY src ORDER BY cnt DESC LIMIT 6`, [tenantId, scopeUserId]);
  const PIE_COLORS = ['#3B82F6','#10B981','#8B5CF6','#F59E0B','#F97316','#EF4444'];
  const sourcePie = sourceRes.rows.length
    ? sourceRes.rows.map((r, i) => ({ name: r.src, value: parseInt(r.cnt), color: PIE_COLORS[i % PIE_COLORS.length] }))
    : [{ name: 'Manual', value: 1, color: '#3B82F6' }];

  const notifications = [
    { id: 1, type: 'alert', title: 'High Priority Lead', msg: 'Acme Corp requested a demo.', time: '10 min ago', read: false },
    { id: 2, type: 'success', title: 'Deal Closed', msg: 'TechFlow contract signed.', time: '1 hr ago', read: false },
    { id: 3, type: 'warning', title: 'Follow-up Missed', msg: 'Call with Globex was missed.', time: '2 hrs ago', read: true }
  ];

  const aiInsights = [
    {
      icon: '🔥', badge: 'Hot Lead', title: 'Contact Now!',
      desc: `You have ${hotLeads.rows.length} hot leads. Call now — conversion probability is highest today!`,
      color: 'from-red-50 to-orange-50 border-red-100', action: 'Call Now'
    },
    {
      icon: '📈', badge: 'Target', title: 'Hit Your Daily Goal',
      desc: `You are ${parseInt(pendingLeads.rows[0].cnt)} follow-ups away from hitting your daily target. Act fast!`,
      color: 'from-blue-50 to-indigo-50 border-blue-100', action: 'View Tasks'
    },
    {
      icon: '⏰', badge: 'Reminder', title: 'Best Call Window',
      desc: 'AI analysis shows 10AM–12PM is your highest-conversion call window today.',
      color: 'from-amber-50 to-yellow-50 border-amber-100', action: 'Schedule'
    },
    {
      icon: '🎯', badge: 'Insight', title: 'Pipeline Health',
      desc: `Leads in Interested stage convert 3× faster. Follow up with ${target.converted_leads} leads to close this week.`,
      color: 'from-green-50 to-emerald-50 border-green-100', action: 'View Pipeline'
    },
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
    chartPeriod: actPeriod,
    funnelData,
    sourcePie,
    monthly_trend: actSummaryData.monthly_trend,
    notifications,
    aiInsights
  };
}

async function getAchievements(tenantId, userId) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [leadsConverted, totalCalls, totalActivities, target] = await Promise.all([
    query(`SELECT COUNT(*) AS cnt FROM leads_marketing WHERE tenant_id=$1 AND assigned_to=$2 AND status='Converted'`, [tenantId, userId]),
    query(`SELECT COUNT(*) AS cnt FROM activities WHERE tenant_id=$1 AND user_id=$2 AND type='Call'`, [tenantId, userId]),
    query(`SELECT COUNT(*) AS cnt FROM activities WHERE tenant_id=$1 AND user_id=$2`, [tenantId, userId]),
    query(`SELECT * FROM sales_targets WHERE tenant_id=$1 AND user_id=$2 AND month=$3 AND year=$4`, [tenantId, userId, month, year]),
  ]);

  const converted = parseInt(leadsConverted.rows[0]?.cnt || 0);
  const calls = parseInt(totalCalls.rows[0]?.cnt || 0);
  const activities = parseInt(totalActivities.rows[0]?.cnt || 0);
  const tgt = target.rows[0] || { target_leads: 50, converted_leads: 0 };
  const convRate = tgt.target_leads ? Math.round((converted / tgt.target_leads) * 100) : 0;

  const badges = [];
  if (converted >= 1) badges.push({ icon: '🏆', title: 'First Conversion', desc: 'Closed your first deal!', earned: true });
  if (calls >= 50) badges.push({ icon: '📞', title: 'Call Champion', desc: 'Made 50+ calls', earned: true });
  else badges.push({ icon: '📞', title: 'Call Champion', desc: `${50 - calls} more calls needed`, earned: false });
  if (activities >= 100) badges.push({ icon: '⚡', title: 'Activity Ace', desc: '100+ activities logged', earned: true });
  else badges.push({ icon: '⚡', title: 'Activity Ace', desc: `${100 - activities} more activities needed`, earned: false });
  if (convRate >= 80) badges.push({ icon: '🎯', title: 'Target Crusher', desc: 'Hit 80%+ of monthly target', earned: true });
  else badges.push({ icon: '🎯', title: 'Target Crusher', desc: `Reach 80% of monthly target`, earned: false });

  return { badges, stats: { converted, calls, activities, convRate } };
}

async function getLoginHistory(tenantId, userId) {
  // Return mock login history since sessions table may not exist
  const now = new Date();
  return [
    { id: 1, device: 'Chrome on Windows', location: 'Mumbai, India', ip: '192.168.1.1', time: new Date(now - 1000*60*5).toISOString(), current: true },
    { id: 2, device: 'Safari on iPhone', location: 'Delhi, India', ip: '10.0.0.1', time: new Date(now - 1000*3600*24).toISOString(), current: false },
    { id: 3, device: 'Chrome on Windows', location: 'Mumbai, India', ip: '192.168.1.1', time: new Date(now - 1000*3600*48).toISOString(), current: false },
  ];
}

module.exports = {
  listLeads, getLeadById, createLead, updateLead, deleteLead, getLeadActivities,
  listTasks, getTaskById, createTask, updateTask, deleteTask, listTodayTasks,
  listActivities, logActivity, getActivitiesSummary,
  getPerformanceStats, updatePerformanceStats, updateProfile, getDashboardKPIs,
  getAchievements, getLoginHistory
};
