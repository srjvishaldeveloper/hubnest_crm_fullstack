require('dotenv').config();
const { pool } = require('../src/config/database');

async function main() {
  const res = await pool.query(`SELECT * FROM tenants`);
  console.log("TENANTS:", JSON.stringify(res.rows, null, 2));
  await pool.end();
}

main().catch(console.error);
