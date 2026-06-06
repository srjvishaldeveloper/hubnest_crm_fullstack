const { query } = require('../../config/database');
const bcrypt = require('bcryptjs');

// ─── HELPERS ──────────────────────────────────────────────────────────────────

async function getOrCreateTeam(tenantId, managerId) {
  const existing = await query(
    `SELECT id FROM teams WHERE tenant_id = $1 AND manager_id = $2 LIMIT 1`,
    [tenantId, managerId]
  );
  if (existing.rows[0]) return existing.rows[0].id;

  // Get manager name for default team name
  const mgr = await query(`SELECT name FROM users WHERE id = $1`, [managerId]);
  const teamName = `${mgr.rows[0]?.name || 'Manager'}'s Team`;

  const created = await query(
    `INSERT INTO teams (tenant_id, manager_id, name) VALUES ($1, $2, $3) RETURNING id`,
    [tenantId, managerId, teamName]
  );
  return created.rows[0].id;
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

async function getManagerDashboard(tenantId, managerId) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // Team members under this manager
  const teamResult = await query(
    `SELECT u.id FROM users u
     JOIN team_members tm ON tm.user_id = u.id
     JOIN teams t ON t.id = tm.team_id
     WHERE t.tenant_id = $1 AND t.manager_id = $2`,
    [tenantId, managerId]
  );
  const memberIds = teamResult.rows.map(r => r.id);

  // KPIs
  const [leadsTotal, leadsConverted, leadsNew, activeDeals] = await Promise.all([
    query(`SELECT COUNT(*) AS cnt FROM leads_marketing WHERE tenant_id = $1`, [tenantId]),
    query(`SELECT COUNT(*) AS cnt FROM leads_marketing WHERE tenant_id = $1 AND status = 'Converted'`, [tenantId]),
    query(`SELECT COUNT(*) AS cnt FROM leads_marketing WHERE tenant_id = $1 AND status = 'New'`, [tenantId]),
    query(`SELECT COUNT(*) AS cnt FROM leads_marketing WHERE tenant_id = $1 AND status IN ('Contacted','Interested','Negotiation')`, [tenantId]),
  ]);

  // Pipeline
  const pipelineResult = await query(
    `SELECT status, COUNT(*) AS cnt FROM leads_marketing WHERE tenant_id = $1 GROUP BY status`,
    [tenantId]
  );
  const pipelineMap = {};
  pipelineResult.rows.forEach(r => { pipelineMap[r.status] = parseInt(r.cnt); });
  const pipeline = ['New', 'Contacted', 'Interested', 'Negotiation', 'Converted', 'Lost'].map(stage => ({
    stage,
    count: pipelineMap[stage] || 0
  }));

  // Team performance
  let teamPerf = [];
  if (memberIds.length > 0) {
    const placeholders = memberIds.map((_, i) => `$${i + 2}`).join(',');
    const perfResult = await query(
      `SELECT 
         u.id, u.name, u.status,
         COUNT(l.id) FILTER (WHERE l.assigned_to = u.id) AS leads_total,
         COUNT(l.id) FILTER (WHERE l.assigned_to = u.id AND l.status = 'Converted') AS leads_converted,
         st.target_amount, st.achieved_amount, st.target_leads, st.converted_leads
       FROM users u
       LEFT JOIN leads_marketing l ON l.assigned_to = u.id AND l.tenant_id = $1
       LEFT JOIN sales_targets st ON st.user_id = u.id AND st.month = ${month} AND st.year = ${year}
       WHERE u.id IN (${placeholders}) AND u.tenant_id = $1
       GROUP BY u.id, u.name, u.status, st.target_amount, st.achieved_amount, st.target_leads, st.converted_leads`,
      [tenantId, ...memberIds]
    );
    teamPerf = perfResult.rows.map(r => ({
      id: r.id,
      name: r.name,
      status: r.status,
      leadsTotal: parseInt(r.leads_total) || 0,
      leadsConverted: parseInt(r.leads_converted) || 0,
      conversionRate: r.leads_total > 0
        ? Math.round((r.leads_converted / r.leads_total) * 100)
        : 0,
      targetAmount: parseFloat(r.target_amount) || 0,
      achievedAmount: parseFloat(r.achieved_amount) || 0,
      targetLeads: parseInt(r.target_leads) || 0,
      convertedLeads: parseInt(r.converted_leads) || 0,
    }));
  }

  // Priority hot leads
  const hotLeads = await query(
    `SELECT l.*, u.name AS assigned_name
     FROM leads_marketing l
     LEFT JOIN users u ON u.id = l.assigned_to
     WHERE l.tenant_id = $1 AND l.priority = 'Hot'
     ORDER BY l.conversion_probability DESC LIMIT 5`,
    [tenantId]
  );

  // Today tasks (all team)
  const todayTasks = await query(
    `SELECT t.*, l.name AS lead_name, u.name AS assigned_name
     FROM tasks t
     LEFT JOIN leads_marketing l ON l.id = t.lead_id
     LEFT JOIN users u ON u.id = t.user_id
     WHERE t.tenant_id = $1 AND t.scheduled_at::date = CURRENT_DATE
     ORDER BY t.scheduled_at ASC LIMIT 10`,
    [tenantId]
  );

  // Activity overview (today)
  const actResult = await query(
    `SELECT type, COUNT(*) AS cnt FROM activities WHERE tenant_id = $1 AND created_at::date = CURRENT_DATE GROUP BY type`,
    [tenantId]
  );
  const actSummary = { Call: 0, Email: 0, Meeting: 0 };
  actResult.rows.forEach(r => { if (actSummary[r.type] !== undefined) actSummary[r.type] = parseInt(r.cnt); });

  // Manager target
  let managerTarget = null;
  const mtResult = await query(
    `SELECT * FROM manager_targets WHERE manager_id = $1 AND month = $2 AND year = $3`,
    [managerId, month, year]
  );
  if (mtResult.rows[0]) {
    managerTarget = mtResult.rows[0];
  } else {
    const inserted = await query(
      `INSERT INTO manager_targets (tenant_id, manager_id, month, year, revenue_target, revenue_achieved, leads_target, leads_converted, team_target)
       VALUES ($1, $2, $3, $4, 500000, 320000, 150, 38, ${memberIds.length})
       ON CONFLICT (manager_id, month, year) DO UPDATE SET team_target = ${memberIds.length}
       RETURNING *`,
      [tenantId, managerId, month, year]
    );
    managerTarget = inserted.rows[0];
  }

  return {
    kpis: {
      totalLeads: parseInt(leadsTotal.rows[0].cnt),
      convertedLeads: parseInt(leadsConverted.rows[0].cnt),
      newLeads: parseInt(leadsNew.rows[0].cnt),
      activeDeals: parseInt(activeDeals.rows[0].cnt),
      conversionRate: leadsTotal.rows[0].cnt > 0
        ? Math.round((leadsConverted.rows[0].cnt / leadsTotal.rows[0].cnt) * 100)
        : 0,
    },
    pipeline,
    teamPerformance: teamPerf,
    hotLeads: hotLeads.rows,
    todayTasks: todayTasks.rows,
    activitySummary: actSummary,
    managerTarget,
    teamSize: memberIds.length,
  };
}

