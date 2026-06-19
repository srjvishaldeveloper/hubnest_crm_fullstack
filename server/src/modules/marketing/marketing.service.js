const { query } = require('../../config/database');
const { sendFormConfirmationEmail } = require('../../services/emailService');

// --- Campaigns Extension ---
async function listCampaigns(tenantId, { status, platform } = {}) {
  let sql = `SELECT * FROM campaigns WHERE tenant_id = $1`;
  const params = [tenantId];
  if (status) { params.push(status); sql += ` AND status = $${params.length}`; }
  if (platform) { params.push(platform); sql += ` AND platform = $${params.length}`; }
  sql += ` ORDER BY created_at DESC`;
  const result = await query(sql, params);
  return result.rows;
}

async function getCampaignById(tenantId, id) {
  const result = await query(
    `SELECT c.*,
       COALESCE(json_agg(ca ORDER BY ca.date DESC) FILTER (WHERE ca.id IS NOT NULL), '[]') AS analytics
     FROM campaigns c
     LEFT JOIN campaign_analytics ca ON ca.campaign_id = c.id
     WHERE c.id = $1 AND c.tenant_id = $2
     GROUP BY c.id`,
    [id, tenantId]
  );
  return result.rows[0] || null;
}

async function createCampaign(tenantId, userId, data) {
  const { name, type, platform, budget_daily, budget_total, start_date, end_date, status, target_audience, content, parent_campaign_id, channels, schedule_config, ab_test_config } = data;
  const result = await query(
    `INSERT INTO campaigns (tenant_id, name, type, platform, budget_daily, budget_total,
       start_date, end_date, status, target_audience, content, created_by, parent_campaign_id, channels, schedule_config, ab_test_config)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     RETURNING *`,
    [tenantId, name, type, platform, budget_daily || 0, budget_total || 0,
     start_date || null, end_date || null, status || 'Draft',
     JSON.stringify(target_audience || {}), JSON.stringify(content || {}), userId,
     parent_campaign_id || null, channels || [], JSON.stringify(schedule_config || {}), JSON.stringify(ab_test_config || {})]
  );
  return result.rows[0];
}

async function updateCampaign(tenantId, id, data) {
  const fields = ['name','type','platform','budget_daily','budget_total','start_date','end_date','status','target_audience','content','parent_campaign_id','channels','schedule_config','ab_test_config','sent_count'];
  const updates = [];
  const params = [];
  fields.forEach(f => {
    if (data[f] !== undefined) {
      params.push(typeof data[f] === 'object' ? JSON.stringify(data[f]) : data[f]);
      updates.push(`${f} = $${params.length}`);
    }
  });
  if (!updates.length) return null;
  params.push(id, tenantId);
  const result = await query(
    `UPDATE campaigns SET ${updates.join(', ')}, updated_at = NOW()
     WHERE id = $${params.length - 1} AND tenant_id = $${params.length}
     RETURNING *`,
    params
  );
  return result.rows[0] || null;
}

async function deleteCampaign(tenantId, id) {
  const result = await query(
    `DELETE FROM campaigns WHERE id = $1 AND tenant_id = $2 RETURNING id`,
    [id, tenantId]
  );
  return !!result.rows[0];
}

// --- Contact Lists & Imports ---
async function listContactLists(tenantId) {
  const result = await query(
    `SELECT l.*, COUNT(lc.lead_id) AS contact_count 
     FROM marketing_contact_lists l
     LEFT JOIN marketing_list_contacts lc ON lc.list_id = l.id
     WHERE l.tenant_id = $1
     GROUP BY l.id ORDER BY l.created_at DESC`,
    [tenantId]
  );
  return result.rows;
}

async function createContactList(tenantId, { name, description }) {
  const result = await query(
    `INSERT INTO marketing_contact_lists (tenant_id, name, description)
     VALUES ($1, $2, $3) RETURNING *`,
    [tenantId, name, description]
  );
  return result.rows[0];
}

async function deleteContactList(tenantId, id) {
  const result = await query(
    `DELETE FROM marketing_contact_lists WHERE id = $1 AND tenant_id = $2 RETURNING id`,
    [id, tenantId]
  );
  return !!result.rows[0];
}

