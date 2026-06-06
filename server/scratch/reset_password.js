const { pool } = require('../src/config/database');
const bcrypt = require('bcryptjs');

async function resetPassword() {
  const password = 'Tenant@123!';
  const hash = await bcrypt.hash(password, 12);
  
  const result = await pool.query(
    `UPDATE users 
     SET password_hash = $1, updated_at = NOW() 
     WHERE admin_id = 'EMP-3101' 
     RETURNING id, name, email`,
    [hash]
  );
  
  if (result.rows.length > 0) {
    console.log('Password successfully reset for user:', result.rows[0]);
  } else {
    console.log('User EMP-3101 not found.');
  }
  
  await pool.end();
}

resetPassword().catch(console.error);
