const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const env = require('./env');
const logger = require('../utils/logger');

const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
logger.info(`PostgreSQL Pool initialized with: ${env.databaseUrl}`);

pool.on('error', (err) => {
  logger.error('Unexpected error on idle PostgreSQL client', { message: err.message });
  process.exit(-1);
});

async function getClient() {
  return pool.connect();
}

async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    logger.debug('Query executed', { duration: `${Date.now() - start}ms`, rows: res.rowCount });
    return res;
  } catch (err) {
    logger.error('Database query error', { text, message: err.message });
    throw err;
  }
}

async function tenantQuery(schemaName, text, params) {
  const client = await pool.connect();
  try {
    await client.query(`SET search_path TO ${schemaName}, public`);
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

async function runMigrations() {
  const migrationsDir = path.join(__dirname, '../../migrations');
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

  logger.info(`Running ${files.length} migration(s)...`);

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    try {
      await pool.query(sql);
      logger.info(`Applied: ${file}`);
    } catch (err) {
      logger.error(`Migration failed: ${file}`, { message: err.message });
      throw err;
    }
  }

  logger.info('All migrations completed successfully.');
}

module.exports = { pool, query, tenantQuery, getClient, runMigrations };