// ─── TEAM ─────────────────────────────────────────────────────────────────────

async function getTeamMembers(tenantId, managerId) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const result = await query(
    `SELECT 
       u.id, u.name, u.email, u.admin_id AS employee_id, u.status, u.created_at,
       COUNT(l.id) FILTER (WHERE l.assigned_to = u.id) AS leads_total,
       COUNT(l.id) FILTER (WHERE l.assigned_to = u.id AND l.status = 'Converted') AS leads_converted,
       COUNT(t.id) FILTER (WHERE t.user_id = u.id AND t.status = 'Pending') AS pending_tasks,
       st.target_amount, st.achieved_amount, st.target_leads, st.converted_leads,
       act_calls.cnt AS calls_today,
       act_emails.cnt AS emails_today
     FROM users u
     JOIN team_members tm ON tm.user_id = u.id
     JOIN teams teams_t ON teams_t.id = tm.team_id
     LEFT JOIN leads_marketing l ON l.assigned_to = u.id AND l.tenant_id = $1
     LEFT JOIN tasks t ON t.user_id = u.id AND t.tenant_id = $1
     LEFT JOIN sales_targets st ON st.user_id = u.id AND st.month = $3 AND st.year = $4
     LEFT JOIN LATERAL (
       SELECT COUNT(*) AS cnt FROM activities a WHERE a.user_id = u.id AND a.type = 'Call' AND a.created_at::date = CURRENT_DATE
     ) act_calls ON TRUE
     LEFT JOIN LATERAL (
       SELECT COUNT(*) AS cnt FROM activities a WHERE a.user_id = u.id AND a.type = 'Email' AND a.created_at::date = CURRENT_DATE
     ) act_emails ON TRUE
     WHERE teams_t.tenant_id = $1 AND teams_t.manager_id = $2
     GROUP BY u.id, u.name, u.email, u.admin_id, u.status, u.created_at,
              st.target_amount, st.achieved_amount, st.target_leads, st.converted_leads,
              act_calls.cnt, act_emails.cnt
     ORDER BY u.name`,
    [tenantId, managerId, month, year]
  );

  return result.rows.map(r => ({
    id: r.id,
    name: r.name,
    email: r.email,
    employeeId: r.employee_id,
    status: r.status,
    joinedDate: r.created_at,
    leadsTotal: parseInt(r.leads_total) || 0,
    leadsConverted: parseInt(r.leads_converted) || 0,
    conversionRate: r.leads_total > 0
      ? Math.round((r.leads_converted / r.leads_total) * 100)
      : 0,
    pendingTasks: parseInt(r.pending_tasks) || 0,
    targetAmount: parseFloat(r.target_amount) || 0,
    achievedAmount: parseFloat(r.achieved_amount) || 0,
    targetLeads: parseInt(r.target_leads) || 0,
    convertedLeads: parseInt(r.converted_leads) || 0,
    callsToday: parseInt(r.calls_today) || 0,
    emailsToday: parseInt(r.emails_today) || 0,
  }));
}

