const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function main() {
  console.log('Connecting to database...');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  let client;
  try {
    client = await pool.connect();
    console.log('Connected successfully to database!');

    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    const tables = tablesRes.rows.map(r => r.table_name);
    console.log('Found tables in database:', tables);

    const exportDir = path.join(__dirname, '..', 'data_export');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const summary = {};

    for (const table of tables) {
      console.log(`\nExporting table: ${table}...`);
      const countRes = await client.query(`SELECT COUNT(*) FROM "${table}";`);
      const totalCount = parseInt(countRes.rows[0].count, 10);
      console.log(`- Total rows in ${table}: ${totalCount}`);
      summary[table] = totalCount;

      if (totalCount === 0) {
        fs.writeFileSync(path.join(exportDir, `${table}.json`), JSON.stringify([], null, 2));
        continue;
      }

      if (totalCount > 10000) {
        console.log(`- Fetching ${table} in batches of 10000...`);
        const allRows = [];
        let offset = 0;
        const limit = 10000;
        while (offset < totalCount) {
          const batchRes = await client.query(`SELECT * FROM "${table}" ORDER BY id LIMIT ${limit} OFFSET ${offset};`);
          allRows.push(...batchRes.rows);
          offset += limit;
          console.log(`  Fetched ${Math.min(offset, totalCount)} / ${totalCount} rows...`);
        }
        const filePath = path.join(exportDir, `${table}.json`);
        fs.writeFileSync(filePath, JSON.stringify(allRows, null, 2));
        console.log(`✓ Saved ${allRows.length} rows to ${filePath}`);
      } else {
        const rowsRes = await client.query(`SELECT * FROM "${table}";`);
        const filePath = path.join(exportDir, `${table}.json`);
        fs.writeFileSync(filePath, JSON.stringify(rowsRes.rows, null, 2));
        console.log(`✓ Saved ${rowsRes.rows.length} rows to ${filePath}`);
      }
    }

    fs.writeFileSync(path.join(exportDir, 'summary.json'), JSON.stringify({
      exportedAt: new Date().toISOString(),
      tableCounts: summary
    }, null, 2));

    console.log('\n===========================================');
    console.log('✓ All database data exported successfully!');
    console.log(`Location: ${exportDir}`);
    console.log('Summary:', summary);
    console.log('===========================================');

  } catch (err) {
    console.error('\n❌ Database query / export error:', err.message);
  } finally {
    if (client) {
      try { client.release(); } catch {}
    }
    try { await pool.end(); } catch {}
  }
}

main();
