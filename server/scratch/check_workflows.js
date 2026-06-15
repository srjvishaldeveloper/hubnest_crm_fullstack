const { query } = require('../src/config/database');

async function run() {
  try {
    const columns = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'marketing_workflows'
    `);
    console.log('Columns:', columns.rows);
    
    const workflows = await query('SELECT * FROM marketing_workflows');
    console.log('Workflows count:', workflows.rows.length);
    for (const wf of workflows.rows) {
      console.log('Workflow ID:', wf.id, 'Name:', wf.name);
      console.log('Keys:', Object.keys(wf));
      console.log('Nodes:', JSON.stringify(wf.nodes, null, 2));
      console.log('Edges:', JSON.stringify(wf.edges, null, 2));
      console.log('------------------------------------');
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

run();
