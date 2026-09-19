const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const SEED_CHAINS = [
  { key: 'sol', name: 'Solana', hue: '#7b45d8', dataSources: ['GeckoTerminal', 'DefiLlama'] },
  { key: 'base', name: 'Base', hue: '#0091b0', dataSources: ['GeckoTerminal', 'DexScreener'] },
  { key: 'bnb', name: 'BNB Chain', hue: '#c08a00', dataSources: ['DefiLlama', 'DexScreener'] },
  { key: 'rh', name: 'Robinhood', hue: '#12b981', dataSources: ['self indexed from RPC'] },
  { key: 'arc', name: 'Arc', hue: '#e07b28', dataSources: ['no collector yet'] }
];

const SEED_VENUES = [
  { chainKey: 'sol', name: 'Pump.fun', key: 'pump_fun', curveType: 'bonding_curve' },
  { chainKey: 'sol', name: 'Bonk.fun', key: 'bonk_fun', curveType: 'bonding_curve' },
  { chainKey: 'sol', name: 'Bags', key: 'bags', curveType: 'amm' },
  { chainKey: 'base', name: 'Clanker', key: 'clanker', curveType: 'bonding_curve' },
  { chainKey: 'base', name: 'Zora', key: 'zora', curveType: 'bonding_curve' },
  { chainKey: 'bnb', name: 'Four.meme', key: 'four_meme', curveType: 'bonding_curve' },
  { chainKey: 'rh', name: 'PAIR', key: 'pair', curveType: 'amm' }
];

async function main() {
  await client.connect();
  console.log('[Seed DB] Connected to live PostgreSQL database!');

  // Seed Chains
  for (const c of SEED_CHAINS) {
    await client.query(`
      INSERT INTO chains (key, name, hue, data_sources)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (key) DO UPDATE SET
        name = EXCLUDED.name,
        hue = EXCLUDED.hue,
        data_sources = EXCLUDED.data_sources;
    `, [c.key, c.name, c.hue, c.dataSources]);
  }
  console.log('[Seed DB] Chains seeded successfully.');

  // Seed Venues
  for (const v of SEED_VENUES) {
    const chainRes = await client.query('SELECT id FROM chains WHERE key = $1', [v.chainKey]);
    if (chainRes.rows.length > 0) {
      const chainId = chainRes.rows[0].id;
      await client.query(`
        INSERT INTO venues (chain_id, name, key, curve_type)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (key) DO UPDATE SET
          name = EXCLUDED.name,
          curve_type = EXCLUDED.curve_type;
      `, [chainId, v.name, v.key, v.curveType]);
    }
  }
  console.log('[Seed DB] Venues seeded successfully.');

  const chainsCount = await client.query('SELECT COUNT(*) FROM chains;');
  const venuesCount = await client.query('SELECT COUNT(*) FROM venues;');

  console.log(`[Seed DB] Database Verification: ${chainsCount.rows[0].count} chains, ${venuesCount.rows[0].count} venues in DB.`);
  await client.end();
}

main().catch(err => {
  console.error('[Seed DB Error]:', err);
  client.end();
  process.exit(1);
});
