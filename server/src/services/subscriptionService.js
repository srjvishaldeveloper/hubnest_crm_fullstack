const { query, pool } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Check whether a tenant can add more of a given resource.
 * Returns { allowed, current, limit, remaining }.
 * limit = -1 means unlimited.
 */
async function checkLimit(tenantId, resource) {
  try {
    // Get the tenant's active plan limits for the resource
    const limitResult = await query(
      `SELECT pl.max_count
       FROM plan_limits pl
       JOIN tenant_subscriptions ts ON ts.plan_id = pl.plan_id
       WHERE ts.tenant_id = $1
         AND ts.status = 'active'
         AND pl.resource = $2
       LIMIT 1`,
      [tenantId, resource]
    );

    // If no subscription or no limit row, deny by default
    if (limitResult.rows.length === 0) {
      logger.warn('No plan limit found for resource', { tenantId, resource });
      return { allowed: false, current: 0, limit: 0, remaining: 0 };
    }

    const maxCount = limitResult.rows[0].max_count;

    // -1 means unlimited
    if (maxCount === -1) {
      const usageResult = await query(
        `SELECT current_count FROM usage_tracking
         WHERE tenant_id = $1 AND resource = $2`,
        [tenantId, resource]
      );
      const current = usageResult.rows.length > 0 ? usageResult.rows[0].current_count : 0;
      return { allowed: true, current, limit: -1, remaining: -1 };
    }

    // Get current usage
    const usageResult = await query(
      `SELECT current_count FROM usage_tracking
       WHERE tenant_id = $1 AND resource = $2`,
      [tenantId, resource]
    );
    const current = usageResult.rows.length > 0 ? usageResult.rows[0].current_count : 0;
    const remaining = maxCount - current;

    return {
      allowed: current < maxCount,
      current,
      limit: maxCount,
      remaining: remaining > 0 ? remaining : 0,
    };
  } catch (err) {
    logger.error('Failed to check plan limit', { tenantId, resource, message: err.message });
    throw err;
  }
}

/**
 * Check whether a tenant and department can add a specific amount of storage (in bytes).
 */
async function checkStorageLimit(tenantId, departmentId, bytesToAdd) {
  try {
    // 1. Check Tenant global limit
    const globalCheck = await checkLimit(tenantId, 'storage_bytes');
    if (!globalCheck.allowed || (globalCheck.limit !== -1 && globalCheck.current + bytesToAdd > globalCheck.limit)) {
      return { allowed: false, reason: 'Tenant storage limit exceeded', current: globalCheck.current, limit: globalCheck.limit };
    }

    // 2. Check Department limit (if departmentId is provided)
    if (departmentId) {
      const deptResult = await query(
        `SELECT storage_quota, storage_used FROM org_departments WHERE id = $1 AND tenant_id = $2`,
        [departmentId, tenantId]
      );
      if (deptResult.rows.length > 0) {
        const { storage_quota, storage_used } = deptResult.rows[0];
        // Quota of 0 means no department-specific limit (unlimited within tenant), 
        // but if they set it > 0, we check it.
        const quota = parseInt(storage_quota, 10);
        const used = parseInt(storage_used, 10);
        
        if (quota > 0 && (used + bytesToAdd) > quota) {
          return { allowed: false, reason: 'Department storage limit exceeded', current: used, limit: quota };
        }
      }
    }

    return { allowed: true };
  } catch (err) {
    logger.error('Failed to check storage limit', { tenantId, departmentId, message: err.message });
    throw err;
  }
}

/**
 * Return current usage vs limits for every resource on the tenant's plan.
 */
async function getUsage(tenantId) {
  try {
    const result = await query(
      `SELECT pl.resource,
              pl.max_count AS "limit",
              COALESCE(ut.current_count, 0) AS current
       FROM plan_limits pl
       JOIN tenant_subscriptions ts ON ts.plan_id = pl.plan_id
       LEFT JOIN usage_tracking ut  ON ut.tenant_id = ts.tenant_id AND ut.resource = pl.resource
       WHERE ts.tenant_id = $1
         AND ts.status = 'active'
       ORDER BY pl.resource`,
      [tenantId]
    );

    return result.rows.map((row) => ({
      resource: row.resource,
      current: row.current,
      limit: row.limit,
      remaining: row.limit === -1 ? -1 : Math.max(0, row.limit - row.current),
      unlimited: row.limit === -1,
    }));
  } catch (err) {
    logger.error('Failed to get usage', { tenantId, message: err.message });
    throw err;
  }
}

/**
 * Increment (or decrement) a resource counter for a tenant.
 * delta can be positive or negative.
 */
async function trackUsage(tenantId, resource, delta = 1) {
  try {
    const result = await query(
      `INSERT INTO usage_tracking (tenant_id, resource, current_count, last_updated)
       VALUES ($1, $2, GREATEST(0, $3), NOW())
       ON CONFLICT (tenant_id, resource)
       DO UPDATE SET current_count = GREATEST(0, usage_tracking.current_count + $3),
                     last_updated  = NOW()
       RETURNING current_count`,
      [tenantId, resource, delta]
    );

    const newCount = result.rows[0].current_count;
    logger.debug('Usage tracked', { tenantId, resource, delta, newCount });
    return newCount;
  } catch (err) {
    logger.error('Failed to track usage', { tenantId, resource, delta, message: err.message });
    throw err;
  }
}

/**
 * Increment storage usage for a tenant and optionally a department.
 */
