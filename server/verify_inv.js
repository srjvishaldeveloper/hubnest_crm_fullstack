const { pool } = require('./src/config/database');

(async () => {
  try {
    console.log('Pool Options:', {
      host: pool.options.host,
      port: pool.options.port,
      database: pool.options.database,
      user: pool.options.user,
      connectionString: pool.options.connectionString
    });
    const res = await pool.query("SELECT id, invoice_number, customer_name, amount, tax, total, status FROM invoices");
    console.log('Invoices in DB:', JSON.stringify(res.rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
