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
  const fields = ['name','type','platform','budget_daily','budget_total','start_date','end_date','status','target_audience','content','parent_campaign_id','channels','schedule_config','ab_test_config'];
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

async function createWorkflow(tenantId, userId, { name, description, trigger_config, nodes, edges, status }) {
  const result = await query(
    `INSERT INTO marketing_workflows (tenant_id, name, description, trigger_config, nodes, edges, status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [tenantId, name, description, JSON.stringify(trigger_config || {}), JSON.stringify(nodes || []), JSON.stringify(edges || []), status || 'Draft', userId]
  );
  return result.rows[0];
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
     JOIN leads_marketing l ON l.id = r.lead_id
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
  let sql = `SELECT l.*, c.name AS campaign_name
             FROM leads_marketing l
             LEFT JOIN campaigns c ON c.id = l.campaign_id
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
  const { status, assigned_to, quality_score } = data;
  const updates = [];
  const params = [];
  if (status !== undefined) { params.push(status); updates.push(`status = $${params.length}`); }
  if (assigned_to !== undefined) { params.push(assigned_to); updates.push(`assigned_to = $${params.length}`); }
  if (quality_score !== undefined) { params.push(quality_score); updates.push(`quality_score = $${params.length}`); }
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

async function bulkAssignLeads(tenantId, leadIds, assignedTo) {
  await query(
    `UPDATE leads_marketing SET assigned_to = $1, updated_at = NOW()
     WHERE id = ANY($2::uuid[]) AND tenant_id = $3`,
    [assignedTo, leadIds, tenantId]
  );
  return { assigned: leadIds.length };
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
  // Get contacts linked via campaign list_id stored in content JSONB
  const result = await query(
    `SELECT DISTINCT l.id, l.name, l.email, l.phone
     FROM campaigns c
     JOIN marketing_list_contacts lc ON lc.list_id = (c.content->>'list_id')::uuid
     JOIN leads_marketing l ON l.id = lc.lead_id
     WHERE c.id = $1 AND c.tenant_id = $2 AND l.email IS NOT NULL`,
    [campaignId, tenantId]
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
    const ins = await query(
      `INSERT INTO leads_marketing (tenant_id, name, email, phone, source, status)
       VALUES ($1, $2, $3, $4, 'CSV Import', 'New')
       ON CONFLICT DO NOTHING RETURNING id`,
      [tenantId, c.name || c.email || c.phone, c.email || null, c.phone || null]
    );
    if (ins.rows[0]) {
      await query(
        `INSERT INTO marketing_list_contacts (list_id, lead_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [listId, ins.rows[0].id]
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

async function testIntegration(tenantId, provider) {
  const result = await query(
    `SELECT credentials FROM tenant_integrations WHERE tenant_id = $1 AND provider = $2 AND enabled = true`,
    [tenantId, provider]
  );
  if (!result.rows[0]) return { success: false, message: 'Integration not configured or disabled' };
  const creds = result.rows[0].credentials;

  if (provider === 'whatsapp') {
    if (!creds.access_token || !creds.phone_number_id) {
      return { success: false, message: 'Missing access_token or phone_number_id' };
    }
    // Real ping to Meta Graph API
    try {
      const axios = require('axios');
      const resp = await axios.get(
        `https://graph.facebook.com/v20.0/${creds.phone_number_id}`,
        { headers: { Authorization: `Bearer ${creds.access_token}` }, timeout: 8000 }
      );
      return { success: true, message: 'WhatsApp Business account verified', detail: resp.data?.display_phone_number || '' };
    } catch (e) {
      return { success: false, message: e.response?.data?.error?.message || 'API call failed' };
    }
  }

  if (provider === 'meta-ads') {
    if (!creds.access_token) return { success: false, message: 'Missing access_token' };
    try {
      const axios = require('axios');
      const resp = await axios.get(
        `https://graph.facebook.com/v20.0/me`,
        { params: { access_token: creds.access_token }, timeout: 8000 }
      );
      return { success: true, message: `Connected as: ${resp.data?.name || resp.data?.id}` };
    } catch (e) {
      return { success: false, message: e.response?.data?.error?.message || 'API call failed' };
    }
  }

  return { success: true, message: 'Credentials saved (live test not available for this provider)' };
}

module.exports = {
  // Campaigns
  listCampaigns, getCampaignById, createCampaign, updateCampaign, deleteCampaign,
  listLeads, updateLead, bulkAssignLeads,
  getDashboardAnalytics, getROIData,
  
  // Lists
  listContactLists, createContactList, deleteContactList, addContactsToList,
  
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
  getIntegrationSettings, upsertIntegrationSettings, deleteIntegrationSettings, testIntegration,

  // Campaign Builder
  getCampaignContacts, queueCampaignLogs, getCampaignStats, importContactsToList,

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