async function getMemberDetail(tenantId, managerId, memberId) {
  // Verify this member is in manager's team
  const check = await query(
    `SELECT u.id FROM users u
     JOIN team_members tm ON tm.user_id = u.id
     JOIN teams t ON t.id = tm.team_id
     WHERE t.manager_id = $1 AND u.id = $2 AND t.tenant_id = $3`,
    [managerId, memberId, tenantId]
  );
  if (!check.rows[0]) return null;

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [user, leads, tasks, activities, target] = await Promise.all([
    query(`SELECT id, name, email, admin_id, status, created_at FROM users WHERE id = $1`, [memberId]),
    query(`SELECT * FROM leads_marketing WHERE assigned_to = $1 AND tenant_id = $2 ORDER BY created_at DESC`, [memberId, tenantId]),
    query(`SELECT * FROM tasks WHERE user_id = $1 AND tenant_id = $2 ORDER BY scheduled_at DESC`, [memberId, tenantId]),
    query(`SELECT * FROM activities WHERE user_id = $1 AND tenant_id = $2 ORDER BY created_at DESC LIMIT 20`, [memberId, tenantId]),
    query(`SELECT * FROM sales_targets WHERE user_id = $1 AND month = $2 AND year = $3`, [memberId, month, year]),
  ]);

  const u = user.rows[0];
  const tgt = target.rows[0];
  const actSummary = { Call: 0, Email: 0, Meeting: 0 };
  activities.rows.forEach(a => { if (actSummary[a.type] !== undefined) actSummary[a.type]++; });

  return {
    ...u,
    employeeId: u.admin_id,
    leads: leads.rows,
    leadsTotal: leads.rows.length,
    leadsConverted: leads.rows.filter(l => l.status === 'Converted').length,
    leadsLost: leads.rows.filter(l => l.status === 'Lost').length,
    tasks: tasks.rows,
    tasksTotal: tasks.rows.length,
    tasksPending: tasks.rows.filter(t => t.status === 'Pending').length,
    tasksDone: tasks.rows.filter(t => t.status === 'Done').length,
    recentActivities: activities.rows,
    activitySummary: actSummary,
    target: tgt || null,
  };
}

