const express = require('express');
const router = express.Router();
const axios = require('axios');
const { encrypt } = require('../../utils/encryption');
const { query } = require('../../config/database');
const { sendSuccess, sendError } = require('../../utils/helpers');
const { authenticate } = require('../../middleware/auth');
const { verifyTenantOwnership } = require('../../middleware/rbac');

// Connect and Status settings routes require Tenant Admin auth + Ownership check
router.use(authenticate);
router.use(verifyTenantOwnership);

router.post('/connect', async (req, res) => {
  const tenantId = req.user.tenant_id;
  const { gateway, keyId, keySecret, publishableKey, webhookSecret } = req.body;

  if (!gateway || !['razorpay', 'stripe'].includes(gateway)) {
    return sendError(res, 'Invalid gateway specified', 400);
  }
  if (!keySecret) {
    return sendError(res, 'Key secret is required', 400);
  }

  let isVerified = false;

  try {
    // 1. Verify credentials by making test API call via Axios
    if (gateway === 'stripe') {
      try {
        const stripeRes = await axios.get('https://api.stripe.com/v1/payment_intents', {
          headers: { Authorization: `Bearer ${keySecret}` },
          params: { limit: 1 },
          timeout: 8000,
          validateStatus: () => true
        });
        if (stripeRes.status === 401 || stripeRes.status === 403) {
          return sendError(res, 'Invalid Stripe credentials. Please check your Secret Key.', 422);
        }
        isVerified = true;
      } catch (err) {
        isVerified = false;
      }
    } else if (gateway === 'razorpay') {
      if (!keyId) {
        return sendError(res, 'Key ID is required for Razorpay', 400);
      }
      try {
        const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
        const rzpRes = await axios.get('https://api.razorpay.com/v1/orders', {
          headers: { Authorization: `Basic ${auth}` },
          params: { count: 1 },
          timeout: 8000,
          validateStatus: () => true // never throw on HTTP status
        });
        // Only reject on explicit auth failures — 400/404/network errors are fine for test accounts
        if (rzpRes.status === 401 || rzpRes.status === 403) {
          return sendError(res, 'Invalid Razorpay credentials. Please check your Key ID and Secret.', 422);
        }
        isVerified = true;
      } catch (err) {
        // Network/timeout error — save anyway, mark unverified
        isVerified = false;
      }
    }

    // 2. Encrypt keys before saving
    const keyIdEnc = keyId ? encrypt(keyId) : null;
    const keySecretEnc = encrypt(keySecret);
    const pubKeyEnc = publishableKey ? encrypt(publishableKey) : null;
    const webhookSecretEnc = webhookSecret ? encrypt(webhookSecret) : null;

    // 3. Upsert to tenant_payment_gateways
    if (gateway === 'stripe') {
      await query(
        `INSERT INTO tenant_payment_gateways (tenant_id, gateway, stripe_publishable_key_enc, stripe_secret_key_enc, webhook_secret_enc, is_verified, is_active, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE, NOW())
         ON CONFLICT (tenant_id, gateway) DO UPDATE SET
           stripe_publishable_key_enc = EXCLUDED.stripe_publishable_key_enc,
           stripe_secret_key_enc = EXCLUDED.stripe_secret_key_enc,
           webhook_secret_enc = EXCLUDED.webhook_secret_enc,
           is_verified = EXCLUDED.is_verified,
           is_active = TRUE,
           updated_at = NOW()`,
        [tenantId, gateway, pubKeyEnc, keySecretEnc, webhookSecretEnc, isVerified]
      );
    } else {
      await query(
        `INSERT INTO tenant_payment_gateways (tenant_id, gateway, razorpay_key_id_enc, razorpay_key_secret_enc, webhook_secret_enc, is_verified, is_active, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE, NOW())
         ON CONFLICT (tenant_id, gateway) DO UPDATE SET
           razorpay_key_id_enc = EXCLUDED.razorpay_key_id_enc,
           razorpay_key_secret_enc = EXCLUDED.razorpay_key_secret_enc,
           webhook_secret_enc = EXCLUDED.webhook_secret_enc,
           is_verified = EXCLUDED.is_verified,
           is_active = TRUE,
           updated_at = NOW()`,
        [tenantId, gateway, keyIdEnc, keySecretEnc, webhookSecretEnc, isVerified]
      );
    }

    return sendSuccess(res, { gateway, is_verified: isVerified }, 'Payment gateway connected successfully');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

router.get('/status', async (req, res) => {
  const tenantId = req.user.tenant_id;
  try {
    const result = await query(
      `SELECT gateway, is_active, is_verified, 
              (webhook_secret_enc IS NOT NULL) as has_webhook
       FROM tenant_payment_gateways
       WHERE tenant_id = $1`,
      [tenantId]
    );
    return sendSuccess(res, { gateways: result.rows }, 'Gateways status retrieved successfully');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

router.delete('/:gateway', async (req, res) => {
  const tenantId = req.user.tenant_id;
  const { gateway } = req.params;
  if (!['stripe', 'razorpay'].includes(gateway)) {
    return sendError(res, 'Invalid gateway', 400);
  }
  try {
    await query(
      `UPDATE tenant_payment_gateways 
       SET is_active = FALSE, is_verified = FALSE, updated_at = NOW()
       WHERE tenant_id = $1 AND gateway = $2`,
      [tenantId, gateway]
    );
    return sendSuccess(res, { gateway }, 'Gateway disconnected successfully');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

module.exports = router;
