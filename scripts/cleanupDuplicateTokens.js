const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function cleanupDuplicateTokens() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('No DATABASE_URL found in .env.local');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database.');

    // 1. Create backup table if not exists
    console.log('Creating backup table launches_backup_v1...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS launches_backup_v1 AS 
      SELECT * FROM launches;
    `);
    console.log('Backup table created / verified.');

    // 2. Identify duplicate groups by (chain_id, token_address)
    const dupRes = await client.query(`
      SELECT chain_id, token_address, COUNT(*) as cnt, array_agg(id ORDER BY block_timestamp ASC) as launch_ids
      FROM launches
      GROUP BY chain_id, token_address
      HAVING COUNT(*) > 1;
    `);

    console.log(`Found ${dupRes.rows.length} duplicate token groups.`);

    for (const group of dupRes.rows) {
      const primaryId = group.launch_ids[0];
      const duplicateIds = group.launch_ids.slice(1);

      console.log(`Token ${group.token_address} (Chain: ${group.chain_id}): Primary ${primaryId}, Duplicates: [${duplicateIds.join(', ')}]`);

      // Repoint trades_first_hour
      await client.query(`
        UPDATE trades_first_hour 
        SET launch_id = $1 
        WHERE launch_id = ANY($2::uuid[])
      `, [primaryId, duplicateIds]);

      // Repoint or remove conflicting outcomes
      for (const dupId of duplicateIds) {
        // If primary already has an outcome, delete the duplicate outcome; otherwise repoint
        const primaryOutcome = await client.query('SELECT id FROM outcomes WHERE launch_id = $1', [primaryId]);
        if (primaryOutcome.rows.length > 0) {
          await client.query('DELETE FROM outcomes WHERE launch_id = $1', [dupId]);
        } else {
          await client.query('UPDATE outcomes SET launch_id = $1 WHERE launch_id = $2', [primaryId, dupId]);
        }
      }

      // Delete secondary launches
      await client.query('DELETE FROM launches WHERE id = ANY($1::uuid[])', [duplicateIds]);
    }

    // 3. Verification check
    const verifyRes = await client.query(`
      SELECT chain_id, token_address, COUNT(*) 
      FROM launches 
      GROUP BY chain_id, token_address 
      HAVING COUNT(*) > 1;
    `);

    if (verifyRes.rows.length === 0) {
      console.log('Verification PASSED: 0 duplicate tokens remaining.');
    } else {
      console.error(`Verification FAILED: ${verifyRes.rows.length} duplicates remain.`);
      process.exit(1);
    }
  } catch (err) {
    console.error('Error during cleanupDuplicateTokens:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  cleanupDuplicateTokens();
}

module.exports = { cleanupDuplicateTokens };