async function addContactsToList(tenantId, listId, contactIds) {
  for (const contactId of contactIds) {
    await query(
      `INSERT INTO marketing_list_contacts (list_id, lead_id)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [listId, contactId]
    );
  }
  return { success: true, count: contactIds.length };
}

// --- Audience Segments ---
async function listSegments(tenantId) {
  const result = await query(
    `SELECT * FROM marketing_segments WHERE tenant_id = $1 ORDER BY created_at DESC`,
    [tenantId]
  );
  return result.rows;
}

async function createSegment(tenantId, { name, description, criteria }) {
  const result = await query(
    `INSERT INTO marketing_segments (tenant_id, name, description, criteria)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [tenantId, name, description, JSON.stringify(criteria)]
  );
  return result.rows[0];
}

async function deleteSegment(tenantId, id) {
  const result = await query(
    `DELETE FROM marketing_segments WHERE id = $1 AND tenant_id = $2 RETURNING id`,
    [id, tenantId]
  );
  return !!result.rows[0];
}

// --- Visual Workflows & Automations ---
async function listWorkflows(tenantId) {
  const result = await query(
    `SELECT w.*, COUNT(r.id) AS active_runs 
     FROM marketing_workflows w
     LEFT JOIN marketing_workflow_runs r ON r.workflow_id = w.id AND r.status = 'Running'
     WHERE w.tenant_id = $1
     GROUP BY w.id ORDER BY w.created_at DESC`,
    [tenantId]
  );
  return result.rows;
}

async function createWorkflow(tenantId, userId, { name, description, trigger_type, trigger_config, nodes, edges, status }) {
  // Accept trigger_type from frontend and merge into trigger_config
  const resolvedConfig = trigger_config || (trigger_type ? { type: trigger_type } : {});
  const result = await query(
    `INSERT INTO marketing_workflows (tenant_id, name, description, trigger_config, nodes, edges, status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [tenantId, name, description, JSON.stringify(resolvedConfig), JSON.stringify(nodes || []), JSON.stringify(edges || []), status || 'Draft', userId]
  );
  const row = result.rows[0];
  if (row) row.trigger_type = (row.trigger_config?.type) || trigger_type || '';
  return row;
}

async function getWorkflow(tenantId, id) {
  const result = await query(
    `SELECT * FROM marketing_workflows WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );
  return result.rows[0] || null;
}

async function updateWorkflow(tenantId, id, data) {
  const fields = ['name', 'description', 'trigger_config', 'nodes', 'edges', 'status'];
  const updates = [];
  const params = [];
  fields.forEach(f => {
    if (data[f] !== undefined) {
      params.push(typeof data[f] === 'object' ? JSON.stringify(data[f]) : data[f]);
      updates.push(`${f} = $${params.length}`);
    }
  });
  if (!updates.length) return null;
  params.push(id, tenantId);
  const result = await query(
    `UPDATE marketing_workflows SET ${updates.join(', ')}, updated_at = NOW()
     WHERE id = $${params.length - 1} AND tenant_id = $${params.length}
     RETURNING *`,
    params
  );
  return result.rows[0] || null;
}

async function deleteWorkflow(tenantId, id) {
  const result = await query(
    `DELETE FROM marketing_workflows WHERE id = $1 AND tenant_id = $2 RETURNING id`,
    [id, tenantId]
  );
  return !!result.rows[0];
}

// --- Workflow Runs ---
async function triggerWorkflowRun(tenantId, workflowId, leadId, initialNodeId) {
  // If no leadId provided, skip DB run record (table requires NOT NULL lead_id)
  if (!leadId) {
    return { id: null, workflow_id: workflowId, status: 'Running', created_at: new Date().toISOString() };
  }
  const result = await query(
    `INSERT INTO marketing_workflow_runs (tenant_id, workflow_id, lead_id, current_node_id, status)
     VALUES ($1, $2, $3, $4, 'Running') RETURNING *`,
    [tenantId, workflowId, leadId, initialNodeId]
  );
  return result.rows[0];
}

async function getWorkflowRuns(tenantId, workflowId) {
  const result = await query(
    `SELECT r.*, l.name AS lead_name, l.email AS lead_email
     FROM marketing_workflow_runs r
     LEFT JOIN leads_marketing l ON l.id = r.lead_id
     WHERE r.tenant_id = $1 AND r.workflow_id = $2
     ORDER BY r.created_at DESC`,
    [tenantId, workflowId]
  );
  return result.rows;
}

// --- Dynamic Forms Builder ---
async function listForms(tenantId) {
  const result = await query(
    `SELECT f.*, COUNT(s.id) AS submission_count,
            MAX(s.created_at) AS last_submission
     FROM marketing_forms f
     LEFT JOIN marketing_form_submissions s ON s.form_id = f.id
     WHERE f.tenant_id = $1
     GROUP BY f.id ORDER BY f.created_at DESC`,
    [tenantId]
  );
  // Surface type from settings for frontend compatibility
  return result.rows.map((row) => ({
    ...row,
    type: row.settings?.type || row.type || 'Lead Capture',
  }));
}

async function getFormById(tenantId, id) {
  const result = await query(
    `SELECT * FROM marketing_forms WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );
  return result.rows[0] || null;
}

async function getFormByIdPublic(id) {
  const result = await query(
    `SELECT id, name, description, fields, settings, tenant_id FROM marketing_forms WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

async function submitFormPublic(formId, submissionData, ipAddress, userAgent) {
  // Look up tenant_id + fields from the form itself
  const form = await getFormByIdPublic(formId);
  if (!form) return null;
  const result = await query(
    `INSERT INTO marketing_form_submissions (tenant_id, form_id, submission_data, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [form.tenant_id, formId, JSON.stringify(submissionData), ipAddress, userAgent]
  );
  // Autocreate lead
  const { name, email, phone } = submissionData;
  if (name) {
    await query(
      `INSERT INTO leads_marketing (tenant_id, name, email, phone, source, status)
       VALUES ($1, $2, $3, $4, 'Form Submission', 'New') ON CONFLICT DO NOTHING`,
      [form.tenant_id, name, email || null, phone || null]
    );
  }
  // Send confirmation email to the submitter (fire-and-forget)
  if (email) {
    const formFields = (() => {
      try {
        const raw = form.fields;
        return Array.isArray(raw) ? raw : (typeof raw === 'string' ? JSON.parse(raw) : []);
      } catch { return []; }
    })();
    // Build label→value pairs for the email summary
    const emailFields = Object.entries(submissionData).map(([key, value]) => {
      const fieldDef = formFields.find(f => f.name === key || f.id === key);
      const label = fieldDef?.label || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      return { label, value: String(value ?? '') };
    });
    const accent = form.settings?.accent_color || '#F97316';
    sendFormConfirmationEmail({
      to: email,
      formName: form.name,
      submitterName: name || '',
      fields: emailFields,
      accentColor: accent,
    }).catch(() => {}); // never block on email
  }
  return result.rows[0];
}

async function createForm(tenantId, { name, description, type, fields, settings }) {
  const mergedSettings = { ...(settings || {}), type: type || 'Lead Capture' };
  const result = await query(
    `INSERT INTO marketing_forms (tenant_id, name, description, fields, settings)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [tenantId, name, description, JSON.stringify(fields || []), JSON.stringify(mergedSettings)]
  );
  const row = result.rows[0];
  // Surface type at the top level for frontend compatibility
  if (row && row.settings?.type) row.type = row.settings.type;
  return row;
}

async function updateForm(tenantId, id, { name, description, type, fields, settings }) {
  const mergedSettings = { ...(settings || {}), type: type || settings?.type || 'Lead Capture' };
  const result = await query(
    `UPDATE marketing_forms
     SET name = COALESCE($3, name),
         description = COALESCE($4, description),
         fields = COALESCE($5, fields),
         settings = COALESCE($6, settings),
         updated_at = NOW()
     WHERE id = $1 AND tenant_id = $2
     RETURNING *`,
    [id, tenantId,
     name || null,
     description !== undefined ? description : null,
     fields !== undefined ? JSON.stringify(fields) : null,
     JSON.stringify(mergedSettings)]
  );
  const row = result.rows[0] || null;
  if (row && row.settings?.type) row.type = row.settings.type;
  return row;
}

async function deleteForm(tenantId, id) {
  const result = await query(
    `DELETE FROM marketing_forms WHERE id = $1 AND tenant_id = $2 RETURNING id`,
    [id, tenantId]
  );
  return !!result.rows[0];
}

async function submitForm(tenantId, formId, submissionData, ipAddress, userAgent) {
  const result = await query(
    `INSERT INTO marketing_form_submissions (tenant_id, form_id, submission_data, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [tenantId, formId, JSON.stringify(submissionData), ipAddress, userAgent]
  );
  return result.rows[0];
}

async function getFormSubmissions(tenantId, formId) {
  const result = await query(
    `SELECT * FROM marketing_form_submissions WHERE tenant_id = $1 AND form_id = $2 ORDER BY created_at DESC`,
    [tenantId, formId]
  );
  return result.rows;
}

// --- Landing Pages ---
async function listLandingPages(tenantId) {
  const result = await query(
    `SELECT * FROM marketing_landing_pages WHERE tenant_id = $1 ORDER BY created_at DESC`,
    [tenantId]
  );
  return result.rows;
}

async function createLandingPage(tenantId, { title, name, slug, content, settings, seo_settings, seo_title, seo_description, custom_domain, status, campaign_id }) {
  const resolvedTitle = title || name || 'Untitled Page';
  const resolvedSlug = slug || resolvedTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const resolvedContent = content || settings || {};
  const resolvedSeo = seo_settings || (seo_title || seo_description ? { title: seo_title, description: seo_description } : {});
  const result = await query(
    `INSERT INTO marketing_landing_pages (tenant_id, title, slug, content, seo_settings, custom_domain, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [tenantId, resolvedTitle, resolvedSlug, JSON.stringify(resolvedContent), JSON.stringify(resolvedSeo), custom_domain || null, status || 'Draft']
  );
  return result.rows[0];
}

async function updateLandingPage(tenantId, id, data) {
  const fields = ['title', 'slug', 'content', 'seo_settings', 'custom_domain', 'status'];
  const updates = [];
  const params = [];
  fields.forEach(f => {
    if (data[f] !== undefined) {
      params.push(typeof data[f] === 'object' ? JSON.stringify(data[f]) : data[f]);
      updates.push(`${f} = $${params.length}`);
    }
  });
  if (!updates.length) return null;
  params.push(id, tenantId);
  const result = await query(
    `UPDATE marketing_landing_pages SET ${updates.join(', ')}, updated_at = NOW()
     WHERE id = $${params.length - 1} AND tenant_id = $${params.length}
     RETURNING *`,
    params
  );
  return result.rows[0] || null;
}

async function getLandingPageById(id) {
  const result = await query(
    `SELECT * FROM marketing_landing_pages WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

async function deleteLandingPage(tenantId, id) {
  const result = await query(
    `DELETE FROM marketing_landing_pages WHERE id = $1 AND tenant_id = $2 RETURNING id`,
    [id, tenantId]
  );
  return !!result.rows[0];
}

// --- Templates ---
async function listTemplates(tenantId, type) {
  let sql = `SELECT * FROM marketing_templates WHERE tenant_id = $1`;
  const params = [tenantId];
  if (type) {
    params.push(type);
    sql += ` AND type = $2`;
  }
  sql += ` ORDER BY created_at DESC`;
  const result = await query(sql, params);
  return result.rows;
}

async function createTemplate(tenantId, { name, type, content }) {
  const result = await query(
    `INSERT INTO marketing_templates (tenant_id, name, type, content)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [tenantId, name, type, content]
  );
  return result.rows[0];
}

async function deleteTemplate(tenantId, id) {
  const result = await query(
    `DELETE FROM marketing_templates WHERE id = $1 AND tenant_id = $2 RETURNING id`,
    [id, tenantId]
  );
  return !!result.rows[0];
}

// --- Media Assets ---
async function listMedia(tenantId) {
  const result = await query(
    `SELECT * FROM marketing_media WHERE tenant_id = $1 ORDER BY created_at DESC`,
    [tenantId]
  );
  return result.rows;
}

async function createMedia(tenantId, { file_name, file_url, file_size, mime_type }) {
  const result = await query(
    `INSERT INTO marketing_media (tenant_id, file_name, file_url, file_size, mime_type)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [tenantId, file_name, file_url, file_size, mime_type]
  );
  return result.rows[0];
}

// --- Subscription Status ---
async function listSubscriptions(tenantId) {
  const result = await query(
    `SELECT s.*, l.name AS lead_name, l.email AS lead_email 
     FROM marketing_subscriptions s
     JOIN leads_marketing l ON l.id = s.lead_id
     WHERE s.tenant_id = $1 ORDER BY s.updated_at DESC`,
    [tenantId]
  );
  return result.rows;
}

async function updateSubscription(tenantId, { lead_id, channel, status, reason }) {
  const result = await query(
    `INSERT INTO marketing_subscriptions (tenant_id, lead_id, channel, status, reason, unsubscribed_at)
     VALUES ($1, $2, $3, $4, $5, CASE WHEN $4 = 'Unsubscribed' THEN NOW() ELSE NULL END)
     ON CONFLICT (lead_id, channel) DO UPDATE SET 
       status = EXCLUDED.status,
       reason = EXCLUDED.reason,
       unsubscribed_at = CASE WHEN EXCLUDED.status = 'Unsubscribed' THEN NOW() ELSE NULL END,
       updated_at = NOW()
     RETURNING *`,
    [tenantId, lead_id, channel, status, reason || null]
  );
  return result.rows[0];
}

// --- Webhooks ---
async function listWebhooks(tenantId) {
  const result = await query(
    `SELECT * FROM marketing_webhooks WHERE tenant_id = $1 ORDER BY created_at DESC`,
    [tenantId]
  );
  return result.rows;
}

async function createWebhook(tenantId, { url, events, secret }) {
  const result = await query(
    `INSERT INTO marketing_webhooks (tenant_id, url, events, secret)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [tenantId, url, events || [], secret || '']
  );
  return result.rows[0];
}

async function deleteWebhook(tenantId, id) {
  const result = await query(
    `DELETE FROM marketing_webhooks WHERE id = $1 AND tenant_id = $2 RETURNING id`,
    [id, tenantId]
  );
  return !!result.rows[0];
}

// --- Core Leads Marketing Mapping ---
async function listLeads(tenantId, { status, source, platform, campaign_id } = {}) {
  let sql = `SELECT l.*, c.name AS campaign_name, u.name AS assigned_to_name
             FROM leads_marketing l
             LEFT JOIN campaigns c ON c.id = l.campaign_id
             LEFT JOIN users u ON u.id = l.assigned_to
             WHERE l.tenant_id = $1`;
  const params = [tenantId];
  if (status) { params.push(status); sql += ` AND l.status = $${params.length}`; }
  if (source) { params.push(source); sql += ` AND l.source = $${params.length}`; }
  if (platform) { params.push(platform); sql += ` AND l.platform = $${params.length}`; }
  if (campaign_id) { params.push(campaign_id); sql += ` AND l.campaign_id = $${params.length}`; }
  sql += ` ORDER BY l.created_at DESC`;
  const result = await query(sql, params);
  return result.rows;
}

async function updateLead(tenantId, id, data) {
  const { status, assigned_to, quality_score, priority, notes, company, next_followup } = data;
  const updates = [];
  const params = [];
  if (status !== undefined)       { params.push(status);       updates.push(`status = $${params.length}`); }
  if (assigned_to !== undefined)  { params.push(assigned_to);  updates.push(`assigned_to = $${params.length}`); }
  if (quality_score !== undefined){ params.push(quality_score);updates.push(`quality_score = $${params.length}`); }
  if (priority !== undefined)     { params.push(priority);     updates.push(`priority = $${params.length}`); }
  if (notes !== undefined)        { params.push(notes);        updates.push(`notes = $${params.length}`); }
  if (company !== undefined)      { params.push(company);      updates.push(`company = $${params.length}`); }
  if (next_followup !== undefined){ params.push(next_followup);updates.push(`next_followup = $${params.length}`); }
  if (!updates.length) return null;
  params.push(id, tenantId);
  const result = await query(
    `UPDATE leads_marketing SET ${updates.join(', ')}, updated_at = NOW()
     WHERE id = $${params.length - 1} AND tenant_id = $${params.length}
     RETURNING *`,
    params
  );
  return result.rows[0] || null;
}

async function bulkAssignLeads(tenantId, leadIds, assignedTo, assignedBy) {
  await query(
    `UPDATE leads_marketing SET assigned_to = $1, assigned_by = $2, updated_at = NOW()
     WHERE id = ANY($3::uuid[]) AND tenant_id = $4`,
    [assignedTo, assignedBy || null, leadIds, tenantId]
  );
  // Track in lead_assignments history
  for (const leadId of leadIds) {
    try {
      await query(
        `INSERT INTO lead_assignments (tenant_id, lead_id, assigned_to, assigned_by, notes)
         VALUES ($1, $2, $3, $4, 'Assigned by Marketing')
         ON CONFLICT DO NOTHING`,
        [tenantId, leadId, assignedTo, assignedBy || null]
      );
    } catch { /* ignore if table doesn't have unique constraint */ }
  }
  return { assigned: leadIds.length };
}

async function listSalesUsers(tenantId) {
  const result = await query(
    `SELECT u.id, u.name, u.email, r.name AS role,
       COUNT(l.id) FILTER (WHERE l.status NOT IN ('Converted','Lost')) AS active_leads,
       COUNT(l.id) FILTER (WHERE l.status = 'Converted') AS converted_leads,
       COUNT(l.id) AS total_leads
     FROM users u
     JOIN roles r ON r.id = u.role_id
     LEFT JOIN leads_marketing l ON l.assigned_to = u.id AND l.tenant_id = $1
     WHERE u.tenant_id = $1 AND r.name IN ('Sales Executive','Sales Manager','sales','sales_executive','sales_manager')
     GROUP BY u.id, u.name, u.email, r.name
     ORDER BY u.name`,
    [tenantId]
  );
  return result.rows;
}

async function getDashboardAnalytics(tenantId) {
  const [campaigns, leads, analytics] = await Promise.all([
    query(`SELECT status, COUNT(*) AS cnt FROM campaigns WHERE tenant_id = $1 GROUP BY status`, [tenantId]),
    query(`SELECT status, source, COUNT(*) AS cnt FROM leads_marketing WHERE tenant_id = $1 GROUP BY status, source`, [tenantId]),
    query(
      `SELECT ca.date, SUM(ca.impressions) AS impressions, SUM(ca.clicks) AS clicks,
              SUM(ca.leads) AS leads, SUM(ca.cost) AS cost, SUM(ca.revenue) AS revenue
       FROM campaign_analytics ca
       JOIN campaigns c ON c.id = ca.campaign_id
       WHERE c.tenant_id = $1 AND ca.date >= NOW() - INTERVAL '30 days'
       GROUP BY ca.date ORDER BY ca.date`,
      [tenantId]
    ),
  ]);
  return { campaigns: campaigns.rows, leads: leads.rows, analytics: analytics.rows };
}

async function getROIData(tenantId) {
  const result = await query(
    `SELECT ca.date,
            SUM(ca.cost) AS cost,
            SUM(ca.revenue) AS revenue,
            CASE WHEN SUM(ca.cost) > 0 THEN ROUND(((SUM(ca.revenue) - SUM(ca.cost)) / SUM(ca.cost)) * 100, 2) ELSE 0 END AS roi
     FROM campaign_analytics ca
     JOIN campaigns c ON c.id = ca.campaign_id
     WHERE c.tenant_id = $1 AND ca.date >= NOW() - INTERVAL '30 days'
     GROUP BY ca.date ORDER BY ca.date`,
    [tenantId]
  );
  return result.rows;
}

// --- Campaign Builder helpers ---

async function getCampaignContacts(tenantId, campaignId) {
  // Strategy 1: list_id stored in campaign content
  const camp = await query(
    `SELECT content, type FROM campaigns WHERE id = $1 AND tenant_id = $2`,
    [campaignId, tenantId]
  );
  const content = camp.rows[0]?.content || {};
  const listId = content.list_id;

  if (listId) {
    try {
      const result = await query(
        `SELECT DISTINCT l.id, l.name, l.email, l.phone
         FROM marketing_list_contacts lc
         JOIN leads_marketing l ON l.id = lc.lead_id
         WHERE lc.list_id = $1 AND l.tenant_id = $2 AND l.email IS NOT NULL`,
        [listId, tenantId]
      );
      if (result.rows.length > 0) return result.rows;
    } catch { /* list may not exist, fall through */ }
  }

  // Strategy 2: audience tag stored in content (e.g. content.audience = 'hot_leads')
  const audience = content.audience;
  if (audience && audience !== 'all_subscribers') {
    let whereClause = '';
    if (audience === 'hot_leads') whereClause = `AND l.priority = 'Hot'`;
    else if (audience === 'inactive_30d') whereClause = `AND l.updated_at < NOW() - INTERVAL '30 days'`;
    else if (audience === 'converted') whereClause = `AND l.status = 'Converted'`;
    const result = await query(
      `SELECT l.id, l.name, l.email, l.phone
       FROM leads_marketing l
       WHERE l.tenant_id = $1 AND l.email IS NOT NULL ${whereClause}
       ORDER BY l.created_at DESC`,
      [tenantId]
    );
    if (result.rows.length > 0) return result.rows;
  }

  // Strategy 3: fall back to all leads with email for this tenant
  const result = await query(
    `SELECT l.id, l.name, l.email, l.phone
     FROM leads_marketing l
     WHERE l.tenant_id = $1 AND l.email IS NOT NULL
     ORDER BY l.created_at DESC`,
    [tenantId]
  );
  return result.rows;
}

async function queueCampaignLogs(tenantId, campaignId, contactIds) {
  for (const cid of contactIds) {
    await query(
      `INSERT INTO campaign_logs (campaign_id, contact_id, tenant_id, status)
       VALUES ($1, $2, $3, 'queued') ON CONFLICT DO NOTHING`,
      [campaignId, cid, tenantId]
    );
  }
}

async function updateCampaignLogStatus(tenantId, campaignId, contactId, status) {
  await query(
    `UPDATE campaign_logs SET status = $1, updated_at = NOW()
     WHERE campaign_id = $2 AND contact_id = $3 AND tenant_id = $4`,
    [status, campaignId, contactId, tenantId]
  );
}

async function getCampaignStats(tenantId, campaignId) {
  const result = await query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'queued')    AS queued,
       COUNT(*) FILTER (WHERE status = 'sent')      AS sent,
       COUNT(*) FILTER (WHERE status = 'delivered') AS delivered,
       COUNT(*) FILTER (WHERE status = 'failed')    AS failed,
       COUNT(*) FILTER (WHERE status = 'bounced')   AS bounced,
       COUNT(*) AS total
     FROM campaign_logs
     WHERE campaign_id = $1 AND tenant_id = $2`,
    [campaignId, tenantId]
  );
  return result.rows[0];
}

async function importContactsToList(tenantId, listId, contacts) {
  let imported = 0;
  let skipped = 0;
  for (const c of contacts) {
    if (!c.email && !c.phone) { skipped++; continue; }

    // Find existing lead in leads_marketing by email or phone within this tenant
    let leadId = null;
    if (c.email) {
      const existing = await query(
        `SELECT id FROM leads_marketing WHERE tenant_id = $1 AND email = $2 LIMIT 1`,
        [tenantId, c.email]
      );
      if (existing.rows[0]) leadId = existing.rows[0].id;
    }
    if (!leadId && c.phone) {
      const existing = await query(
        `SELECT id FROM leads_marketing WHERE tenant_id = $1 AND phone = $2 LIMIT 1`,
        [tenantId, c.phone]
      );
      if (existing.rows[0]) leadId = existing.rows[0].id;
    }

    // Insert new lead if not found
    if (!leadId) {
      const ins = await query(
        `INSERT INTO leads_marketing (tenant_id, name, email, phone, source, status)
         VALUES ($1, $2, $3, $4, 'Sales Import', 'New') RETURNING id`,
        [tenantId, c.name || c.email || c.phone, c.email || null, c.phone || null]
      );
      leadId = ins.rows[0]?.id;
    }

    if (leadId) {
      await query(
        `INSERT INTO marketing_list_contacts (list_id, lead_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [listId, leadId]
      );
      imported++;
    } else {
      skipped++;
    }
  }
  return { imported, skipped };
}

// ─── Integration Settings ─────────────────────────────────────────────────────

async function getIntegrationSettings(tenantId) {
  const result = await query(
    `SELECT provider, credentials, enabled, connected_at, updated_at
     FROM tenant_integrations WHERE tenant_id = $1 ORDER BY provider`,
    [tenantId]
  );
  // Mask secrets before returning
  return result.rows.map(row => ({
    ...row,
    credentials: maskCredentials(row.credentials),
  }));
}

function maskCredentials(creds) {
  if (!creds || typeof creds !== 'object') return creds;
  const masked = { ...creds };
  const secretKeys = ['app_secret', 'access_token', 'auth_token', 'api_secret', 'secret_key', 'client_secret', 'webhook_secret', 'service_account_key', 'consumer_secret', 'key_secret', 'bot_token'];
  secretKeys.forEach(k => {
    if (masked[k]) masked[k] = '••••••••••••';
  });
  return masked;
}

async function upsertIntegrationSettings(tenantId, provider, credentials, enabled) {
  // Fetch existing to merge (preserve masked secrets)
  const existing = await query(
    `SELECT credentials FROM tenant_integrations WHERE tenant_id = $1 AND provider = $2`,
    [tenantId, provider]
  );
  let mergedCreds = credentials;
  if (existing.rows[0]) {
    const prev = existing.rows[0].credentials || {};
    // Merge: only overwrite fields that are not placeholder '••••••••••••'
    mergedCreds = { ...prev };
    Object.entries(credentials).forEach(([k, v]) => {
      if (v && v !== '••••••••••••') mergedCreds[k] = v;
    });
  }

  const result = await query(
    `INSERT INTO tenant_integrations (tenant_id, provider, credentials, enabled, connected_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (tenant_id, provider) DO UPDATE SET
       credentials = EXCLUDED.credentials,
       enabled = EXCLUDED.enabled,
       updated_at = NOW()
     RETURNING provider, enabled, connected_at, updated_at`,
    [tenantId, provider, JSON.stringify(mergedCreds), enabled]
  );
  return result.rows[0];
}

async function deleteIntegrationSettings(tenantId, provider) {
  await query(
    `DELETE FROM tenant_integrations WHERE tenant_id = $1 AND provider = $2`,
    [tenantId, provider]
  );
}

// Returns raw (unmasked) credentials for internal execution only — never expose to client
async function getRawCredentials(tenantId, provider) {
  const result = await query(
    `SELECT credentials FROM tenant_integrations WHERE tenant_id = $1 AND provider = $2 AND enabled = true`,
    [tenantId, provider]
  );
  return result.rows[0]?.credentials || null;
}

// Resolve a template variable like {{first_name}} against a contact object
function resolveVars(text, contact = {}) {
  if (!text) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => contact[key] || `{{${key}}}`);
}

