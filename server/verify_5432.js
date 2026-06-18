const { Pool } = require('pg');

(async () => {
  const pool = new Pool({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/crm_db'
  });
  try {
    const res = await pool.query("SELECT id, invoice_number, customer_name, amount, tax, total, status FROM invoices");
    console.log('Invoices on port 5432:', JSON.stringify(res.rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Failed to connect to 5432:', err.message);
    process.exit(1);
  }
})();
