const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function deleteGraFun() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.log('No DATABASE_URL found in .env.local');
    return;
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database.');

    // 1. Find venue IDs matching grafun
    const res = await client.query(`
      SELECT id, name, key FROM venues 
      WHERE key ILIKE '%grafun%' OR key ILIKE '%gra%' OR name ILIKE '%gra.fun%' OR name ILIKE '%grafun%'
    `);

    console.log(`Found ${res.rows.length} matching venues.`);

    for (const row of res.rows) {
      console.log(`Cleaning up venue: ${row.name} (${row.key}, id: ${row.id})`);
      
      // Find all launch IDs for this venue
      const launchRes = await client.query('SELECT id FROM launches WHERE venue_id = $1', [row.id]);
      const launchIds = launchRes.rows.map(l => l.id);
      console.log(`Found ${launchIds.length} launches associated with ${row.name}`);

      if (launchIds.length > 0) {
        // Delete outcomes for these launches
        await client.query('DELETE FROM outcomes WHERE launch_id = ANY($1::uuid[])', [launchIds]);
        
        // Delete trades for these launches
        await client.query('DELETE FROM trades_first_hour WHERE launch_id = ANY($1::uuid[])', [launchIds]);

        // Delete launches
        await client.query('DELETE FROM launches WHERE venue_id = $1', [row.id]);
      }

      // Delete venue
      await client.query('DELETE FROM venues WHERE id = $1', [row.id]);
      console.log(`Successfully deleted venue: ${row.name}`);
    }

    // 2. Clean up any reports referencing verdict_venue_key = 'grafun'
    const reportRes = await client.query(`
      DELETE FROM reports WHERE verdict_venue_key ILIKE '%grafun%' OR verdict_venue_key ILIKE '%gra.fun%'
    `);
    console.log(`Deleted ${reportRes.rowCount || 0} reports referencing Gra.fun.`);

    console.log('Purge completed successfully.');
  } catch (err) {
    console.error('Error executing query:', err.message);
  } finally {
    await client.end();
  }
}

deleteGraFun();