async function addExecutive(tenantId, managerId, data) {
  const { name, email, employeeId, password, mobile, sendCreds } = data;

  // Check duplicates
  const dup = await query(
    `SELECT id FROM users WHERE (email = $1 OR admin_id = $2) AND tenant_id = $3`,
    [email, employeeId, tenantId]
  );
  if (dup.rows.length > 0) throw Object.assign(new Error('User with this email or Employee ID already exists'), { statusCode: 400 });

  // Get or create Sales Executive role
  let roleResult = await query(`SELECT id FROM roles WHERE name = 'Sales Executive'`);
  let roleId;
  if (roleResult.rows.length === 0) {
    const execPerms = {
      leads: { create: true, read: true, update: true, delete: false },
      tasks: { create: true, read: true, update: true, delete: true },
      activities: { create: true, read: true, update: true, delete: false },
    };
    const ins = await query(
      `INSERT INTO roles (name, permissions) VALUES ('Sales Executive', $1) RETURNING id`,
      [JSON.stringify(execPerms)]
    );
    roleId = ins.rows[0].id;
  } else {
    roleId = roleResult.rows[0].id;
  }

  const pwd = password || 'HubNest@123!';
  const passwordHash = await bcrypt.hash(pwd, 12);

  // Create user
  const userResult = await query(
    `INSERT INTO users (tenant_id, role_id, name, email, admin_id, password_hash, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'Active') RETURNING id`,
    [tenantId, roleId, name, email, employeeId, passwordHash]
  );
  const userId = userResult.rows[0].id;

  // Add to manager's team
  const teamId = await getOrCreateTeam(tenantId, managerId);
  await query(
    `INSERT INTO team_members (team_id, user_id, tenant_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
    [teamId, userId, tenantId]
  );

  return { userId, employeeId, name, email, teamId };
}

async function updateExecutiveTarget(tenantId, managerId, memberId, data) {
  const { targetAmount, targetLeads } = data;
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const result = await query(
    `INSERT INTO sales_targets (tenant_id, user_id, month, year, target_amount, target_leads)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, month, year) DO UPDATE
       SET target_amount = $5, target_leads = $6
     RETURNING *`,
    [tenantId, memberId, month, year, targetAmount || 0, targetLeads || 0]
  );
  return result.rows[0];
}

// ─── LEADS (MANAGER LEVEL — NO SCOPE) ────────────────────────────────────────

async function listTeamLeads(tenantId, { status, priority, search, assignedTo, page = 1, limit = 20 } = {}) {
  let sql = `SELECT l.*, u.name AS assigned_name, ab.name AS assigned_by_name
             FROM leads_marketing l
             LEFT JOIN users u ON u.id = l.assigned_to
             LEFT JOIN users ab ON ab.id = l.assigned_by
             WHERE l.tenant_id = $1`;
  const params = [tenantId];

  if (status) { params.push(status); sql += ` AND l.status = $${params.length}`; }
  if (priority) { params.push(priority); sql += ` AND l.priority = $${params.length}`; }
  if (assignedTo) { params.push(assignedTo); sql += ` AND l.assigned_to = $${params.length}`; }
  if (search) {
    params.push(`%${search}%`);
    sql += ` AND (l.name ILIKE $${params.length} OR l.email ILIKE $${params.length} OR l.company ILIKE $${params.length})`;
  }

  sql += ` ORDER BY l.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, (page - 1) * limit);

  const result = await query(sql, params);

  // Total count
  let countSql = `SELECT COUNT(*) AS cnt FROM leads_marketing l WHERE l.tenant_id = $1`;
  const countParams = [tenantId];
  if (status) { countParams.push(status); countSql += ` AND l.status = $${countParams.length}`; }
  if (priority) { countParams.push(priority); countSql += ` AND l.priority = $${countParams.length}`; }
  if (assignedTo) { countParams.push(assignedTo); countSql += ` AND l.assigned_to = $${countParams.length}`; }
  if (search) {
    countParams.push(`%${search}%`);
    countSql += ` AND (l.name ILIKE $${countParams.length} OR l.email ILIKE $${countParams.length} OR l.company ILIKE $${countParams.length})`;
  }
  const countResult = await query(countSql, countParams);

  return { leads: result.rows, total: parseInt(countResult.rows[0].cnt), page, limit };
}

