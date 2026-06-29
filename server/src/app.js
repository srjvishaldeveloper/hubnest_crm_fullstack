require('express-async-errors');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');
const logger = require('./utils/logger');
const { sendError } = require('./utils/helpers');

const authRoutes = require('./modules/auth/auth.routes');
const campaignRoutes = require('./modules/marketing/marketing.routes');
const marketingLeadsRoutes = require('./modules/marketing/marketing.leads.routes');
const salesRoutes = require('./modules/sales/sales.routes');
const salesManagerRoutes = require('./modules/sales-manager/salesManager.routes');
const supportRoutes = require('./modules/support/support.routes');
const financeRoutes = require('./modules/finance/finance.routes');
const aiRoutes = require('./modules/ai/ai.routes');
const reportsRoutes = require('./modules/reports/reports.routes');
const subscriptionRoutes = require('./modules/subscription/subscription.routes');
const mfaRoutes = require('./modules/auth/mfa.routes');
const smsRoutes = require('./modules/sms/sms.routes');
const chatRoutes = require('./modules/chat/chat.routes');
const orgChatRoutes = require('./modules/orgChat/orgChat.routes');
const superAdminRoutes = require('./modules/super-admin/superAdmin.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const managerAliasRoutes = require('./modules/sales-manager/managerAlias.routes');
const marketingAliasRoutes = require('./modules/marketing/marketingAlias.routes');
const marketingPublicRoutes = require('./modules/marketing/marketingPublic.routes');
const paymentGatewayRoutes = require('./modules/tenant/paymentGateway.routes');
const subscriptionBillingRoutes = require('./modules/hubnest/subscriptionBilling.routes');
const webhookRoutes = require('./modules/webhooks/webhooks.routes');
const notificationRoutes = require('./modules/notifications/notifications.routes');

const app = express();

// Security headers
app.use(helmet());
app.set('trust proxy', 1);

// CORS
app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

// Body parsing
app.use(express.json({ 
  limit: '5mb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// HTTP request logging
app.use(
  morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  })
);

// Health check (no auth required)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'crm-backend', timestamp: new Date().toISOString() });
});

// API v1 routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/campaigns', campaignRoutes);
app.use('/api/v1/marketing/leads', marketingLeadsRoutes);
app.use('/api/v1/sales', salesRoutes);
app.use('/api/v1/sales-manager', salesManagerRoutes);
app.use('/api/v1/support', supportRoutes);
app.use('/api/v1/finance', financeRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1', reportsRoutes);

app.use('/api/v1/super-admin', superAdminRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/manager', managerAliasRoutes);
app.use('/api/v1/marketing/public', marketingPublicRoutes);
app.use('/api/v1/marketing', marketingAliasRoutes);
app.use('/api/v1/subscription', subscriptionRoutes);
app.use('/api/v1/mfa', mfaRoutes);
app.use('/api/v1/sms', smsRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/org-chat', orgChatRoutes);
app.use('/api/v1/tenant/payment-gateway', paymentGatewayRoutes);
app.use('/api/v1/hubnest/billing', subscriptionBillingRoutes);
app.use('/api/v1/webhooks', webhookRoutes);
app.use('/api/v1/notifications', notificationRoutes);
// 404 — route not found
app.use((req, res) => {
  sendError(res, `Cannot ${req.method} ${req.path}`, 404);
});

// Global error handler (catches errors thrown from async route handlers)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  // Map PostgreSQL constraint violations to user-friendly HTTP codes
  if (err.code === '23505') {
    // Unique constraint violation → 409 Conflict
    const detail = err.detail || '';
    const field = detail.match(/Key \(([^)]+)\)/)?.[1] || 'field';
    logger.warn('Unique constraint violation', { path: req.path, detail });
    return sendError(res, `A record with this ${field} already exists`, 409);
  }
  if (err.code === '23503') {
    // Foreign key violation → 400 Bad Request
    return sendError(res, 'Referenced record does not exist', 400);
  }

  const statusCode = err.statusCode || 500;
  const message = err.statusCode ? err.message : 'Internal server error';

  logger.error('Application error', {
    statusCode,
    message: err.message,
    stack: statusCode >= 500 ? err.stack : undefined,
    method: req.method,
    path: req.path,
  });

  sendError(res, message, statusCode);
});

module.exports = app;
