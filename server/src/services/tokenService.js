const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const env = require('../config/env');
const { query } = require('../config/database');
const logger = require('../utils/logger');

function generateAccessToken(payload) {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
    issuer: 'jobnest-crm',
    subject: payload.userId,
  });
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn,
    issuer: 'jobnest-crm',
    subject: payload.userId,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret, { issuer: 'jobnest-crm' });
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwtRefreshSecret, { issuer: 'jobnest-crm' });
}

async function saveRefreshToken(userId, token) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await query(
    `INSERT INTO refresh_tokens (id, user_id, token, expires_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (token) DO NOTHING`,
    [uuidv4(), userId, token, expiresAt]
  );
}

async function findRefreshToken(token) {
  const result = await query(
    `SELECT * FROM refresh_tokens
     WHERE token = $1 AND revoked = FALSE AND expires_at > NOW()`,
    [token]
  );
  return result.rows[0] || null;
}

async function revokeRefreshToken(token) {
  await query(`UPDATE refresh_tokens SET revoked = TRUE WHERE token = $1`, [token]);
}

async function revokeAllUserTokens(userId) {
  await query(`UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1`, [userId]);
  logger.info(`All tokens revoked for user ${userId}`);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  saveRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
};
