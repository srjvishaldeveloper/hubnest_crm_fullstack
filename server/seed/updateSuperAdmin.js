/**
 * Update Super Admin credentials.
 * Run: node seed/updateSuperAdmin.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/database');
const logger = require('../src/utils/logger');

const NEW_EMAIL    = 'srjchudamanideveloper@gmail.com';
const NEW_ADMIN_ID = 'SUPER001';
const NEW_PASSWORD = 'Admin@123';

async function updateSuperAdmin() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Find the Super Admin user (by role name)
    const { rows } = await client.query(
      `SELECT u.id, u.email, u.admin_id
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE r.name = 'Super Admin'
       LIMIT 1`
    );

    if (rows.length === 0) {
      logger.error('Super Admin user not found. Run "npm run seed" first.');
      process.exit(1);
    }

    const user = rows[0];
    logger.info(`Found Super Admin: ${user.email} (ID: ${user.id})`);

    const passwordHash = await bcrypt.hash(NEW_PASSWORD, 12);

    await client.query(
      `UPDATE users
       SET email         = $1,
           admin_id      = $2,
           password_hash = $3,
           updated_at    = NOW()
       WHERE id = $4`,
      [NEW_EMAIL, NEW_ADMIN_ID, passwordHash, user.id]
    );

    await client.query('COMMIT');

    logger.info('Super Admin updated successfully:');
    logger.info(`  Email:    ${NEW_EMAIL}`);
    logger.info(`  Admin ID: ${NEW_ADMIN_ID}`);
    logger.info(`  Password: ${NEW_PASSWORD}`);

  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Update failed', { message: err.message });
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

updateSuperAdmin().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
