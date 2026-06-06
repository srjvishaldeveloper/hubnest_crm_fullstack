const { pool } = require('../src/config/database');
const bcrypt = require('bcryptjs');

async function checkUser() {
  const result = await pool.query(
    `SELECT u.*, r.name AS role_name 
     FROM users u 
     LEFT JOIN roles r ON r.id = u.role_id 
     WHERE u.admin_id = $1 OR u.email = $1`,
    ['EMP-3101']
  );

  console.log('User check result:', result.rows);

  if (result.rows.length > 0) {
    const user = result.rows[0];
    const passwordsToTest = ['Tenant@123!', 'Tenant@123', 'Admin@123'];
    for (const pwd of passwordsToTest) {
      const match = await bcrypt.compare(pwd, user.password_hash);
      console.log(`Password "${pwd}" matches:`, match);
    }
  } else {
    console.log('No user found with ID/email "EMP-3101"');
  }

  await pool.end();
}

checkUser().catch(console.error);