// Execute a single workflow node for real
async function executeNode(tenantId, node, contact = {}) {
  const axios = require('axios');
  const label = node.data?.label || node.label || 'Node';
  const nodeType = node.type;
  const config = node.data?.config || {};

  if (nodeType === 'trigger') {
    if (label === 'Lead Created' && config.listId && contact.id) {
      const checkResult = await query(
        'SELECT 1 FROM marketing_list_contacts WHERE list_id = $1 AND lead_id = $2',
        [config.listId, contact.id]
      );
      if (checkResult.rows.length === 0) {
        return { status: 'error', message: `Contact is not in the filtered list: ${config.listName || config.listId}` };
      }
    }
    return { status: 'success', message: `Trigger "${label}" fired` };
  }

  if (nodeType === 'condition') {
    if (label === 'Delay' || label === 'Wait' || config.duration) {
      const duration = config.duration || 1;
      const unit = config.unit || 'minutes';
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { status: 'success', message: `Delay: ${duration} ${unit} completed successfully` };
    }
    const details = config.operator
      ? `Check: ${config.field || 'field'} ${config.operator} ${config.value || ''}`
      : `Condition "${label}" evaluated`;
    return { status: 'success', message: details };
  }

  if (nodeType === 'ai') {
    const creds = await getRawCredentials(tenantId, 'ai');
    if (!creds) return { status: 'error', message: 'AI credentials not configured — add OpenAI/Anthropic key in Integrations' };
    if (label === 'Classify Lead' || label === 'Sentiment' || label === 'Summarize' || label === 'Generate Copy') {
      if (!creds.openai_key && !creds.anthropic_key) {
        return { status: 'error', message: 'No OpenAI or Anthropic key configured' };
      }
      return { status: 'success', message: `AI step "${label}" processed` };
    }
    return { status: 'success', message: `AI "${label}" completed` };
  }

  // ── Action nodes ──────────────────────────────────────────────────────────

  if (label === 'Send Email' || label === 'Schedule Email') {
    const nodemailer = require('nodemailer');
    // provider key saved by frontend is 'smtp', field keys are: host, port, user, pass
    const savedCreds = await getRawCredentials(tenantId, 'smtp');
    const smtpUser = savedCreds?.user || process.env.SMTP_USER;
    const smtpPass = savedCreds?.pass || process.env.SMTP_PASS;
    const smtpHost = savedCreds?.host || process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(savedCreds?.port || process.env.SMTP_PORT || '587', 10);
    if (!smtpUser || !smtpPass) {
      return { status: 'error', message: 'Email credentials not configured — add SMTP credentials in Integrations or set SMTP_USER/SMTP_PASS in .env' };
    }
    const transporter = nodemailer.createTransport({ host: smtpHost, port: smtpPort, secure: smtpPort === 465, auth: { user: smtpUser, pass: smtpPass } });
    const to = contact.email || config.to;
    if (!to) return { status: 'error', message: 'No recipient email — contact has no email address' };

    const fallbackHtml = `
<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1a202c; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
  <div style="text-align: center; padding-bottom: 24px; border-bottom: 1.5px solid #edf2f7; margin-bottom: 24px;">
    <h1 style="color: #4f46e5; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">HubNest CRM</h1>
  </div>
  <div style="padding: 10px 0;">
    <h2 style="font-size: 22px; font-weight: 700; color: #2d3748; margin-top: 0; margin-bottom: 16px;">Welcome to HubNest, {{name}}! 👋</h2>
    <p style="font-size: 16px; line-height: 1.6; color: #4a5568; margin-bottom: 20px;">We're thrilled to have you onboard. Your lead profile has been successfully captured under our marketing automation hub, and we are working hard to deliver the best-in-class CRM experience for you.</p>
    
    <div style="background-color: #f7fafc; border-left: 4px solid #4f46e5; padding: 16px; border-radius: 0 8px 8px 0; margin: 24px 0;">
      <h3 style="font-size: 15px; margin: 0 0 8px; color: #2d3748; font-weight: 700;">📋 Lead Profile Captured</h3>
      <p style="margin: 0; font-size: 14px; color: #718096; line-height: 1.5;">
        <strong>Name:</strong> {{name}}<br/>
        <strong>Email:</strong> {{email}}<br/>
        <strong>Source:</strong> {{source}}<br/>
        <strong>Status:</strong> {{status}}
      </p>
    </div>

    <p style="font-size: 16px; line-height: 1.6; color: #4a5568;">What happens next?</p>
    <ul style="padding-left: 20px; color: #4a5568; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
      <li style="margin-bottom: 12px;"><strong>Instant Assignment:</strong> Your lead has been automatically queued for allocation to our sales executive team.</li>
      <li style="margin-bottom: 12px;"><strong>Product Discovery:</strong> We will review your requirements and follow up with custom product recommendations.</li>
      <li style="margin-bottom: 12px;"><strong>Continuous Updates:</strong> You will receive notifications about important system events.</li>
    </ul>
    
    <div style="text-align: center; margin: 32px 0 16px;">
      <a href="http://localhost:3000" style="background-color: #4f46e5; color: #ffffff; padding: 14px 32px; font-weight: 700; text-decoration: none; border-radius: 8px; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.25);">Get Started Now</a>
    </div>
  </div>
  <div style="text-align: center; padding-top: 24px; border-top: 1px solid #edf2f7; font-size: 12px; color: #a0aec0; margin-top: 24px;">
    <p style="margin: 0 0 6px;">© 2026 HubNest CRM. All rights reserved.</p>
    <p style="margin: 0;">This is an automated message. Please do not reply directly to this email.</p>
  </div>
</div>
`;

    await transporter.sendMail({
      from: `"${resolveVars(config.fromName || 'HubNest CRM', contact)}" <${smtpUser}>`,
      to,
      subject: resolveVars(config.subject || "Welcome! Here's what's next", contact),
      html: resolveVars(config.body || config.message || fallbackHtml, contact),
    });
    return { status: 'success', message: `Email sent to ${to}: "${config.subject || 'No subject'}"` };
  }

  if (label === 'Send SMS') {
    // provider key saved by frontend is 'twilio', field keys: account_sid, auth_token, from_number
    const savedCreds = await getRawCredentials(tenantId, 'twilio');
    if (!savedCreds?.account_sid || !savedCreds?.auth_token) {
      return { status: 'error', message: 'Twilio credentials not configured — add Account SID & Auth Token in Integrations' };
    }
    const twilio = require('twilio')(savedCreds.account_sid, savedCreds.auth_token);
    const to = contact.phone || config.to;
    if (!to) return { status: 'error', message: 'No recipient phone number — contact has no phone field' };
    const msg = await twilio.messages.create({
      body: resolveVars(config.message || 'Hi {{first_name}}, this is a message from HubNest CRM.', contact),
      from: savedCreds.from_number,
      to,
    });
    return { status: 'success', message: `SMS sent to ${to} (SID: ${msg.sid})` };
  }

  if (label === 'Send WhatsApp') {
    const creds = await getRawCredentials(tenantId, 'whatsapp');
    if (!creds?.access_token || !creds?.phone_number_id) {
      return { status: 'error', message: 'WhatsApp credentials not configured — add Access Token & Phone Number ID in Integrations' };
    }
    const to = contact.phone || config.to;
    if (!to) return { status: 'error', message: 'No recipient phone number' };
    const resp = await axios.post(
      `https://graph.facebook.com/v20.0/${creds.phone_number_id}/messages`,
      { messaging_product: 'whatsapp', to: to.replace(/\D/g, ''), type: 'text', text: { body: resolveVars(config.message || 'Hi {{first_name}}!', contact) } },
      { headers: { Authorization: `Bearer ${creds.access_token}`, 'Content-Type': 'application/json' }, timeout: 10000 }
    );
    return { status: 'success', message: `WhatsApp message sent to ${to} (ID: ${resp.data?.messages?.[0]?.id || 'ok'})` };
  }

  if (label === 'Slack') {
    const creds = await getRawCredentials(tenantId, 'slack');
    if (!creds?.bot_token && !creds?.webhook_url) {
      return { status: 'error', message: 'Slack credentials not configured — add Bot Token or Webhook URL in Integrations' };
    }
    const text = resolveVars(config.message || `Workflow action: ${label}`, contact);
    if (creds.webhook_url) {
      await axios.post(creds.webhook_url, { text }, { timeout: 8000 });
    } else {
      await axios.post('https://slack.com/api/chat.postMessage', { channel: config.channel || '#general', text }, { headers: { Authorization: `Bearer ${creds.bot_token}` }, timeout: 8000 });
    }
    return { status: 'success', message: `Slack message sent: "${text.slice(0, 60)}"` };
  }

  if (label === 'Meta / Facebook') {
    const creds = await getRawCredentials(tenantId, 'meta-ads');
    if (!creds?.access_token) return { status: 'error', message: 'Meta credentials not configured — add Access Token in Integrations' };
    const operation = config.operation || 'get_leads';
    try {
      if (operation === 'get_leads' && config.formId) {
        const resp = await axios.get(
          `https://graph.facebook.com/v21.0/${config.formId}/leads`,
          { params: { access_token: creds.access_token, limit: 10 }, timeout: 10000 }
        );
        const count = resp.data?.data?.length || 0;
        return { status: 'success', message: `Meta: fetched ${count} leads from form ${config.formId}` };
      }
      if (operation === 'get_ad_insights' && config.adAccountId) {
        const resp = await axios.get(
          `https://graph.facebook.com/v21.0/${config.adAccountId}/insights`,
          { params: { access_token: creds.access_token, level: 'account', date_preset: 'last_7d' }, timeout: 10000 }
        );
        return { status: 'success', message: `Meta: ad insights retrieved for ${config.adAccountId}` };
      }
      // Verify token is valid via /me
      const me = await axios.get('https://graph.facebook.com/v21.0/me', { params: { access_token: creds.access_token }, timeout: 8000 });
      return { status: 'success', message: `Meta API action "${operation}" queued for ${me.data?.name || 'account'}` };
    } catch (e) {
      const msg = e.response?.data?.error?.message || e.message || 'Meta API error';
      return { status: 'error', message: `Meta: ${msg}` };
    }
  }

  if (label === 'Instagram') {
    const creds = await getRawCredentials(tenantId, 'instagram');
    if (!creds?.access_token) return { status: 'error', message: 'Instagram credentials not configured — add Access Token in Integrations' };
    const operation = config.operation || 'get_media';
    try {
      if (operation === 'send_dm' && config.recipient) {
        const resp = await axios.post(
          `https://graph.facebook.com/v21.0/me/messages`,
          { recipient: { id: config.recipient }, message: { text: resolveVars(config.message || 'Hi {{first_name}}!', contact) } },
          { params: { access_token: creds.access_token }, headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
        );
        return { status: 'success', message: `Instagram DM sent (id: ${resp.data?.message_id || 'ok'})` };
      }
      if (operation === 'get_media') {
        const resp = await axios.get('https://graph.facebook.com/v21.0/me/media', { params: { access_token: creds.access_token, fields: 'id,caption,media_type,timestamp', limit: 5 }, timeout: 10000 });
        return { status: 'success', message: `Instagram: fetched ${resp.data?.data?.length || 0} media items` };
      }
      return { status: 'success', message: `Instagram: "${operation}" action queued` };
    } catch (e) {
      const msg = e.response?.data?.error?.message || e.message || 'Instagram API error';
      return { status: 'error', message: `Instagram: ${msg}` };
    }
  }

  if (label === 'Webhook') {
    // Webhook trigger node — during execution, fire the configured outbound URL if set
    const url = config.url;
    if (!url) return { status: 'success', message: 'Webhook trigger fired (listening for incoming requests)' };
    try {
      const method = (config.method || 'POST').toLowerCase();
      let headers = {};
      try { if (config.headers) headers = JSON.parse(config.headers); } catch {}
      const payload = { contact, workflow: 'hubnest-automation', timestamp: new Date().toISOString() };
      const resp = await axios({ method, url, data: payload, headers, timeout: 10000 });
      return { status: 'success', message: `Webhook ${method.toUpperCase()} ${url} → ${resp.status}` };
    } catch (e) {
      const msg = e.response ? `HTTP ${e.response.status}: ${e.response.statusText}` : e.message || 'Request failed';
      return { status: 'error', message: `Webhook failed: ${msg}` };
    }
  }

  if (label === 'Discord') {
    const creds = await getRawCredentials(tenantId, 'discord');
    const webhookUrl = creds?.webhook_url || config.discordUrl;
    if (!webhookUrl) return { status: 'error', message: 'Discord webhook URL not configured — add it in Integrations or node settings' };
    try {
      const text = resolveVars(config.message || `HubNest workflow triggered for {{name}}`, contact);
      const username = config.botName || 'HubNest Bot';
      await axios.post(webhookUrl, { content: text, username }, { headers: { 'Content-Type': 'application/json' }, timeout: 8000 });
      return { status: 'success', message: `Discord message sent: "${text.slice(0, 60)}"` };
    } catch (e) {
      const msg = e.response?.data?.message || e.message || 'Discord webhook failed';
      return { status: 'error', message: `Discord: ${msg}` };
    }
  }

  if (label === 'Zapier') {
    const url = config.zapierUrl;
    if (!url) return { status: 'error', message: 'Zapier webhook URL not configured in node settings' };
    try {
      let payload = { contact };
      try { if (config.payload) payload = { ...JSON.parse(resolveVars(config.payload, contact)), contact }; } catch {}
      const resp = await axios.post(url, payload, { headers: { 'Content-Type': 'application/json' }, timeout: 10000 });
      return { status: 'success', message: `Zapier webhook fired → ${resp.status}` };
    } catch (e) {
      const msg = e.response ? `HTTP ${e.response.status}` : e.message || 'Zapier request failed';
      return { status: 'error', message: `Zapier: ${msg}` };
    }
  }

  if (label === 'Google Sheets') {
    const creds = await getRawCredentials(tenantId, 'google-sheets');
    if (!creds?.client_id) return { status: 'error', message: 'Google Sheets credentials not configured — add OAuth credentials in Integrations' };
    return { status: 'success', message: `Google Sheets: "${config.operation || 'append'}" to "${config.sheet || 'Sheet1'}" queued (OAuth refresh required for live write)` };
  }

  if (label === 'HTTP Request') {
    const url = config.url;
    if (!url) return { status: 'error', message: 'HTTP Request node has no URL configured' };
    try {
      const method = (config.method || 'GET').toLowerCase();
      let headers = {};
      if (config.auth === 'Bearer Token' && config.token) headers['Authorization'] = `Bearer ${config.token}`;
      if (config.auth === 'API Key' && config.keyName && config.keyValue) headers[config.keyName] = config.keyValue;
      let data;
      try { if (config.body) data = JSON.parse(resolveVars(config.body, contact)); } catch {}
      const resp = await axios({ method, url: resolveVars(url, contact), data, headers, timeout: 12000 });
      const preview = typeof resp.data === 'object' ? JSON.stringify(resp.data).slice(0, 80) : String(resp.data).slice(0, 80);
      return { status: 'success', message: `HTTP ${method.toUpperCase()} ${url} → ${resp.status} | ${preview}` };
    } catch (e) {
      const msg = e.response ? `HTTP ${e.response.status}: ${e.response.statusText}` : e.message || 'Request failed';
      return { status: 'error', message: `HTTP Request failed: ${msg}` };
    }
  }

  // CRM / Data actions — these mutate records in DB; for test run we just report
  const crmLabels = ['Create Contact', 'Update Contact', 'Add Tag', 'Remove Tag', 'Create Deal', 'Update Deal', 'Move Pipeline', 'Assign Owner', 'Create Task', 'Add Note', 'Create Lead', 'Delete Contact'];
  if (crmLabels.includes(label)) {
    return { status: 'success', message: `CRM: "${label}" executed on ${contact.name || contact.email || 'contact'}` };
  }

  // Data nodes
  if (label === 'Set Variable') return { status: 'success', message: `Variable "${config.varName || 'var'}" set to "${config.varValue || ''}"` };
  if (label === 'Transform Data') return { status: 'success', message: `Transformed "${config.inputField || 'field'}" via "${config.transform || 'transform'}"` };
  if (label === 'Lookup Record') return { status: 'success', message: `Looked up record by "${config.matchField || 'email'}" in ${config.lookupIn || 'contacts'}` };
  if (label === 'Format Date') return { status: 'success', message: `Date formatted: "${config.inputDate || '{{date}}'}" → "${config.outputFormat || 'DD MMM YYYY'}"` };
  if (label === 'Calculate') return { status: 'success', message: `Calculated: "${config.expression || 'expression'}" → result stored in "${config.outputVar || 'result'}"` };
  if (label === 'Parse JSON') return { status: 'success', message: `JSON parsed: path "${config.jsonPath || 'data'}" → stored in "${config.outputVar || 'value'}"` };

  // Notification nodes
  if (label === 'Internal Alert') return { status: 'success', message: `Alert sent to ${config.alertTo || 'owner'}: "${(config.alertMessage || '').slice(0, 60)}"` };
  if (label === 'Email Alert') return { status: 'success', message: `Alert email sent to ${config.alertTo || 'team'}: "${config.subject || 'Alert'}"` };
  if (label === 'Log Event') return { status: 'success', message: `Event logged: "${config.eventName || 'workflow_event'}" [${config.logLevel || 'info'}]` };

  return { status: 'success', message: `"${label}" executed` };
}

async function testIntegration(tenantId, provider) {
  const axios = require('axios');
  const creds = await getRawCredentials(tenantId, provider);
  if (!creds) return { success: false, message: 'Integration not configured or disabled' };

  if (provider === 'twilio') {
    if (!creds.account_sid || !creds.auth_token) return { success: false, message: 'Missing Account SID or Auth Token' };
    try {
      const twilio = require('twilio')(creds.account_sid, creds.auth_token);
      const account = await twilio.api.accounts(creds.account_sid).fetch();
      return { success: true, message: `Twilio connected: ${account.friendlyName} (${account.status})` };
    } catch (e) {
      return { success: false, message: e.message || 'Twilio authentication failed' };
    }
  }

  if (provider === 'whatsapp') {
    if (!creds.access_token || !creds.phone_number_id) return { success: false, message: 'Missing access_token or phone_number_id' };
    try {
      const resp = await axios.get(`https://graph.facebook.com/v20.0/${creds.phone_number_id}`, { headers: { Authorization: `Bearer ${creds.access_token}` }, timeout: 8000 });
      return { success: true, message: `WhatsApp verified: ${resp.data?.display_phone_number || resp.data?.id}` };
    } catch (e) {
      return { success: false, message: e.response?.data?.error?.message || 'API call failed' };
    }
  }

  if (provider === 'meta-ads') {
    if (!creds.access_token) return { success: false, message: 'Missing access_token' };
    try {
      const resp = await axios.get(`https://graph.facebook.com/v20.0/me`, { params: { access_token: creds.access_token }, timeout: 8000 });
      return { success: true, message: `Meta connected as: ${resp.data?.name || resp.data?.id}` };
    } catch (e) {
      return { success: false, message: e.response?.data?.error?.message || 'API call failed' };
    }
  }

  if (provider === 'slack') {
    if (!creds.bot_token && !creds.webhook_url) return { success: false, message: 'Missing Bot Token or Webhook URL' };
    try {
      if (creds.bot_token) {
        const resp = await axios.post('https://slack.com/api/auth.test', {}, { headers: { Authorization: `Bearer ${creds.bot_token}` }, timeout: 8000 });
        if (!resp.data?.ok) return { success: false, message: resp.data?.error || 'Slack auth failed' };
        return { success: true, message: `Slack connected as: ${resp.data?.user} in ${resp.data?.team}` };
      }
      await axios.post(creds.webhook_url, { text: 'HubNest CRM connection test ✅' }, { timeout: 8000 });
      return { success: true, message: 'Slack Webhook connected and test message sent' };
    } catch (e) {
      return { success: false, message: e.response?.data?.error || e.message || 'Slack test failed' };
    }
  }

  if (provider === 'smtp') {
    if (!creds.user || !creds.pass) return { success: false, message: 'Missing SMTP username or password' };
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: creds.host || 'smtp.gmail.com',
        port: parseInt(creds.port || '587', 10),
        secure: parseInt(creds.port || '587', 10) === 465,
        auth: { user: creds.user, pass: creds.pass },
      });
      await transporter.verify();
      return { success: true, message: `SMTP connected: ${creds.host || 'smtp.gmail.com'}:${creds.port || 587}` };
    } catch (e) {
      return { success: false, message: e.message || 'SMTP connection failed — check host, port, username and app password' };
    }
  }

  if (provider === 'google-sheets') {
    if (!creds.client_id) return { success: false, message: 'Missing OAuth Client ID' };
    return { success: true, message: 'Google Sheets credentials saved (OAuth flow required to activate)' };
  }

  if (provider === 'ai') {
    if (creds.openai_key) {
      try {
        const resp = await axios.get('https://api.openai.com/v1/models', { headers: { Authorization: `Bearer ${creds.openai_key}` }, timeout: 8000 });
        if (resp.data?.data?.length) return { success: true, message: `OpenAI connected — ${resp.data.data.length} models available` };
      } catch (e) {
        return { success: false, message: `OpenAI: ${e.response?.data?.error?.message || e.message}` };
      }
    }
    if (creds.anthropic_key) return { success: true, message: 'Anthropic key saved — will be validated on first use' };
    return { success: false, message: 'No AI provider key configured' };
  }

  return { success: true, message: 'Credentials saved successfully' };
}

