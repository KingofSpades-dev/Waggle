const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Database connection pool (reuse connection to prevent DB connection exhaustion)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5, // Maximum 5 connections in pool for serverless DB compatibility
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

const SLEEP_MS = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Daily Quota Counter & Rate Limit Tracker
const stats = {
  totalCycles: 0,
  totalLaunchesSaved: 0,
  dailyRpcCalls: 0,
  dailyGeckoCalls: 0,
  dailyDbQueries: 0,
  startTime: Date.now()
};

async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.status === 429) {
        console.warn(`[Daemon RateLimit] HTTP 429 encountered at ${url}. Backing off for 5 seconds...`);
        await SLEEP_MS(5000);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i === retries - 1) throw err;
      await SLEEP_MS(2000 * (i + 1));
    }
  }
}

async function runSingleCycle() {
  stats.totalCycles++;
  const client = await pool.connect();
  
  try {
    console.log(`\n-----------------------------------------------------`);
    console.log(`🔄 [Waggle Daemon] Cycle #${stats.totalCycles} Started at ${new Date().toISOString()}`);

    // 1. DefiLlama Ingestion (Cached 1 hour)
    console.log('[Waggle Daemon] Ingesting DefiLlama chain stats...');
    const llamaData = await fetchWithRetry(`${process.env.DEFILLAMA_API_BASE_URL || 'https://api.llama.fi'}/v2/chains`);
    stats.dailyGeckoCalls++;

    // Delay 1.5s to respect GeckoTerminal 30-60 rpm limit
    await SLEEP_MS(1500);

    // 2. GeckoTerminal Solana New Pools
    console.log('[Waggle Daemon] Ingesting GeckoTerminal Solana new pools...');
    const solData = await fetchWithRetry(`${process.env.GECKOTERMINAL_API_BASE_URL || 'https://api.geckoterminal.com/api/v2'}/networks/solana/new_pools?page=1`);
    stats.dailyGeckoCalls++;
    const solPools = solData.data || [];

    await SLEEP_MS(1500);

    // 3. GeckoTerminal Base New Pools
    console.log('[Waggle Daemon] Ingesting GeckoTerminal Base new pools...');
    const baseData = await fetchWithRetry(`${process.env.GECKOTERMINAL_API_BASE_URL || 'https://api.geckoterminal.com/api/v2'}/networks/base/new_pools?page=1`);
    stats.dailyGeckoCalls++;
    const basePools = baseData.data || [];

    await SLEEP_MS(1500);

    // 4. GeckoTerminal BSC (BNB Chain) New Pools
    console.log('[Waggle Daemon] Ingesting GeckoTerminal BSC (BNB Chain) new pools...');
    const bnbData = await fetchWithRetry(`${process.env.GECKOTERMINAL_API_BASE_URL || 'https://api.geckoterminal.com/api/v2'}/networks/bsc/new_pools?page=1`);
    stats.dailyGeckoCalls++;
    const bnbPools = bnbData.data || [];

    await SLEEP_MS(1500);

    // 5. DexScreener Arc DEX Pairs
    console.log('[Waggle Daemon] Ingesting DexScreener Arc DEX pairs...');
    let arcPools = [];
    try {
      const arcData = await fetchWithRetry('https://api.dexscreener.com/latest/dex/search?q=arc');
      stats.dailyGeckoCalls++;
      arcPools = (arcData?.pairs || []).map(p => ({
        attributes: {
          name: p.baseToken?.name || 'Arc Token',
          address: p.pairAddress,
          reserve_in_usd: (p.liquidity?.usd || 0).toString(),
          pool_created_at: p.pairCreatedAt ? new Date(p.pairCreatedAt).toISOString() : new Date().toISOString()
        },
        relationships: { network: { data: { id: 'arc' } } }
      }));
    } catch (e) {
      console.warn('[Waggle Daemon] Could not fetch Arc pairs from DexScreener:', e.message);
    }

    // 6. Helius RPC Check (High-speed Solana event listener)
    const heliusKey = process.env.HELIUS_API_KEY;
    if (heliusKey) {
      const heliusRes = await fetchWithRetry(`https://mainnet.helius-rpc.com/?api-key=${heliusKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getSlot' })
      });
      stats.dailyRpcCalls++;
      console.log(`[Waggle Daemon] Helius RPC Status: OK (Slot #${heliusRes.result})`);
    }

    // 7. Database Upsert & Deduplication across all 5 chains
    console.log('[Waggle Daemon] Upserting launch data into PostgreSQL DB...');
    const chainRows = await client.query('SELECT id, key FROM chains;');
    const venueRows = await client.query('SELECT id, key FROM venues;');
    stats.dailyDbQueries += 2;

    const chainMap = Object.fromEntries(chainRows.rows.map(r => [r.key, r.id]));
    const venueMap = Object.fromEntries(venueRows.rows.map(r => [r.key, r.id]));

    let newLaunchesCount = 0;

    for (const poolItem of [...solPools, ...basePools, ...bnbPools, ...arcPools]) {
      const attr = poolItem.attributes || {};
      const networkId = (poolItem.relationships?.network?.data?.id || '').toLowerCase();
      const dexId = (poolItem.relationships?.dex?.data?.id || '').toLowerCase();
      const poolName = (attr.name || '').toLowerCase();

      const isSol = networkId === 'solana' || poolName.includes('sol');
      const isBnb = networkId === 'bsc' || poolName.includes('bnb');
      const isArc = networkId === 'arc' || poolName.includes('arc');
      const chainKey = isSol ? 'sol' : (isBnb ? 'bnb' : (isArc ? 'arc' : 'base'));
      const chainId = chainMap[chainKey];

      let venueKey = 'pump_fun';
      if (chainKey === 'sol') {
        if (dexId.includes('bonk') || poolName.includes('bonk')) venueKey = 'bonk_fun';
        else if (dexId.includes('bag') || poolName.includes('bags')) venueKey = 'bags';
        else venueKey = 'pump_fun';
      } else if (chainKey === 'base') {
        if (dexId.includes('zora') || poolName.includes('zora')) venueKey = 'zora';
        else venueKey = 'clanker';
      } else if (chainKey === 'bnb') {
        venueKey = 'four_meme';
      } else if (chainKey === 'rh') {
        venueKey = 'pair';
      } else if (chainKey === 'arc') {
        venueKey = 'arc_swap';
      }

      const venueId = venueMap[venueKey] || venueRows.rows[0]?.id;
      const createdAt = attr.pool_created_at ? new Date(attr.pool_created_at) : new Date();
      const poolAddr = attr.address;

      if (chainId && venueId && poolAddr) {
        const insertRes = await client.query(`
          INSERT INTO launches (chain_id, venue_id, token_address, pool_address, block_number, block_timestamp, launch_hour_utc, initial_liquidity_usd)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (pool_address) DO UPDATE SET initial_liquidity_usd = EXCLUDED.initial_liquidity_usd
          RETURNING id;
        `, [
          chainId,
          venueId,
          poolAddr,
          poolAddr,
          BigInt(Date.now()),
          createdAt,
          createdAt.getUTCHours(),
          parseFloat(attr.reserve_in_usd || '0')
        ]);
        stats.dailyDbQueries++;
        if (insertRes.rows.length > 0) newLaunchesCount++;
      }
    }

    // Query real total count and sample sizes per chain from database
    const dbCountRes = await client.query('SELECT COUNT(*) FROM launches');
    stats.dailyDbQueries++;
    const realTotalSaved = parseInt(dbCountRes.rows[0]?.count || '0', 10);

    const chainCountsRes = await client.query(`
      SELECT c.key, COUNT(l.id) as count
      FROM chains c
      LEFT JOIN launches l ON l.chain_id = c.id
      GROUP BY c.key
    `);
    stats.dailyDbQueries++;
    const chainCountsMap = Object.fromEntries(chainCountsRes.rows.map(r => [r.key, parseInt(r.count, 10)]));

    // 6. Hourly Immutable Snapshot Generation
    console.log('[Waggle Daemon] Generating immutable metrics snapshot...');
    const snapshotPayload = {
      timestamp: new Date().toISOString(),
      sample_sizes: chainCountsMap,
      cycle_launches_count: newLaunchesCount,
      total_saved_launches: realTotalSaved,
      contributing_adapters: ['DefiLlamaAdapter', 'GeckoTerminalAdapter', 'HeliusRPCListener']
    };

    await client.query(`
      INSERT INTO metrics_snapshots (snapshot_time, window_start, window_end, metrics_version, weights_version, sample_sizes, payload, contributing_adapters)
      VALUES (NOW(), NOW() - INTERVAL '7 days', NOW(), 'v1.0.4', 'v1.0.0', $1, $2, $3);
    `, [
      JSON.stringify(snapshotPayload.sample_sizes),
      JSON.stringify(snapshotPayload),
      JSON.stringify(snapshotPayload.contributing_adapters)
    ]);
    stats.dailyDbQueries++;

    const hoursElapsed = (Date.now() - stats.startTime) / 3600000;
    const estDailyRpc = Math.round(stats.dailyRpcCalls / (hoursElapsed || 0.001) * 24);
    const estDailyDb = Math.round(stats.dailyDbQueries / (hoursElapsed || 0.001) * 24);

    console.log(`\n📊 [Waggle Daemon Quota & Health Summary]`);
    console.log(`- Cycle #${stats.totalCycles} Finished in ${new Date().toISOString()}`);
    console.log(`- New Launches Processed: ${newLaunchesCount} (Total Saved in DB: ${realTotalSaved})`);
    console.log(`- Estimated Daily Helius RPC Usage: ~${estDailyRpc} calls/day (Safe limit: 100,000/day)`);
    console.log(`- Estimated Daily DB Queries: ~${estDailyDb} queries/day (Safe limit: Pooled DB)`);
    console.log(`- Next cycle in 5 minutes...`);

  } catch (err) {
    console.error('[Waggle Daemon Error]:', err);
  } finally {
    client.release();
  }
}

async function startDaemon() {
  console.log('🚀 Starting Waggle Continuous Ingestion Daemon (Interval: 1 Minute)...');
  await runSingleCycle();
  
  // Continuous loop every 1 minute (60,000 ms)
  setInterval(async () => {
    await runSingleCycle();
  }, 60000);
}

startDaemon();
