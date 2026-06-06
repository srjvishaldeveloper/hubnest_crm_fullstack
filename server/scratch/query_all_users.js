const { pool } = require('../src/config/database');

async function listUsers() {
  const result = await pool.query(
    `SELECT u.id, u.name, u.email, u.admin_id, u.status, r.name AS role_name, t.name AS tenant_name
     FROM users u
     LEFT JOIN roles r ON r.id = u.role_id
     LEFT JOIN tenants t ON t.id = u.tenant_id
     ORDER BY u.created_at DESC`
  );

  console.log('All users in database:');
  console.table(result.rows);
  await pool.end();
}

listUsers().catch(console.error);