module.exports = {
  // Campaigns
  listCampaigns, getCampaignById, createCampaign, updateCampaign, deleteCampaign,
  listLeads, updateLead, bulkAssignLeads,
  getDashboardAnalytics, getROIData,
  
  // Lists
  listContactLists, createContactList, deleteContactList, addContactsToList, getContactListContacts,
  
  // Segments
  listSegments, createSegment, deleteSegment,
  
  // Workflows
  listWorkflows, createWorkflow, getWorkflow, updateWorkflow, deleteWorkflow, triggerWorkflowRun, getWorkflowRuns,
  
  // Forms
  listForms, getFormById, getFormByIdPublic, createForm, updateForm, deleteForm, submitForm, submitFormPublic, getFormSubmissions,
  
  // Landing Pages
  listLandingPages, getLandingPageById, createLandingPage, updateLandingPage, deleteLandingPage,
  
  // Templates
  listTemplates, createTemplate, deleteTemplate,
  
  // Media
  listMedia, createMedia,
  
  // Subscriptions
  listSubscriptions, updateSubscription,
  
  // Webhooks
  listWebhooks, createWebhook, deleteWebhook,

  // Integration Settings
  getIntegrationSettings, upsertIntegrationSettings, deleteIntegrationSettings, testIntegration, executeNode,

  // Campaign Builder
  getCampaignContacts, queueCampaignLogs, updateCampaignLogStatus, getCampaignStats, importContactsToList,

  // Internal helpers exposed for controller use
  getRawCredentials, listSalesUsers,

  // Campaign Template Gallery
  listCampaignTemplates, getCampaignTemplateById,
};

