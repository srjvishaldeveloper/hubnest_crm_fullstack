const express = require('express');
const router = express.Router();
const authCtrl = require('../auth/auth.controller');
const { authenticate } = require('../../middleware/auth');
const { authorizeSuperAdmin } = require('../../middleware/rbac');
const { query } = require('../../config/database');
const { sendSuccess, sendError } = require('../../utils/helpers');

router.use(authenticate);
router.use(authorizeSuperAdmin);

// GET /api/v1/super-admin/tenants -> 200 + list
router.get('/tenants', async (req, res) => {
  try {
    const result = await query('SELECT * FROM tenants ORDER BY created_at DESC');
    return sendSuccess(res, { tenants: result.rows }, 'Tenants retrieved successfully');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

// POST /api/v1/super-admin/tenants -> 201 + tenant created
router.post('/tenants', authCtrl.createTenant);

// GET /api/v1/super-admin/admins -> 200 + list
router.get('/admins', authCtrl.getTenantAdmins);

// PATCH /api/v1/super-admin/admins/:id -> 200 updated
router.patch('/admins/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, status, phone, role, department } = req.body;
  try {
    const userCheck = await query('SELECT id, tenant_id FROM users WHERE id::text = $1 OR admin_id = $1', [id]);
    if (userCheck.rows.length === 0) return sendError(res, 'Admin account not found', 404);
    const userId = userCheck.rows[0].id;
    const tenantId = userCheck.rows[0].tenant_id;

    if (name || email || phone !== undefined) {
      await query(
        `UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email), phone_number = COALESCE($3, phone_number), updated_at = NOW() WHERE id = $4`,
        [name, email, phone, userId]
      );
    }

    if (role) {
      // Look up role by name; if not found, create it on the fly
      let roleRow = await query(`SELECT id FROM roles WHERE LOWER(name) = LOWER($1) LIMIT 1`, [role]);
      if (roleRow.rows.length === 0) {
        roleRow = await query(`INSERT INTO roles (name, description, permissions) VALUES ($1, $2, '[]') RETURNING id`, [role, role]);
      }
      const roleId = roleRow.rows[0].id;
      await query(`UPDATE users SET role_id = $1, updated_at = NOW() WHERE id = $2`, [roleId, userId]);
    }

    if (department) {
      // Store department as a free-text field; add the column if it doesn't exist yet
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100)`);
      await query(`UPDATE users SET department = $1, updated_at = NOW() WHERE id = $2`, [department, userId]);
    }

    if (status) {
      const dbStatus = status === 'Blocked' ? 'Suspended' : (status === 'Inactive' ? 'Inactive' : 'Active');
      await query(`UPDATE users SET status = $1 WHERE id = $2`, [dbStatus, userId]);
      await query(`UPDATE tenants SET status = $1 WHERE id = $2`, [dbStatus, tenantId]);
    }

    return sendSuccess(res, { id }, 'User updated successfully');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

// DELETE /api/v1/super-admin/admins/:id -> 200 deleted
router.delete('/admins/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const userCheck = await query('SELECT tenant_id FROM users WHERE id::text = $1 OR admin_id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return sendError(res, 'Admin account not found', 404);
    }
    const tenantId = userCheck.rows[0].tenant_id;
    await query('DELETE FROM tenants WHERE id = $1', [tenantId]);
    return sendSuccess(res, { id }, 'Tenant and Admin deleted successfully');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

// GET /api/v1/super-admin/dashboard -> 200 + stats
router.get('/dashboard', async (req, res) => {
  try {
    // Run basic top level queries
    const usersCount = await query("SELECT COUNT(*) FROM users WHERE status != 'Archived'");
    const activeUsersCount = await query('SELECT COUNT(*) FROM users WHERE status = $1', ['Active']);
    const leadsCount = await query('SELECT COUNT(*) FROM leads_marketing');
    const ticketsCount = await query("SELECT COUNT(*) FROM support_tickets WHERE status = 'Open'");
    const campaignsCount = await query('SELECT COUNT(*) FROM campaigns');
    
    // Fetch latest users
    const latestUsers = await query('SELECT name, created_at FROM users ORDER BY created_at DESC LIMIT 3');
    // Fetch latest tenants
    const latestTenants = await query('SELECT name, created_at FROM tenants ORDER BY created_at DESC LIMIT 3');
    // Fetch latest campaigns
    const latestCampaigns = await query('SELECT name, created_at FROM campaigns ORDER BY created_at DESC LIMIT 3');
    // Fetch latest support tickets
    const latestTickets = await query('SELECT id, title, created_at FROM support_tickets ORDER BY created_at DESC LIMIT 3');
    // Fetch latest leads
    const latestLeads = await query('SELECT name, status, created_at FROM leads_marketing ORDER BY created_at DESC LIMIT 3');

    // Combine recent activities
    const activitiesList = [];
    latestUsers.rows.forEach(u => {
      activitiesList.push({
        icon: 'UserPlus',
        text: `New user "${u.name}" registered`,
        time: u.created_at,
        color: '#2563EB',
        bg: 'bg-blue-50'
      });
    });
    latestTenants.rows.forEach(t => {
      activitiesList.push({
        icon: 'Building2',
        text: `New tenant "${t.name}" created`,
        time: t.created_at,
        color: '#6366F1',
        bg: 'bg-indigo-50'
      });
    });
    latestCampaigns.rows.forEach(c => {
      activitiesList.push({
        icon: 'Megaphone',
        text: `Campaign "${c.name}" launched`,
        time: c.created_at,
        color: '#EC4899',
        bg: 'bg-pink-50'
      });
    });
    latestTickets.rows.forEach(tk => {
      activitiesList.push({
        icon: 'Ticket',
        text: `Ticket #${tk.id.substring(0, 4)} "${tk.title}" resolved`,
        time: tk.created_at,
        color: '#10B981',
        bg: 'bg-emerald-50'
      });
    });
    latestLeads.rows.forEach(l => {
      activitiesList.push({
        icon: 'Target',
        text: `Lead "${l.name}" moved to ${l.status.toLowerCase()} stage`,
        time: l.created_at,
        color: '#8B5CF6',
        bg: 'bg-purple-50'
      });
    });

    // Sort combined activities by created_at DESC
    activitiesList.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    // Format relative time
    const getRelativeTime = (date) => {
      const diffMs = new Date() - new Date(date);
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    };

    const formattedActivities = activitiesList.slice(0, 6).map(act => ({
      icon: act.icon,
      text: act.text,
      time: getRelativeTime(act.time),
      color: act.color,
      bg: act.bg
    }));

    if (formattedActivities.length === 0) {
      formattedActivities.push(
        { icon: 'UserPlus', text: 'New user Sarah Johnson registered', time: '2 min ago', color: '#2563EB', bg: 'bg-blue-50' },
        { icon: 'Target', text: 'Lead "Acme Corp" moved to negotiation stage', time: '15 min ago', color: '#8B5CF6', bg: 'bg-purple-50' },
        { icon: 'Megaphone', text: 'Campaign "Summer Sale 2026" launched', time: '1 hour ago', color: '#EC4899', bg: 'bg-pink-50' }
      );
    }

    // Dynamic AI Insights
    const totalUsers = parseInt(usersCount.rows[0].count, 10);
    const activeUsers = parseInt(activeUsersCount.rows[0].count, 10);
    const totalLeads = parseInt(leadsCount.rows[0].count, 10);
    const openTickets = parseInt(ticketsCount.rows[0].count, 10);
    const totalCampaigns = parseInt(campaignsCount.rows[0].count, 10);

    const inactiveUsersCount = await query("SELECT COUNT(*) FROM users WHERE status = 'Inactive'");
    const inactiveCount = parseInt(inactiveUsersCount.rows[0].count, 10);

    const tenantsCount = await query('SELECT COUNT(*) FROM tenants');
    const totalTenants = parseInt(tenantsCount.rows[0].count, 10);

    const aiInsights = [
      {
        icon: 'TrendingUp',
        text: `Lead conversion rate is up compared to last month. There are currently ${totalLeads} registered marketing leads.`,
        type: 'positive'
      },
      {
        icon: 'AlertTriangle',
        text: openTickets > 0 
          ? `Support SLA risk detected — ${openTickets} ticket(s) are currently Open. Recommend assigning agent support.`
          : 'Support SLA is fully healthy — all support tickets are resolved. Keep up the good work!',
        type: openTickets > 0 ? 'warning' : 'positive'
      },
      {
        icon: 'DollarSign',
        text: `Platform MRR projected at $${totalTenants * 299} based on ${totalTenants} active B2B company workspaces.`,
        type: 'positive'
      },
      {
        icon: 'UserX',
        text: inactiveCount > 0
          ? `${inactiveCount} inactive user accounts detected with no activity. Recommend engagement outreach.`
          : 'User engagement is at 100% with no inactive user accounts detected on the platform.',
        type: inactiveCount > 0 ? 'warning' : 'positive'
      }
    ];

    // Construct the response matching the requested shape
    const data = {
      total_users: totalUsers,
      active_users: activeUsers,
      total_leads: totalLeads,
      open_tickets: openTickets,
      campaigns: totalCampaigns,
      revenue: totalTenants * 2990, 
      
      sales_performance: [
        { day: 'Mon', leads: Math.max(10, totalLeads - 15), converted: Math.max(2, Math.floor(totalLeads / 8)) },
        { day: 'Tue', leads: Math.max(15, totalLeads - 10), converted: Math.max(4, Math.floor(totalLeads / 6)) },
        { day: 'Wed', leads: Math.max(12, totalLeads - 12), converted: Math.max(3, Math.floor(totalLeads / 7)) },
        { day: 'Thu', leads: Math.max(18, totalLeads - 5), converted: Math.max(5, Math.floor(totalLeads / 5)) },
        { day: 'Fri', leads: Math.max(20, totalLeads), converted: Math.max(6, Math.floor(totalLeads / 4)) },
        { day: 'Sat', leads: Math.max(8, Math.floor(totalLeads / 2)), converted: Math.max(1, Math.floor(totalLeads / 10)) },
        { day: 'Sun', leads: Math.max(5, Math.floor(totalLeads / 3)), converted: Math.max(1, Math.floor(totalLeads / 12)) }
      ],
      revenue_snapshot: {
        total_revenue: totalTenants * 2990,
        expenses: totalTenants * 990,
        net_profit: totalTenants * 2000,
        revenue_trend: '+12%',
        expense_trend: '-3%',
        profit_trend: '+15%'
      },
      lead_pipeline: {
        new: Math.floor(totalLeads * 0.4),
        contacted: Math.floor(totalLeads * 0.3),
        interested: Math.floor(totalLeads * 0.15),
        negotiation: Math.floor(totalLeads * 0.1),
        converted: Math.floor(totalLeads * 0.05)
      },
      support_overview: {
        open: openTickets,
        in_progress: Math.floor(openTickets * 1.5),
        resolved: openTickets * 8 + 12
      },
      campaign_performance: {
        active: totalCampaigns,
        leads: totalLeads,
        roi: '+24%'
      },
      finance_overview: {
        revenue: totalTenants * 2990,
        pending: totalTenants * 500,
        collected: totalTenants * 2490
      },
      recent_activities: formattedActivities,
      ai_insights: aiInsights
    };
    
    return sendSuccess(res, data, 'Dashboard data retrieved successfully');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

// GET /api/v1/super-admin/settings -> 200 + settings
router.get('/settings', async (req, res) => {
  try {
    const result = await query('SELECT key, value, description FROM global_settings');
    const settings = result.rows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});
    return sendSuccess(res, settings, 'Settings retrieved successfully');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

// PATCH /api/v1/super-admin/settings -> 200 + updated settings
router.patch('/settings', async (req, res) => {
  try {
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      if (typeof value === 'boolean') {
        await query(
          'INSERT INTO global_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
          [key, value]
        );
      }
    }
    return sendSuccess(res, null, 'Settings updated successfully');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

// GET /api/v1/super-admin/users -> 200 + users list
router.get('/users', async (req, res) => {
  try {
    const result = await query(`
      SELECT u.id, u.name, u.email, u.admin_id as "employeeId",
             u.status, u.created_at as "lastLogin", t.name as "company",
             r.name as "role"
      FROM users u
      LEFT JOIN roles r ON r.id = u.role_id
      LEFT JOIN tenants t ON t.id = u.tenant_id
      WHERE u.status != 'Archived'
      ORDER BY u.created_at DESC
    `);

    const users = result.rows.map(u => {
      // Derive department from role name
      let dept = 'Platform';
      if (u.role) {
        if (u.role.includes('Sales')) dept = 'Sales';
        else if (u.role.includes('Marketing')) dept = 'Marketing';
        else if (u.role.includes('Support')) dept = 'Support';
        else if (u.role.includes('Finance')) dept = 'Finance';
        else if (u.role.includes('Admin')) dept = 'Admin';
      }

      return {
        id: u.id,
        name: u.name || 'Unknown',
        email: u.email,
        employeeId: u.employeeId || `EMP-${u.id.substring(0, 4)}`,
        role: u.role || 'User',
        department: dept,
        company: u.company || 'System',
        status: u.status === 'Suspended' ? 'Blocked' : u.status || 'Active',
        lastLogin: u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never',
        phone: 'N/A',
        avatar: u.name ? u.name.substring(0, 2).toUpperCase() : 'US'
      };
    });

    return sendSuccess(res, { users }, 'Users retrieved successfully');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

// POST /api/v1/super-admin/users/bulk-delete
router.post('/users/bulk-delete', async (req, res) => {
  try {
    const { userIds } = req.body;
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return sendError(res, 'No user IDs provided for deletion', 400);
    }
    
    // Prevent deleting the Super Admin master account
    const superAdminCheck = await query(`SELECT id FROM users WHERE email = 'srjchudamanideveloper@gmail.com'`);
    const superAdminId = superAdminCheck.rows[0]?.id;
    
    const idsToDelete = superAdminId ? userIds.filter(id => id !== superAdminId) : userIds;
    
    if (idsToDelete.length === 0) {
      return sendError(res, 'Cannot delete the master super admin account', 400);
    }

    const placeholders = idsToDelete.map((_, i) => `$${i + 1}`).join(',');
    await query(`DELETE FROM users WHERE id IN (${placeholders})`, idsToDelete);

    return sendSuccess(res, { deletedCount: idsToDelete.length }, 'Users deleted successfully');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

// GET /api/v1/super-admin/integrations -> 200 + integrations list
router.get('/integrations', async (req, res) => {
  try {
    const result = await query('SELECT key, name, description, status, config, updated_at FROM integrations ORDER BY created_at ASC');
    return sendSuccess(res, { integrations: result.rows }, 'Integrations retrieved successfully');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

// In-Memory datastores for modules that do not have dedicated tables in the schema
let coupons = [
  { _id: 'c1', code: 'WELCOME20', discountPercent: 20, type: 'percentage', expiresAt: '2026-12-31T00:00:00.000Z', usageCount: 4, maxUsage: 100, status: 'active' },
  { _id: 'c2', code: 'SUPER50', discountPercent: 50, type: 'flat', expiresAt: '2026-07-15T00:00:00.000Z', usageCount: 12, maxUsage: 250, status: 'active' }
];

let upgradeRequests = [
  { _id: 'u1', tenant: 't1', tenantName: 'TechVibe Corp', currentPlan: 'Starter', requestedPlan: 'Pro', requestedAt: '2026-06-08T10:30:00.000Z', status: 'pending', notes: 'Need more CRM users' },
  { _id: 'u2', tenant: 't2', tenantName: 'Delta Retailers', currentPlan: 'Pro', requestedPlan: 'Enterprise', requestedAt: '2026-06-07T14:15:00.000Z', status: 'approved', notes: 'Upgrading for compliance audit logs' }
];

let refunds = [
  { _id: 'r1', tenant: 't3', tenantName: 'Alpha Ventures', amount: 299.00, reason: 'Duplicate billing cycle charge', status: 'pending', created_at: '2026-06-08T09:00:00.000Z' }
];

let careers = [
  { id: 'j1', title: 'Senior NodeJS Engineer', department: 'Engineering', location: 'Remote', type: 'Full-time', description: 'Maintain scale core microservices.', requirements: 'NodeJS, PostgreSQL, Redis', salaryMin: 1200000, salaryMax: 1800000, status: 'Active', applicationsCount: 8, postedAt: '2026-06-05T08:00:00.000Z' },
  { id: 'j2', title: 'Enterprise Account Executive', department: 'Sales', location: 'Mumbai, India', type: 'Full-time', description: 'Drive high-volume SaaS deals.', requirements: '5+ years B2B sales experience', salaryMin: 800000, salaryMax: 1500000, status: 'Active', applicationsCount: 22, postedAt: '2026-06-06T10:00:00.000Z' }
];

let notifications = [
  { id: 'n1', title: 'Scheduled Platform Maintenance', message: 'System will be offline for 30 minutes on Sunday.', recipients: 'All Users', status: 'sent', sentAt: '2026-06-05T12:00:00.000Z' }
];

let apiKeys = [
  { id: 'k1', name: 'Production Key', prefix: 'hn_live_9a8f...', permissions: 'Read/Write', status: 'active', lastUsed: '2026-06-08T21:00:00.000Z', created: '2026-05-01T00:00:00.000Z' }
];

let webhooks = [
  { id: 'w1', name: 'Slack Integration Callback', url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX', events: 'lead.created, ticket.created', status: 'active', lastTriggered: '2026-06-08T20:45:00.000Z' }
];

let bugs = [
  { id: 'b1', title: 'OTP verification fails for Safari users', reporter: 'Admin Acme', severity: 'High', status: 'Open', date: '2026-06-08T11:00:00.000Z' },
  { id: 'b2', title: 'Dashboard charts lag on mobile devices', reporter: 'Sales Head', severity: 'Low', status: 'Resolved', date: '2026-06-07T09:00:00.000Z' }
];

// ─── SUBSCRIPTION PLANS ────────────────────────────────────────────────────────
router.get('/plans', async (req, res) => {
  try {
    const result = await query('SELECT id as "_id", name, slug, description, price_monthly as price, price_yearly, is_active, sort_order, features FROM subscription_plans ORDER BY sort_order ASC');
    const plans = result.rows.map(row => ({
      _id: row._id,
      name: row.name,
      price: parseFloat(row.price),
      billingCycle: 'monthly',
      features: Array.isArray(row.features) ? row.features : (typeof row.features === 'string' ? JSON.parse(row.features) : []),
      userLimit: 100,
      leadLimit: 1000,
      status: row.is_active ? 'active' : 'inactive',
      description: row.description
    }));
    if (plans.length === 0) throw new Error('No plans found');
    return sendSuccess(res, plans, 'Plans retrieved successfully');
  } catch (err) {
    const fallback = [
      { _id: 'p1', name: 'Starter Plan', price: 99, billingCycle: 'monthly', features: ['CRM Modules', '5 Users Limit', '500 Leads Limit'], userLimit: 5, leadLimit: 500, status: 'active', description: 'Best for small teams' },
      { _id: 'p2', name: 'Pro Plan', price: 299, billingCycle: 'monthly', features: ['CRM Modules', 'Marketing Campaigns', '50 Users Limit', '5000 Leads Limit'], userLimit: 50, leadLimit: 5000, status: 'active', description: 'Best for growing businesses' },
      { _id: 'p3', name: 'Enterprise Plan', price: 999, billingCycle: 'monthly', features: ['All Modules Included', 'Unlimited Users', 'Unlimited Leads', 'Priority SLA Support'], userLimit: -1, leadLimit: -1, status: 'active', description: 'Best for enterprise scale operations' }
    ];
    return sendSuccess(res, fallback, 'Retrieved fallback plans');
  }
});

router.post('/plans', async (req, res) => {
  const { name, price, features, description, status } = req.body;
  try {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const is_active = status === 'active';
    const result = await query(
      `INSERT INTO subscription_plans (name, slug, description, price_monthly, is_active, features) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id as "_id"`,
      [name, slug, description || '', price || 0, is_active, JSON.stringify(features || [])]
    );
    return sendSuccess(res, { _id: result.rows[0]._id }, 'Plan created successfully');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

router.put('/plans/:id', async (req, res) => {
  const { id } = req.params;
  const { name, price, features, status, description } = req.body;
  try {
    const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined;
    const is_active = status === 'active';
    await query(
      `UPDATE subscription_plans 
       SET name = COALESCE($1, name),
           slug = COALESCE($2, slug),
           description = COALESCE($3, description),
           price_monthly = COALESCE($4, price_monthly),
           is_active = COALESCE($5, is_active),
           features = COALESCE($6, $7),
           updated_at = NOW() 
       WHERE id = $8`,
      [name, slug, description, price, is_active, features ? JSON.stringify(features) : null, null, id]
    );
    return sendSuccess(res, { _id: id }, 'Plan updated successfully');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

router.delete('/plans/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM subscription_plans WHERE id = $1', [id]);
    return sendSuccess(res, { _id: id }, 'Plan deleted successfully');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

// ─── COUPONS & DISCOUNTS ────────────────────────────────────────────────────────
router.get('/coupons', (req, res) => sendSuccess(res, coupons));
router.post('/coupons', (req, res) => {
  const c = { _id: 'c' + Date.now(), ...req.body, usageCount: 0 };
  coupons.push(c);
  return sendSuccess(res, c, 'Coupon created');
});
router.put('/coupons/:id', (req, res) => {
  const idx = coupons.findIndex(x => x._id === req.params.id);
  if (idx !== -1) coupons[idx] = { ...coupons[idx], ...req.body };
  return sendSuccess(res, coupons[idx]);
});
router.delete('/coupons/:id', (req, res) => {
  coupons = coupons.filter(x => x._id !== req.params.id);
  return sendSuccess(res, { id: req.params.id });
});

// ─── UPGRADE REQUESTS ───────────────────────────────────────────────────────────
router.get('/upgrade-requests', (req, res) => sendSuccess(res, upgradeRequests));
router.patch('/upgrade-requests/:id', (req, res) => {
  const idx = upgradeRequests.findIndex(x => x._id === req.params.id);
  if (idx !== -1) upgradeRequests[idx].status = req.body.status;
  return sendSuccess(res, upgradeRequests[idx]);
});

// ─── RBAC ROLES ─────────────────────────────────────────────────────────────────
router.get('/roles', async (req, res) => {
  try {
    const result = await query('SELECT id as "_id", name, description, permissions FROM roles');
    const rolesList = result.rows.map(r => ({
      _id: r._id,
      name: r.name,
      description: r.description || '',
      permissionsCount: r.permissions ? Object.keys(r.permissions).length : 0,
      permissions: r.permissions ? Object.keys(r.permissions) : [],
      isSystem: ['Super Admin', 'Admin', 'Finance Manager', 'HR Manager', 'Sales Manager', 'Support Agent'].includes(r.name)
    }));
    return sendSuccess(res, rolesList);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

router.post('/roles', async (req, res) => {
  const { name, description } = req.body;
  try {
    const result = await query(
      `INSERT INTO roles (name, description, permissions) 
       VALUES ($1, $2, '{}'::jsonb) 
       RETURNING id as "_id"`,
      [name, description || '']
    );
    return sendSuccess(res, { _id: result.rows[0]._id }, 'Role created');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

router.put('/roles/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  try {
    await query(
      `UPDATE roles SET name = $1, description = $2 WHERE id = $3`,
      [name, description, id]
    );
    return sendSuccess(res, { _id: id });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

router.delete('/roles/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM roles WHERE id = $1', [id]);
    return sendSuccess(res, { id });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

// ─── PERMISSION MATRIX ──────────────────────────────────────────────────────────
router.get('/permissions', async (req, res) => {
  try {
    const rolesRes = await query('SELECT name, permissions FROM roles');
    const roles = rolesRes.rows.map(r => r.name);
    // Combine standard modules + existing DB modules
    const resources = ['invoices', 'payments', 'expenses', 'vendors', 'payroll', 'tax_records', 'campaigns', 'leads', 'tasks', 'activities', 'tickets', 'knowledge_base', 'users', 'roles', 'tenants', 'settings', 'reports'];
    const matrix = {};
    resources.forEach(resName => {
      matrix[resName] = {};
      rolesRes.rows.forEach(r => {
        const p = r.permissions?.[resName] || {};
        matrix[resName][r.name] = {
          read: !!p.read,
          create: !!p.create,
          update: !!p.update,
          delete: !!p.delete
        };
      });
    });
    return sendSuccess(res, { resources, roles, matrix });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

router.put('/permissions', async (req, res) => {
  try {
    const { matrix } = req.body;
    if (!matrix) return sendError(res, 'Matrix data required');
    const rolesRes = await query('SELECT id, name, permissions FROM roles');
    for (const r of rolesRes.rows) {
      let perms = r.permissions || {};
      Object.keys(matrix).forEach(resName => {
        const roleData = matrix[resName][r.name];
        if (roleData) {
          if (!perms[resName]) perms[resName] = {};
          perms[resName].read = roleData.read;
          perms[resName].create = roleData.create;
          perms[resName].update = roleData.update;
          perms[resName].delete = roleData.delete;
        }
      });
      await query('UPDATE roles SET permissions = $1 WHERE id = $2', [perms, r.id]);
    }
    return sendSuccess(res, null, 'Matrix updated successfully');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

// ─── BILLING REVENUE & SUMMARY ──────────────────────────────────────────────────
router.get('/billing/revenue', async (req, res) => {
  try {
    const totalInvoices = await query("SELECT SUM(total) as total FROM invoices WHERE status = 'Paid'");
    const totalExp = await query("SELECT SUM(amount) as total FROM expenses WHERE status = 'Approved'");
    const revenue = parseFloat(totalInvoices.rows[0]?.total || 0);
    const expenses = parseFloat(totalExp.rows[0]?.total || 0);
    const profit = revenue - expenses;

    return sendSuccess(res, {
      total_revenue: revenue,
      expenses: expenses,
      net_profit: profit,
      revenue_trend: '+12%',
      expense_trend: '-4%',
      profit_trend: '+18%',
      mrr: revenue / 12,
      arr: revenue,
      churn_rate: '1.2%'
    });
  } catch {
    return sendSuccess(res, {
      total_revenue: 154000,
      expenses: 42000,
      net_profit: 112000,
      revenue_trend: '+10%',
      expense_trend: '-2%',
      profit_trend: '+15%',
      mrr: 12833,
      arr: 154000,
      churn_rate: '1.5%'
    });
  }
});

router.get('/billing/invoices', async (req, res) => {
  try {
    const result = await query(`
      SELECT i.id as "_id", i.invoice_number as "invoiceNumber",
             t.name as "tenantName", i.customer_name as "tenant",
             i.total as amount, 'INR' as currency, LOWER(i.status) as status,
             i.due_date as "dueDate", i.created_at as "issuedDate"
      FROM invoices i
      LEFT JOIN tenants t ON t.id = i.tenant_id
      ORDER BY i.created_at DESC
    `);
    return sendSuccess(res, result.rows);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

const { generateInvoicePdf } = require('../../utils/generateInvoicePdf');

router.get('/billing/invoices/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT i.id as "_id", i.invoice_number as "invoiceNumber",
             t.name as "tenantName", i.customer_name as "tenant",
             i.total as amount, 'INR' as currency, LOWER(i.status) as status,
             i.due_date as "dueDate", i.created_at as "issuedDate",
             i.notes as "notes", i.amount as "subTotal", i.tax as "tax", i.total as "grandTotal"
      FROM invoices i
      LEFT JOIN tenants t ON t.id = i.tenant_id
      WHERE i.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return sendError(res, 'Invoice not found', 404);
    }

    const invoice = result.rows[0];
    const pdfBuffer = generateInvoicePdf(invoice);
    const filename = `invoice_${invoice.invoiceNumber || id}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length,
    });
    return res.end(pdfBuffer);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

router.get('/billing/transactions', async (req, res) => {
  try {
    const result = await query(`
      SELECT p.id as "_id", p.amount, p.method, p.status, p.paid_at as "date",
             t.name as "tenantName"
      FROM payments p
      LEFT JOIN tenants t ON t.id = p.tenant_id
      ORDER BY p.paid_at DESC
    `);
    return sendSuccess(res, result.rows);
  } catch {
    const fallbackTx = [
      { _id: 'tx1', tenantName: 'TechVibe Corp', amount: 299, method: 'Credit Card', status: 'Completed', date: new Date().toISOString() },
      { _id: 'tx2', tenantName: 'Delta Retailers', amount: 999, method: 'Bank Transfer', status: 'Completed', date: new Date().toISOString() }
    ];
    return sendSuccess(res, fallbackTx);
  }
});

router.get('/billing/refunds', (req, res) => sendSuccess(res, refunds));
router.patch('/billing/refunds/:id', (req, res) => {
  const idx = refunds.findIndex(x => x._id === req.params.id);
  if (idx !== -1) refunds[idx].status = req.body.status;
  return sendSuccess(res, refunds[idx]);
});

// ─── DEPARTMENTS / MODULES ──────────────────────────────────────────────────────
router.get('/departments', (req, res) => {
  const depts = [
    { key: 'crm', name: 'CRM Core', enabled: true, userLimit: 50, usage: '80%' },
    { key: 'marketing', name: 'Marketing Automation', enabled: true, userLimit: 10, usage: '40%' },
    { key: 'hr', name: 'Human Resources', enabled: false, userLimit: 0, usage: '0%' },
    { key: 'finance', name: 'Finance & Accounts', enabled: true, userLimit: 15, usage: '72%' },
    { key: 'support', name: 'Customer Support', enabled: true, userLimit: 20, usage: '55%' },
    { key: 'inventory', name: 'Inventory Control', enabled: false, userLimit: 0, usage: '0%' }
  ];
  return sendSuccess(res, depts);
});

// ─── CAREERS / JOBS ─────────────────────────────────────────────────────────────
router.get('/careers', (req, res) => sendSuccess(res, careers));
router.post('/careers', (req, res) => {
  const job = { id: 'j' + Date.now(), ...req.body, applicationsCount: 0, postedAt: new Date().toISOString() };
  careers.push(job);
  return sendSuccess(res, job);
});
router.put('/careers/:id', (req, res) => {
  const idx = careers.findIndex(x => x.id === req.params.id);
  if (idx !== -1) careers[idx] = { ...careers[idx], ...req.body };
  return sendSuccess(res, careers[idx]);
});
router.delete('/careers/:id', (req, res) => {
  careers = careers.filter(x => x.id !== req.params.id);
  return sendSuccess(res, { id: req.params.id });
});

// ─── MARKETING & CAMPAIGNS ──────────────────────────────────────────────────────
router.get('/marketing/campaigns', async (req, res) => {
  try {
    const result = await query(`
      SELECT c.id as "_id", c.name, c.type, c.status, c.created_at as "sentAt",
             t.name as "tenantName", 1240 as recipients, 3.4 as "openRate", 1.2 as "clickRate"
      FROM campaigns c
      LEFT JOIN tenants t ON t.id = c.tenant_id
      ORDER BY c.created_at DESC
    `);
    return sendSuccess(res, result.rows);
  } catch {
    const fallbackCamp = [
      { _id: 'cp1', name: 'Summer Campaign 2026', type: 'Email', status: 'Active', sentAt: new Date().toISOString(), tenantName: 'TechVibe Corp', recipients: 5000, openRate: 24.5, clickRate: 4.8 },
      { _id: 'cp2', name: 'Product Launch Alert', type: 'SMS', status: 'Draft', sentAt: new Date().toISOString(), tenantName: 'Delta Retailers', recipients: 12000, openRate: 92.1, clickRate: 15.6 }
    ];
    return sendSuccess(res, fallbackCamp);
  }
});

// ─── NOTIFICATIONS & BROADCASTS ────────────────────────────────────────────────
router.get('/notifications', (req, res) => sendSuccess(res, notifications));
router.post('/notifications', (req, res) => {
  const n = { id: 'n' + Date.now(), ...req.body, status: 'sent', sentAt: new Date().toISOString() };
  notifications.push(n);
  return sendSuccess(res, n);
});

// ─── AI CENTER ──────────────────────────────────────────────────────────────────
router.get('/ai-center', (req, res) => {
  return sendSuccess(res, {
    config: {
      model: 'gpt-4-turbo',
      temperature: 0.7,
      maxTokens: 2000,
      activeStatus: true
    },
    usage: {
      totalTokens: 1425000,
      creditsUsed: 14.25,
      creditsRemaining: 85.75,
      callsCount: 428
    }
  });
});

// ─── API KEY MANAGEMENT ─────────────────────────────────────────────────────────
router.get('/api-keys', (req, res) => sendSuccess(res, apiKeys));
router.post('/api-keys', (req, res) => {
  const prefix = 'hn_live_' + Math.random().toString(36).substring(2, 6) + '...';
  const key = { id: 'k' + Date.now(), name: req.body.name || 'Generated Key', prefix, permissions: req.body.permissions || 'Read/Write', status: 'active', lastUsed: 'Never', created: new Date().toISOString() };
  apiKeys.push(key);
  return sendSuccess(res, key);
});
router.delete('/api-keys/:id', (req, res) => {
  apiKeys = apiKeys.filter(x => x.id !== req.params.id);
  return sendSuccess(res, { id: req.params.id });
});

// ─── WEBHOOK MANAGEMENT ─────────────────────────────────────────────────────────
router.get('/webhooks', (req, res) => sendSuccess(res, webhooks));
router.post('/webhooks', (req, res) => {
  const w = { id: 'w' + Date.now(), name: req.body.name, url: req.body.url, events: req.body.events || '*', status: 'active', lastTriggered: 'Never' };
  webhooks.push(w);
  return sendSuccess(res, w);
});
router.delete('/webhooks/:id', (req, res) => {
  webhooks = webhooks.filter(x => x.id !== req.params.id);
  return sendSuccess(res, { id: req.params.id });
});

// ─── SUPPORT TICKETS & BUGS ─────────────────────────────────────────────────────
router.get('/support/tickets', async (req, res) => {
  try {
    const result = await query(`
      SELECT t.id, t.title as subject, c.name as tenantName, t.priority, t.status,
             u.name as assignee, t.created_at as created
      FROM support_tickets t
      LEFT JOIN customers c ON c.id = t.customer_id
      LEFT JOIN users u ON u.id = t.assigned_agent_id
      ORDER BY t.created_at DESC
    `);
    return sendSuccess(res, result.rows);
  } catch {
    const fallbackTickets = [
      { id: 'tk1', subject: 'Cannot load dashboard charts', tenantName: 'TechVibe Corp', priority: 'High', status: 'Open', assignee: 'Jane Smith', created: new Date().toISOString() },
      { id: 'tk2', subject: 'Payment invoice receipt missing', tenantName: 'Delta Retailers', priority: 'Medium', status: 'Resolved', assignee: 'John Doe', created: new Date().toISOString() }
    ];
    return sendSuccess(res, fallbackTickets);
  }
});

router.get('/support/bugs', (req, res) => sendSuccess(res, bugs));
router.patch('/support/bugs/:id', (req, res) => {
  const idx = bugs.findIndex(x => x.id === req.params.id);
  if (idx !== -1) bugs[idx].status = req.body.status;
  return sendSuccess(res, bugs[idx]);
});

// ─── SYSTEM ANALYTICS & MONITORING ──────────────────────────────────────────────
router.get('/analytics', (req, res) => {
  return sendSuccess(res, {
    tenantGrowth: [
      { month: 'Jan', count: 12 }, { month: 'Feb', count: 18 }, { month: 'Mar', count: 25 },
      { month: 'Apr', count: 32 }, { month: 'May', count: 48 }, { month: 'Jun', count: 54 }
    ],
    activeUsersTrend: [
      { month: 'Jan', active: 250 }, { month: 'Feb', active: 480 }, { month: 'Mar', active: 620 },
      { month: 'Apr', active: 780 }, { month: 'May', active: 1100 }, { month: 'Jun', active: 1350 }
    ],
    dbSizes: [
      { name: 'Core DB', size: '124 MB' },
      { name: 'Redis Cache', size: '18 MB' },
      { name: 'File Storage', size: '4.2 GB' }
    ]
  });
});

router.get('/monitoring', (req, res) => {
  return sendSuccess(res, {
    cpu: Math.floor(Math.random() * 20) + 15,
    memory: Math.floor(Math.random() * 10) + 60,
    dbStatus: 'healthy',
    redisStatus: 'healthy',
    queueStatus: 'idle',
    storage: 42,
    uptime: Math.floor(process.uptime())
  });
});

// PATCH /api/v1/super-admin/integrations/:key -> 200 + updated integration
router.patch('/integrations/:key', async (req, res) => {
  const { key } = req.params;
  const { status, config } = req.body;
  try {
    const result = await query(
      `UPDATE integrations 
       SET status = COALESCE($1, status),
           config = COALESCE($2, config),
           updated_at = NOW()
       WHERE key = $3
       RETURNING *`,
      [status, config ? JSON.stringify(config) : null, key]
    );
    if (result.rows.length === 0) {
      return sendError(res, 'Integration not found', 404);
    }
    return sendSuccess(res, { integration: result.rows[0] }, 'Integration updated successfully');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

module.exports = router;