async function getTeamLeadById(tenantId, leadId) {
  const result = await query(
    `SELECT l.*, u.name AS assigned_name, ab.name AS assigned_by_name
     FROM leads_marketing l
     LEFT JOIN users u ON u.id = l.assigned_to
     LEFT JOIN users ab ON ab.id = l.assigned_by
     WHERE l.id = $1 AND l.tenant_id = $2`,
    [leadId, tenantId]
  );
  if (!result.rows[0]) return null;

  const activities = await query(
    `SELECT a.*, u.name AS user_name FROM activities a LEFT JOIN users u ON u.id = a.user_id
     WHERE a.lead_id = $1 ORDER BY a.created_at DESC`,
    [leadId]
  );

  const assignments = await query(
    `SELECT la.*, u.name AS to_name, ab.name AS by_name
     FROM lead_assignments la
     LEFT JOIN users u ON u.id = la.assigned_to
     LEFT JOIN users ab ON ab.id = la.assigned_by
     WHERE la.lead_id = $1 ORDER BY la.assigned_at DESC`,
    [leadId]
  );

  return {
    ...result.rows[0],
    activities: activities.rows,
    assignmentHistory: assignments.rows,
  };
}

async function assignLead(tenantId, managerId, leadId, executiveId, notes) {
  const lead = await query(`SELECT assigned_to FROM leads_marketing WHERE id = $1 AND tenant_id = $2`, [leadId, tenantId]);
  if (!lead.rows[0]) throw Object.assign(new Error('Lead not found'), { statusCode: 404 });
  const prevAssigned = lead.rows[0].assigned_to;

  await query(
    `UPDATE leads_marketing SET assigned_to = $1, assigned_by = $2, updated_at = NOW() WHERE id = $3`,
    [executiveId, managerId, leadId]
  );

  await query(
    `INSERT INTO lead_assignments (tenant_id, lead_id, assigned_to, assigned_by, assigned_from, notes)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [tenantId, leadId, executiveId, managerId, prevAssigned, notes || null]
  );

  return { leadId, assignedTo: executiveId, assignedBy: managerId };
}

async function bulkAssignLeads(tenantId, managerId, leadIds, executiveId) {
  const results = [];
  for (const leadId of leadIds) {
    try {
      const r = await assignLead(tenantId, managerId, leadId, executiveId, 'Bulk assignment');
      results.push({ leadId, success: true, ...r });
    } catch (e) {
      results.push({ leadId, success: false, error: e.message });
    }
  }
  return results;
}

async function updateTeamLead(tenantId, leadId, data) {
  const fields = ['status', 'priority', 'company', 'notes', 'next_followup', 'conversion_probability', 'escalated'];
  const updates = [];
  const params = [];

  fields.forEach(f => {
    if (data[f] !== undefined) {
      params.push(data[f]);
      updates.push(`${f} = $${params.length}`);
    }
  });

  if (!updates.length) return null;

  params.push(leadId, tenantId);
  const sql = `UPDATE leads_marketing SET ${updates.join(', ')}, updated_at = NOW()
               WHERE id = $${params.length - 1} AND tenant_id = $${params.length} RETURNING *`;

  const result = await query(sql, params);
  return result.rows[0] || null;
}

async function createTeamLead(tenantId, managerId, data) {
  const { name, phone, email, source, platform, priority, company, notes, next_followup, conversion_probability, assigned_to } = data;
  const result = await query(
    `INSERT INTO leads_marketing (
      tenant_id, name, phone, email, source, platform, status, quality_score,
      assigned_to, assigned_by, priority, company, notes, next_followup, conversion_probability
    ) VALUES ($1, $2, $3, $4, $5, $6, 'New', 75, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *`,
    [
      tenantId, name, phone || null, email || null, source || 'Manual', platform || 'Direct',
      assigned_to || null, managerId, priority || 'Warm', company || null,
      notes || null, next_followup || null, conversion_probability || 50,
    ]
  );

  if (assigned_to) {
    await query(
      `INSERT INTO lead_assignments (tenant_id, lead_id, assigned_to, assigned_by)
       VALUES ($1, $2, $3, $4)`,
      [tenantId, result.rows[0].id, assigned_to, managerId]
    );
  }

  return result.rows[0];
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────

async function getReportsOverview(tenantId, managerId) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [totalLeads, converted, lost, revenue, activities] = await Promise.all([
    query(`SELECT COUNT(*) AS cnt FROM leads_marketing WHERE tenant_id = $1`, [tenantId]),
    query(`SELECT COUNT(*) AS cnt FROM leads_marketing WHERE tenant_id = $1 AND status = 'Converted'`, [tenantId]),
    query(`SELECT COUNT(*) AS cnt FROM leads_marketing WHERE tenant_id = $1 AND status = 'Lost'`, [tenantId]),
    query(`SELECT COALESCE(SUM(achieved_amount), 0) AS total FROM manager_targets WHERE manager_id = $1 AND year = $2`, [managerId, year]),
    query(`SELECT type, COUNT(*) AS cnt FROM activities WHERE tenant_id = $1 GROUP BY type`, [tenantId]),
  ]);

  const actMap = { Call: 0, Email: 0, Meeting: 0 };
  activities.rows.forEach(r => { if (actMap[r.type] !== undefined) actMap[r.type] = parseInt(r.cnt); });

  const total = parseInt(totalLeads.rows[0].cnt);
  const conv = parseInt(converted.rows[0].cnt);

  // Pipeline breakdown
  const pipelineResult = await query(
    `SELECT status, COUNT(*) AS cnt FROM leads_marketing WHERE tenant_id = $1 GROUP BY status`,
    [tenantId]
  );
  const pipeline = {};
  pipelineResult.rows.forEach(r => { pipeline[r.status] = parseInt(r.cnt); });

  // Monthly lead creation trend (last 6 months)
  const trendResult = await query(
    `SELECT to_char(created_at, 'Mon') AS month_label, EXTRACT(MONTH FROM created_at) AS mon,
            COUNT(*) AS leads, COUNT(*) FILTER (WHERE status = 'Converted') AS converted
     FROM leads_marketing
     WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '6 months'
     GROUP BY month_label, mon ORDER BY mon`,
    [tenantId]
  );

  // Team performance summary
  const teamResult = await query(
    `SELECT u.name,
            COUNT(l.id) AS leads,
            COUNT(l.id) FILTER (WHERE l.status = 'Converted') AS converted,
            st.target_amount, st.achieved_amount
     FROM users u
     JOIN team_members tm ON tm.user_id = u.id
     JOIN teams t ON t.id = tm.team_id
     LEFT JOIN leads_marketing l ON l.assigned_to = u.id AND l.tenant_id = $1
     LEFT JOIN sales_targets st ON st.user_id = u.id AND st.month = $2 AND st.year = $3
     WHERE t.manager_id = $4 AND t.tenant_id = $1
     GROUP BY u.name, st.target_amount, st.achieved_amount
     ORDER BY converted DESC`,
    [tenantId, month, year, managerId]
  );

  return {
    kpis: {
      totalLeads: total,
      convertedLeads: conv,
      lostLeads: parseInt(lost.rows[0].cnt),
      conversionRate: total > 0 ? Math.round((conv / total) * 100) : 0,
      revenueAchieved: parseFloat(revenue.rows[0].total),
    },
    pipeline,
    trendData: trendResult.rows,
    activitySummary: actMap,
    teamPerformance: teamResult.rows.map(r => ({
      name: r.name,
      leads: parseInt(r.leads),
      converted: parseInt(r.converted),
      conversionRate: r.leads > 0 ? Math.round((r.converted / r.leads) * 100) : 0,
      targetAmount: parseFloat(r.target_amount) || 0,
      achievedAmount: parseFloat(r.achieved_amount) || 0,
    })),
  };
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────

async function getManagerProfile(tenantId, managerId) {
  const user = await query(
    `SELECT u.id, u.name, u.email, u.admin_id, u.status, u.created_at,
            r.name AS role_name
     FROM users u JOIN roles r ON r.id = u.role_id
     WHERE u.id = $1 AND u.tenant_id = $2`,
    [managerId, tenantId]
  );
  if (!user.rows[0]) return null;

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [teamInfo, target, actSummary] = await Promise.all([
    query(
      `SELECT COUNT(tm.id) AS total,
              COUNT(tm.id) FILTER (WHERE u.status = 'Active') AS active
       FROM team_members tm
       JOIN teams t ON t.id = tm.team_id
       JOIN users u ON u.id = tm.user_id
       WHERE t.manager_id = $1 AND t.tenant_id = $2`,
      [managerId, tenantId]
    ),
    query(
      `SELECT * FROM manager_targets WHERE manager_id = $1 AND month = $2 AND year = $3`,
      [managerId, month, year]
    ),
    query(
      `SELECT type, COUNT(*) AS cnt FROM activities WHERE tenant_id = $1 GROUP BY type`,
      [tenantId]
    ),
  ]);

  const actMap = { Call: 0, Email: 0, Meeting: 0 };
  actSummary.rows.forEach(r => { if (actMap[r.type] !== undefined) actMap[r.type] = parseInt(r.cnt); });

  return {
    ...user.rows[0],
    employeeId: user.rows[0].admin_id,
    teamTotal: parseInt(teamInfo.rows[0]?.total) || 0,
    teamActive: parseInt(teamInfo.rows[0]?.active) || 0,
    target: target.rows[0] || null,
    activitySummary: actMap,
  };
}

async function updateManagerProfile(tenantId, managerId, { name, email }) {
  const result = await query(
    `UPDATE users SET name = $1, email = $2, updated_at = NOW()
     WHERE id = $3 AND tenant_id = $4 RETURNING id, name, email`,
    [name, email, managerId, tenantId]
  );
  return result.rows[0];
}

async function getManagerTargets(tenantId, managerId) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  let result = await query(
    `SELECT * FROM manager_targets WHERE manager_id = $1 AND month = $2 AND year = $3`,
    [managerId, month, year]
  );

  if (!result.rows[0]) {
    const ins = await query(
      `INSERT INTO manager_targets (tenant_id, manager_id, month, year) VALUES ($1, $2, $3, $4) RETURNING *`,
      [tenantId, managerId, month, year]
    );
    result = { rows: [ins.rows[0]] };
  }

  return result.rows[0];
}

async function updateManagerTargets(tenantId, managerId, data) {
  const { revenueTarget, leadsTarget, revenueAchieved, leadsConverted } = data;
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const result = await query(
    `INSERT INTO manager_targets (tenant_id, manager_id, month, year, revenue_target, leads_target, revenue_achieved, leads_converted)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (manager_id, month, year) DO UPDATE
       SET revenue_target = COALESCE($5, manager_targets.revenue_target),
           leads_target = COALESCE($6, manager_targets.leads_target),
           revenue_achieved = COALESCE($7, manager_targets.revenue_achieved),
           leads_converted = COALESCE($8, manager_targets.leads_converted)
     RETURNING *`,
    [tenantId, managerId, month, year, revenueTarget, leadsTarget, revenueAchieved, leadsConverted]
  );
  return result.rows[0];
}

// ─── TASKS (TEAM LEVEL) ───────────────────────────────────────────────────────

async function listTeamTasks(tenantId, { status, priority, userId } = {}) {
  let sql = `SELECT t.*, l.name AS lead_name, u.name AS assigned_name
             FROM tasks t
             LEFT JOIN leads_marketing l ON l.id = t.lead_id
             LEFT JOIN users u ON u.id = t.user_id
             WHERE t.tenant_id = $1`;
  const params = [tenantId];

  if (status) { params.push(status); sql += ` AND t.status = $${params.length}`; }
  if (priority) { params.push(priority); sql += ` AND t.priority = $${params.length}`; }
  if (userId) { params.push(userId); sql += ` AND t.user_id = $${params.length}`; }

  sql += ` ORDER BY t.scheduled_at ASC`;
  const result = await query(sql, params);
  return result.rows;
}

async function createTeamTask(tenantId, managerId, data) {
  const { user_id, lead_id, type, title, scheduled_at, priority, notes } = data;
  const result = await query(
    `INSERT INTO tasks (tenant_id, user_id, lead_id, type, title, scheduled_at, priority, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [tenantId, user_id || managerId, lead_id || null, type, title, scheduled_at || null, priority || 'Medium', notes || null]
  );
  return result.rows[0];
}

async function updateTeamTask(tenantId, taskId, data) {
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

  params.push(taskId, tenantId);
  const sql = `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${params.length - 1} AND tenant_id = $${params.length} RETURNING *`;
  const result = await query(sql, params);
  return result.rows[0] || null;
}

async function deleteTeamTask(tenantId, taskId) {
  const result = await query(
    `DELETE FROM tasks WHERE id = $1 AND tenant_id = $2 RETURNING id`,
    [taskId, tenantId]
  );
  return !!result.rows[0];
}

module.exports = {
  getManagerDashboard,
  getTeamMembers, getMemberDetail, addExecutive, updateExecutiveTarget,
  listTeamLeads, getTeamLeadById, assignLead, bulkAssignLeads, updateTeamLead, createTeamLead,
  getReportsOverview,
  getManagerProfile, updateManagerProfile, getManagerTargets, updateManagerTargets,
  listTeamTasks, createTeamTask, updateTeamTask, deleteTeamTask,
};
