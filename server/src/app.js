require('express-async-errors');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');
const logger = require('./utils/logger');
const { sendError } = require('./utils/helpers');

const authRoutes = require('./modules/auth/auth.routes');

const app = express();

// Security headers
app.use(helmet());
app.set('trust proxy', 1);

// CORS
app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing
app.use(express.json({ limit: '5mb' }));
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

// 404 — route not found
app.use((req, res) => {
  sendError(res, `Cannot ${req.method} ${req.path}`, 404);
});

// Global error handler (catches errors thrown from async route handlers)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  const statusCode = err.statusCode || 500;

  // Show the actual message for any error thrown intentionally by our code
  // (those have an explicit statusCode). For truly unhandled errors, hide details.
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