async function trackStorageUsage(tenantId, departmentId, deltaBytes) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Track globally in usage_tracking
    await client.query(
      `INSERT INTO usage_tracking (tenant_id, resource, current_count, last_updated)
       VALUES ($1, 'storage_bytes', GREATEST(0, $2), NOW())
       ON CONFLICT (tenant_id, resource)
       DO UPDATE SET current_count = GREATEST(0, usage_tracking.current_count + $2),
                     last_updated  = NOW()`,
      [tenantId, deltaBytes]
    );

    // Track locally in department
    if (departmentId) {
      await client.query(
        `UPDATE org_departments 
         SET storage_used = GREATEST(0, storage_used + $1), updated_at = NOW()
         WHERE id = $2 AND tenant_id = $3`,
        [deltaBytes, departmentId, tenantId]
      );
    }
    
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Failed to track storage usage', { tenantId, departmentId, deltaBytes, message: err.message });
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Get the tenant's current active subscription with plan details and all limits.
 */
async function getTenantPlan(tenantId) {
  try {
    const subResult = await query(
      `SELECT ts.id           AS subscription_id,
              ts.status        AS subscription_status,
              ts.billing_cycle,
              ts.started_at,
              ts.expires_at,
              sp.id            AS plan_id,
              sp.name          AS plan_name,
              sp.slug          AS plan_slug,
              sp.description,
              sp.price_monthly,
              sp.price_yearly,
              sp.features
       FROM tenant_subscriptions ts
       JOIN subscription_plans sp ON sp.id = ts.plan_id
       WHERE ts.tenant_id = $1
         AND ts.status = 'active'
       ORDER BY ts.created_at DESC
       LIMIT 1`,
      [tenantId]
    );

    if (subResult.rows.length === 0) {
      return null;
    }

    const subscription = subResult.rows[0];

    // Fetch limits for this plan
    const limitsResult = await query(
      `SELECT resource, max_count FROM plan_limits WHERE plan_id = $1 ORDER BY resource`,
      [subscription.plan_id]
    );

    return {
      subscription_id: subscription.subscription_id,
      subscription_status: subscription.subscription_status,
      billing_cycle: subscription.billing_cycle,
      started_at: subscription.started_at,
      expires_at: subscription.expires_at,
      plan: {
        id: subscription.plan_id,
        name: subscription.plan_name,
        slug: subscription.plan_slug,
        description: subscription.description,
        price_monthly: subscription.price_monthly,
        price_yearly: subscription.price_yearly,
        features: subscription.features,
      },
      limits: limitsResult.rows.reduce((acc, row) => {
        acc[row.resource] = row.max_count;
        return acc;
      }, {}),
    };
  } catch (err) {
    logger.error('Failed to get tenant plan', { tenantId, message: err.message });
    throw err;
  }
}

/**
 * Return all active subscription plans with their limits.
 */
async function getAvailablePlans() {
  try {
    const plansResult = await query(
      `SELECT id, name, slug, description, price_monthly, price_yearly, features, sort_order
       FROM subscription_plans
       WHERE is_active = TRUE
       ORDER BY sort_order ASC`
    );

    const plans = [];
    for (const plan of plansResult.rows) {
      const limitsResult = await query(
        `SELECT resource, max_count FROM plan_limits WHERE plan_id = $1 ORDER BY resource`,
        [plan.id]
      );

      plans.push({
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
        description: plan.description,
        price_monthly: plan.price_monthly,
        price_yearly: plan.price_yearly,
        features: plan.features,
        sort_order: plan.sort_order,
        limits: limitsResult.rows.reduce((acc, row) => {
          acc[row.resource] = row.max_count;
          return acc;
        }, {}),
      });
    }

    return plans;
  } catch (err) {
    logger.error('Failed to get available plans', { message: err.message });
    throw err;
  }
}

/**
 * Assign a plan to a tenant (or upgrade/downgrade).
 * Deactivates any existing active subscription first.
 */
async function assignPlan(tenantId, planSlug, billingCycle = 'monthly') {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Resolve plan
    const planResult = await client.query(
      `SELECT id FROM subscription_plans WHERE slug = $1 AND is_active = TRUE`,
      [planSlug]
    );
    if (planResult.rows.length === 0) {
      throw Object.assign(new Error('Plan not found or inactive'), { statusCode: 404 });
    }
    const planId = planResult.rows[0].id;

    // Cancel any existing active subscription
    await client.query(
      `UPDATE tenant_subscriptions
       SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW()
       WHERE tenant_id = $1 AND status = 'active'`,
      [tenantId]
    );

    // Calculate expiry
    const expiresAt = billingCycle === 'yearly'
      ? `NOW() + INTERVAL '1 year'`
      : `NOW() + INTERVAL '1 month'`;

    // Create new subscription
    const subResult = await client.query(
      `INSERT INTO tenant_subscriptions (tenant_id, plan_id, status, billing_cycle, started_at, expires_at)
       VALUES ($1, $2, 'active', $3, NOW(), ${expiresAt})
       RETURNING id`,
      [tenantId, planId, billingCycle]
    );

    await client.query('COMMIT');

    logger.info('Plan assigned to tenant', { tenantId, planSlug, billingCycle, subscriptionId: subResult.rows[0].id });
    return { subscriptionId: subResult.rows[0].id };
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Failed to assign plan', { tenantId, planSlug, message: err.message });
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  checkLimit,
  checkStorageLimit,
  getUsage,
  trackUsage,
  trackStorageUsage,
  getTenantPlan,
  getAvailablePlans,
  assignPlan,
};
