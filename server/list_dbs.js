const { Pool } = require('pg');

(async () => {
  const pool = new Pool({
    connectionString: 'postgresql://postgres:postgres@localhost:5433/postgres'
  });
  try {
    const res = await pool.query('SELECT datname FROM pg_database WHERE datistemplate = false');
    console.log('Databases on port 5433:', res.rows.map(r => r.datname));
    
    // Now let's connect to crm_db and list all tables with row count
    const crmPool = new Pool({
      connectionString: 'postgresql://postgres:postgres@localhost:5433/crm_db'
    });
    const tablesRes = await crmPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('\nRow counts in crm_db:');
    for (const row of tablesRes.rows) {
      const countRes = await crmPool.query(`SELECT COUNT(*) FROM "${row.table_name}"`);
      const count = parseInt(countRes.rows[0].count);
      if (count > 0) {
        console.log(`- ${row.table_name}: ${count} rows`);
      }
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
