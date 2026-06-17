const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const { authenticate } = require('../../middleware/auth');
const { authorizeSuperAdmin } = require('../../middleware/rbac');
const { query } = require('../../config/database');
const { sendSuccess, sendError } = require('../../utils/helpers');

// Subscription billing endpoints require authentication and Super Admin authorization
router.use(authenticate);
router.use(authorizeSuperAdmin);

router.post('/create-order', async (req, res) => {
  const { amount, currency, gateway } = req.body;
  if (!amount || !gateway) {
    return sendError(res, 'amount and gateway are required', 400);
  }

  try {
    if (gateway === 'razorpay') {
      const keyId = process.env.HUBNEST_RAZORPAY_KEY_ID;
      const keySecret = process.env.HUBNEST_RAZORPAY_KEY_SECRET;
      if (!keyId || !keySecret) {
        return sendError(res, 'HubNest Razorpay credentials not configured in environment', 500);
      }
      
      const amountPaise = Math.round(parseFloat(amount) * 100);
      const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const orderRes = await axios.post('https://api.razorpay.com/v1/orders', {
        amount: amountPaise,
        currency: currency || 'INR',
        receipt: `sub_${Date.now()}`
      }, {
        headers: { Authorization: `Basic ${auth}` }
      });

      return sendSuccess(res, {
        orderId: orderRes.data.id,
        amount: orderRes.data.amount,
        currency: orderRes.data.currency,
        razorpayKeyId: keyId
      });
    } else if (gateway === 'stripe') {
      const secretKey = process.env.HUBNEST_STRIPE_SECRET_KEY;
      if (!secretKey) {
        return sendError(res, 'HubNest Stripe credentials not configured in environment', 500);
      }

      const amountCents = Math.round(parseFloat(amount) * 100);
      const urlParams = new URLSearchParams();
      urlParams.append('amount', String(amountCents));
      urlParams.append('currency', (currency || 'INR').toLowerCase());
      urlParams.append('metadata[type]', 'hubnest_subscription');

      const intentRes = await axios.post('https://api.stripe.com/v1/payment_intents', urlParams, {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return sendSuccess(res, {
        clientSecret: intentRes.data.client_secret,
        amount: amount,
        currency: currency || 'INR'
      });
    }

    return sendError(res, 'Unsupported gateway', 400);
  } catch (err) {
    return sendError(res, err.response?.data?.error?.message || err.message, 500);
  }
});

router.post('/verify-payment', async (req, res) => {
  const { gateway, gateway_payment_id, gateway_order_id, gateway_signature, amount } = req.body;
  
  try {
    if (gateway === 'razorpay') {
      const keySecret = process.env.HUBNEST_RAZORPAY_KEY_SECRET;
      const shasum = crypto.createHmac('sha256', keySecret);
      shasum.update(`${gateway_order_id}|${gateway_payment_id}`);
      const digest = shasum.digest('hex');
      if (digest !== gateway_signature) {
        return sendError(res, 'Invalid signature verification', 400);
      }
    }
    
    // Log/update subscription info inside our systems
    // For tracking, we can record this payment in a log
    const meta = { gateway, orderId: gateway_order_id, paymentId: gateway_payment_id };
    await query(
      `INSERT INTO tenant_subscriptions (tenant_id, plan_id, status, started_at, expires_at)
       VALUES ($1, (SELECT id FROM subscription_plans WHERE slug = 'pro' LIMIT 1), 'active', NOW(), NOW() + interval '30 days')
       ON CONFLICT (tenant_id) DO UPDATE SET
         status = 'active',
         expires_at = NOW() + interval '30 days',
         updated_at = NOW()`,
      [req.user.tenant_id]
    );

    return sendSuccess(res, { success: true }, 'Subscription payment verified successfully');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

router.get('/history', async (req, res) => {
  try {
    // Return HubNest subscription history
    const result = await query(
      `SELECT ts.*, sp.name as plan_name, t.name as tenant_name 
       FROM tenant_subscriptions ts
       JOIN subscription_plans sp ON sp.id = ts.plan_id
       JOIN tenants t ON t.id = ts.tenant_id
       ORDER BY ts.updated_at DESC LIMIT 50`
    );
    return sendSuccess(res, { history: result.rows });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

module.exports = router;
