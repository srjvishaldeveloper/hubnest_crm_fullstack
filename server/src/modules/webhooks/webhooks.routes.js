const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { query } = require('../../config/database');
const { decrypt } = require('../../utils/encryption');
const { sendSuccess, sendError } = require('../../utils/helpers');

router.post('/stripe/:tenantId', async (req, res) => {
  const { tenantId } = req.params;
  const signatureHeader = req.headers['stripe-signature'];

  try {
    // Retrieve tenant Stripe webhook secret
    const credentialsRes = await query(
      `SELECT webhook_secret_enc FROM tenant_payment_gateways 
       WHERE tenant_id = $1 AND gateway = 'stripe' AND is_active = TRUE`,
      [tenantId]
    );

    if (credentialsRes.rows.length === 0) {
      return sendError(res, 'Tenant Stripe settings not found', 404);
    }

    const webhookSecret = decrypt(credentialsRes.rows[0].webhook_secret_enc);
    if (!webhookSecret) {
      return sendError(res, 'Stripe webhook secret not configured', 400);
    }

    if (!signatureHeader) {
      return sendError(res, 'Missing Stripe signature header', 400);
    }

    // Verify signature
    const parts = signatureHeader.split(',');
    const tPart = parts.find(p => p.startsWith('t='));
    const v1Part = parts.find(p => p.startsWith('v1='));
    
    if (!tPart || !v1Part) {
      return sendError(res, 'Invalid Stripe signature format', 400);
    }

    const t = tPart.substring(2);
    const v1 = v1Part.substring(3);
    const rawBody = req.rawBody || JSON.stringify(req.body);

    const computed = crypto
      .createHmac('sha256', webhookSecret)
      .update(`${t}.${rawBody}`)
      .digest('hex');

    if (computed !== v1) {
      return sendError(res, 'Stripe signature verification failed', 400);
    }

    // Handle webhook event
    const event = req.body;
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id;
      const chargeId = paymentIntent.latest_charge || paymentIntentId;

      // Find the pending payment log
      const paymentLog = await query(
        `SELECT * FROM invoice_payments WHERE gateway_order_id = $1 AND status = 'pending'`,
        [paymentIntentId]
      );

      if (paymentLog.rows.length > 0) {
        const log = paymentLog.rows[0];

        // Mark invoice payment log as success
        await query(
          `UPDATE invoice_payments 
           SET status = 'success', gateway_payment_id = $1, paid_at = NOW()
           WHERE id = $2`,
          [chargeId, log.id]
        );

        // Mark invoice as Paid
        await query(
          `UPDATE invoices SET status = 'Paid', paid_date = CURRENT_DATE, updated_at = NOW() WHERE id = $1`,
          [log.invoice_id]
        );

        // Record central payment
        await query(
          `INSERT INTO payments (tenant_id, invoice_id, amount, method, reference, status, paid_at)
           VALUES ($1, $2, $3, $4, $5, 'Completed', NOW())
           ON CONFLICT DO NOTHING`,
          [log.tenant_id, log.invoice_id, log.amount, 'Stripe', chargeId]
        );
      }
    }

    return sendSuccess(res, { received: true });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

router.post('/razorpay/:tenantId', async (req, res) => {
  const { tenantId } = req.params;
  const signature = req.headers['x-razorpay-signature'];

  try {
    // Retrieve tenant Razorpay webhook secret
    const credentialsRes = await query(
      `SELECT webhook_secret_enc FROM tenant_payment_gateways 
       WHERE tenant_id = $1 AND gateway = 'razorpay' AND is_active = TRUE`,
      [tenantId]
    );

    if (credentialsRes.rows.length === 0) {
      return sendError(res, 'Tenant Razorpay settings not found', 404);
    }

    const webhookSecret = decrypt(credentialsRes.rows[0].webhook_secret_enc);
    if (!webhookSecret) {
      return sendError(res, 'Razorpay webhook secret not configured', 400);
    }

    if (!signature) {
      return sendError(res, 'Missing Razorpay signature header', 400);
    }

    // Verify signature
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      return sendError(res, 'Razorpay signature verification failed', 400);
    }

    const event = req.body;
    // Razorpay standard webhook payment status: payment.captured or order.paid
    if (event.event === 'order.paid' || event.event === 'payment.captured') {
      const orderId = event.payload?.payment?.entity?.order_id || event.payload?.order?.entity?.id;
      const paymentId = event.payload?.payment?.entity?.id || orderId;

      if (orderId) {
        // Find pending payment log
        const paymentLog = await query(
          `SELECT * FROM invoice_payments WHERE gateway_order_id = $1 AND status = 'pending'`,
          [orderId]
        );

        if (paymentLog.rows.length > 0) {
          const log = paymentLog.rows[0];

          await query(
            `UPDATE invoice_payments 
             SET status = 'success', gateway_payment_id = $1, paid_at = NOW()
             WHERE id = $2`,
            [paymentId, log.id]
          );

          await query(
            `UPDATE invoices SET status = 'Paid', paid_date = CURRENT_DATE, updated_at = NOW() WHERE id = $1`,
            [log.invoice_id]
          );

          await query(
            `INSERT INTO payments (tenant_id, invoice_id, amount, method, reference, status, paid_at)
             VALUES ($1, $2, $3, $4, $5, 'Completed', NOW())
             ON CONFLICT DO NOTHING`,
            [log.tenant_id, log.invoice_id, log.amount, 'Razorpay', paymentId]
          );
        }
      }
    }

    return sendSuccess(res, { received: true });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

module.exports = router;
