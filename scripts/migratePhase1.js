const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function migratePhase1() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set in .env.local');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL for Phase 1 Migration.');

    // 1. Add missing columns to venues
    console.log('1. Migrating venues table schema...');
    await client.query(`
      ALTER TABLE venues 
      ADD COLUMN IF NOT EXISTS venue_type VARCHAR(32) DEFAULT 'launchpad',
      ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'active',
      ADD COLUMN IF NOT EXISTS factory_address VARCHAR(128),
      ADD COLUMN IF NOT EXISTS first_seen_block BIGINT,
      ADD COLUMN IF NOT EXISTS identification_source VARCHAR(64);
    `);

    // Classify DEX pools vs Launchpads
    await client.query(`
      UPDATE venues 
      SET venue_type = 'pool' 
      WHERE key IN ('raydium', 'meteora', 'aerodrome', 'pancakeswap', 'arc_swap', 'astrovault')
         OR name ILIKE '%CPMM%' 
         OR name ILIKE '%DLMM%' 
         OR name ILIKE '%SlipStream%' 
         OR name ILIKE '%v3%';
    `);

    // Ensure default launchpads
    await client.query(`
      UPDATE venues 
      SET venue_type = 'launchpad' 
      WHERE key IN ('pump_fun', 'bonk_fun', 'bags', 'clanker', 'virtuals', 'zora', 'four_meme', 'pons', 'pools_trade', 'hood_fun')
        AND venue_type IS DISTINCT FROM 'launchpad';
    `);

    // 2. Ensure chain_token_unique on launches
    console.log('2. Applying unique constraint (chain_id, token_address) on launches...');
    // Drop old constraint if exists with different name
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chain_token_unique'
        ) THEN
          ALTER TABLE launches ADD CONSTRAINT chain_token_unique UNIQUE (chain_id, token_address);
        END IF;
      END $$;
    `);

    // 3. Create launch_pools table
    console.log('3. Creating launch_pools table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS launch_pools (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          launch_id UUID NOT NULL REFERENCES launches(id) ON DELETE CASCADE,
          pool_address VARCHAR(128) NOT NULL,
          venue_id UUID NOT NULL REFERENCES venues(id),
          pool_type VARCHAR(32) NOT NULL DEFAULT 'bonding_curve',
          is_primary BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          CONSTRAINT launch_pool_unique UNIQUE (launch_id, pool_address)
      );
    `);

    // 4. Backfill launch_pools from existing launches
    console.log('4. Backfilling launch_pools from launches...');
    await client.query(`
      INSERT INTO launch_pools (launch_id, pool_address, venue_id, pool_type, is_primary)
      SELECT id, pool_address, venue_id, 'bonding_curve', true
      FROM launches
      ON CONFLICT (launch_id, pool_address) DO NOTHING;
    `);

    // 5. Create Materialized Views: Daily 24h & Cumulative Lifetime
    console.log('5. Creating Materialized Views: Daily vs Cumulative...');
    await client.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS mv_chain_daily_stats AS
      SELECT 
          c.id as chain_id,
          c.key as chain_key,
          c.name as chain_name,
          COUNT(l.id) as launches_24h,
          COALESCE(AVG(CASE WHEN o.is_surviving_7d THEN 1.0 ELSE 0.0 END), 0.0) as survival_rate_24h
      FROM chains c
      LEFT JOIN launches l ON l.chain_id = c.id AND l.block_timestamp >= (NOW() - INTERVAL '24 hours')
      LEFT JOIN outcomes o ON o.launch_id = l.id
      GROUP BY c.id, c.key, c.name;
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_chain_daily_stats_id 
      ON mv_chain_daily_stats (chain_id);
    `);

    await client.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS mv_chain_cumulative_stats AS
      SELECT 
          c.id as chain_id,
          c.key as chain_key,
          c.name as chain_name,
          COUNT(l.id) as lifetime_launches,
          COALESCE(AVG(CASE WHEN o.is_surviving_7d THEN 1.0 ELSE 0.0 END), 0.0) as lifetime_survival_rate
      FROM chains c
      LEFT JOIN launches l ON l.chain_id = c.id
      LEFT JOIN outcomes o ON o.launch_id = l.id
      GROUP BY c.id, c.key, c.name;
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_chain_cumulative_stats_id 
      ON mv_chain_cumulative_stats (chain_id);
    `);

    // Initial refresh
    await client.query(`REFRESH MATERIALIZED VIEW mv_chain_daily_stats;`);
    await client.query(`REFRESH MATERIALIZED VIEW mv_chain_cumulative_stats;`);

    console.log('Phase 1 Database Migration COMPLETED successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  migratePhase1();
}

module.exports = { migratePhase1 };
