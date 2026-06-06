const { query } = require('../../config/database');

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
  const { name, type, platform, budget_daily, budget_total, start_date, end_date, status, target_audience, content } = data;
  const result = await query(
    `INSERT INTO campaigns (tenant_id, name, type, platform, budget_daily, budget_total,
       start_date, end_date, status, target_audience, content, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING *`,
    [tenantId, name, type, platform, budget_daily || 0, budget_total || 0,
     start_date || null, end_date || null, status || 'Draft',
     JSON.stringify(target_audience || {}), JSON.stringify(content || {}), userId]
  );
  return result.rows[0];
}

async function updateCampaign(tenantId, id, data) {
  const fields = ['name','type','platform','budget_daily','budget_total','start_date','end_date','status','target_audience','content'];
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

module.exports = {
  listCampaigns, getCampaignById, createCampaign, updateCampaign, deleteCampaign,
  listLeads, updateLead, bulkAssignLeads,
  getDashboardAnalytics, getROIData,
};
