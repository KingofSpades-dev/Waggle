const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('DATABASE_URL is not set in .env.local');
  process.exit(1);
}

const client = new Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

const DDL_STATEMENTS = `
-- Create extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Chains
CREATE TABLE IF NOT EXISTS chains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(32) UNIQUE NOT NULL,
    name VARCHAR(64) NOT NULL,
    hue VARCHAR(16) NOT NULL,
    data_sources TEXT[] NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Venues
CREATE TABLE IF NOT EXISTS venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain_id UUID NOT NULL REFERENCES chains(id) ON DELETE CASCADE,
    name VARCHAR(64) NOT NULL,
    key VARCHAR(32) UNIQUE NOT NULL,
    curve_type VARCHAR(32) NOT NULL,
    fee_structure JSONB,
    graduation_threshold_usd DECIMAL(18, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Launches
CREATE TABLE IF NOT EXISTS launches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain_id UUID NOT NULL REFERENCES chains(id),
    venue_id UUID NOT NULL REFERENCES venues(id),
    token_address VARCHAR(128) NOT NULL,
    pool_address VARCHAR(128) NOT NULL,
    creator_wallet VARCHAR(128),
    block_number BIGINT NOT NULL,
    block_timestamp TIMESTAMPTZ NOT NULL,
    launch_hour_utc INT2 NOT NULL,
    initial_liquidity_usd DECIMAL(18, 2) NOT NULL
);

-- 4. Trades First Hour
CREATE TABLE IF NOT EXISTS trades_first_hour (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    launch_id UUID NOT NULL REFERENCES launches(id) ON DELETE CASCADE,
    tx_hash VARCHAR(128) NOT NULL,
    trader_wallet VARCHAR(128) NOT NULL,
    seconds_after_launch INT4 NOT NULL,
    is_buy BOOLEAN NOT NULL,
    amount_usd DECIMAL(18, 2) NOT NULL,
    block_timestamp TIMESTAMPTZ NOT NULL
);

-- 5. Outcomes
CREATE TABLE IF NOT EXISTS outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    launch_id UUID UNIQUE NOT NULL REFERENCES launches(id) ON DELETE CASCADE,
    is_surviving_7d BOOLEAN NOT NULL,
    liquidity_7d_usd DECIMAL(18, 2) NOT NULL,
    trades_24h_count INT4 NOT NULL,
    first_minute_extraction_pct DECIMAL(5, 2) NOT NULL,
    evaluated_at TIMESTAMPTZ NOT NULL
);

-- 6. Metrics Snapshots
CREATE TABLE IF NOT EXISTS metrics_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,
    metrics_version VARCHAR(32) NOT NULL,
    weights_version VARCHAR(32) NOT NULL,
    sample_sizes JSONB NOT NULL,
    payload JSONB NOT NULL,
    contributing_adapters JSONB NOT NULL,
    is_drift_held BOOLEAN DEFAULT false
);

-- 7. Submissions
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_text TEXT NOT NULL,
    submitted_url TEXT,
    audience_tier VARCHAR(32),
    treasury_usd DECIMAL(18, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- 8. Reports
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES submissions(id) ON DELETE SET NULL,
    snapshot_id UUID NOT NULL REFERENCES metrics_snapshots(id),
    classifier_version VARCHAR(32) NOT NULL,
    weights_version VARCHAR(32) NOT NULL,
    metrics_version VARCHAR(32) NOT NULL,
    classified_category VARCHAR(32) NOT NULL,
    verdict_chain_key VARCHAR(32) NOT NULL,
    verdict_venue_key VARCHAR(32) NOT NULL,
    verdict_hour INT2 NOT NULL,
    composite_score INT2 NOT NULL,
    dimension_scores JSONB NOT NULL,
    confidence_levels JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_launches_chain_venue ON launches(chain_id, venue_id, block_timestamp DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_launches_pool_address ON launches(pool_address);
CREATE INDEX IF NOT EXISTS idx_trades_launch_seconds ON trades_first_hour(launch_id, seconds_after_launch);
CREATE INDEX IF NOT EXISTS idx_snapshots_latest ON metrics_snapshots(snapshot_time DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_ttl ON submissions(expires_at);
`;

async function main() {
  console.log('[DB Init] Connecting to database...');
  await client.connect();
  console.log('[DB Init] Connected successfully!');

  console.log('[DB Init] Creating database schema & tables...');
  await client.query(DDL_STATEMENTS);
  console.log('[DB Init] All 8 tables and indexes created successfully!');

  const res = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);

  console.log('[DB Init] Existing tables in public schema:', res.rows.map(r => r.table_name));
  await client.end();
}

main().catch(err => {
  console.error('[DB Init Error]:', err);
  client.end();
  process.exit(1);
});
