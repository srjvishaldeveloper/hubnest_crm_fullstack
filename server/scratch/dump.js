require('dotenv').config();
const { pool } = require('../src/config/database');

async function main() {
  const res = await pool.query(`
    SELECT u.id, u.name, u.email, u.admin_id, u.password_hash, u.status, r.name as role_name 
    FROM users u 
    JOIN roles r ON r.id = u.role_id
  `);
  console.log("USERS:", JSON.stringify(res.rows, null, 2));
  await pool.end();
}

main().catch(console.error);