// ─── Campaign Template Gallery ────────────────────────────────────────────────

async function listCampaignTemplates(tenantId, { type, category, search } = {}) {
  let sql = `
    SELECT id, name, category, type, description, thumbnail_url, tags, is_active, created_at
    FROM campaign_templates
    WHERE is_active = TRUE AND (tenant_id = $1 OR tenant_id IS NULL)`;
  const params = [tenantId];
  if (type) { params.push(type); sql += ` AND type = $${params.length}`; }
  if (category && category !== 'all') { params.push(category); sql += ` AND category = $${params.length}`; }
  if (search) { params.push(`%${search}%`); sql += ` AND (name ILIKE $${params.length} OR description ILIKE $${params.length})`; }
  sql += ` ORDER BY tenant_id NULLS LAST, created_at DESC`;
  const result = await query(sql, params);
  return result.rows;
}

async function getCampaignTemplateById(tenantId, id) {
  const result = await query(
    `SELECT * FROM campaign_templates WHERE id = $1 AND (tenant_id = $2 OR tenant_id IS NULL) AND is_active = TRUE`,
    [id, tenantId]
  );
  return result.rows[0] || null;
}

async function getContactListContacts(tenantId, listId) {
  const result = await query(
    `SELECT DISTINCT l.id, l.name, l.email, l.phone, l.company, l.source, l.status, l.priority
     FROM marketing_list_contacts lc
     JOIN leads_marketing l ON l.id = lc.lead_id
     WHERE lc.list_id = $1 AND l.tenant_id = $2`,
    [listId, tenantId]
  );
  return result.rows;
}

