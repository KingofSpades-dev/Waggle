const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('[Populate Outcomes] Connected to database.');

  // Find all launches that do not have an outcome yet
  const launchesRes = await client.query(`
    SELECT l.id, l.chain_id, l.launch_hour_utc, l.initial_liquidity_usd, c.key as chain_key
    FROM launches l
    JOIN chains c ON c.id = l.chain_id
    LEFT JOIN outcomes o ON o.launch_id = l.id
    WHERE o.id IS NULL;
  `);

  const launches = launchesRes.rows;
  console.log(`[Populate Outcomes] Found ${launches.length} launches needing outcomes.`);

  if (launches.length === 0) {
    console.log('[Populate Outcomes] All launches already have outcomes.');
    await client.end();
    return;
  }

  // Chain baseline probabilities
  const CHAIN_BASE = {
    sol: 0.48,
    base: 0.44,
    bnb: 0.40,
    rh: 0.54,
    arc: 0.42
  };

  // Diurnal multipliers by UTC hour (peak trading 13-22 UTC)
  function getHourlySurvivalRate(chainKey, hour) {
    const base = CHAIN_BASE[chainKey] || 0.42;
    // Sinusoidal day/night cycle peak at 17 UTC, trough at 05 UTC
    const cycle = Math.sin(((hour - 8) / 24) * 2 * Math.PI) * 0.16;
    // Add small chain-specific shifts
    let shift = 0;
    if (chainKey === 'sol' && (hour >= 14 && hour <= 22)) shift = 0.08;
    if (chainKey === 'base' && (hour >= 15 && hour <= 23)) shift = 0.06;
    if (chainKey === 'bnb' && (hour >= 4 && hour <= 12)) shift = 0.07;
    if (chainKey === 'rh' && (hour >= 13 && hour <= 20)) shift = 0.09;
    if (chainKey === 'arc' && (hour >= 12 && hour <= 18)) shift = 0.05;

    const rate = Math.max(0.12, Math.min(0.72, base + cycle + shift));
    return rate;
  }

  const batchSize = 250;
  let inserted = 0;

  for (let i = 0; i < launches.length; i += batchSize) {
    const batch = launches.slice(i, i + batchSize);
    const values = [];
    const placeholders = [];

    batch.forEach((l, idx) => {
      const h = l.launch_hour_utc;
      const chainKey = l.chain_key;
      const targetRate = getHourlySurvivalRate(chainKey, h);
      const isSurviving = Math.random() < targetRate;

      // Extraction: inverse to survival rate, plus jitter
      const baseExtract = 55 - (targetRate * 35);
      const extractPct = Math.max(22.0, Math.min(68.0, baseExtract + (Math.random() * 12 - 6)));

      const initLiq = parseFloat(l.initial_liquidity_usd) || 4000;
      const liq7d = isSurviving 
        ? initLiq * (1.2 + Math.random() * 4.5) 
        : initLiq * (0.05 + Math.random() * 0.35);

      const trades24h = Math.floor(60 + Math.random() * 900);

      const offset = idx * 6;
      placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`);
      values.push(
        l.id,
        isSurviving,
        liq7d.toFixed(2),
        trades24h,
        extractPct.toFixed(2),
        new Date()
      );
    });

    const queryText = `
      INSERT INTO outcomes (launch_id, is_surviving_7d, liquidity_7d_usd, trades_24h_count, first_minute_extraction_pct, evaluated_at)
      VALUES ${placeholders.join(', ')}
      ON CONFLICT (launch_id) DO NOTHING;
    `;

    await client.query(queryText, values);
    inserted += batch.length;
    console.log(`[Populate Outcomes] Inserted ${inserted} / ${launches.length}...`);
  }

  console.log('[Populate Outcomes] Finished populating outcomes for all launches!');
  await client.end();
}

main().catch(err => {
  console.error('[Populate Outcomes Error]:', err);
  client.end();
  process.exit(1);
});
