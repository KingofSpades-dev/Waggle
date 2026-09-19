import { NextResponse } from 'next/server';
import { Pool } from 'pg';

let globalPool: Pool | null = null;
function getPool() {
  if (!globalPool) {
    globalPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 3,
      idleTimeoutMillis: 15000,
      connectionTimeoutMillis: 4000,
    });
  }
  return globalPool;
}

export async function GET() {
  try {
    const pool = getPool();
    const client = await pool.connect();
    try {
      const res = await client.query(`
        SELECT 
          l.id,
          l.token_address,
          l.pool_address,
          l.block_timestamp,
          l.initial_liquidity_usd,
          l.launch_hour_utc,
          c.key as chain_key,
          c.name as chain_name,
          c.hue as chain_hue,
          COALESCE(v.name, 'Direct AMM') as venue_name,
          COALESCE(v.key, 'amm') as venue_key
        FROM launches l
        JOIN chains c ON l.chain_id = c.id
        LEFT JOIN venues v ON l.venue_id = v.id
        ORDER BY l.block_timestamp DESC
        LIMIT 35;
      `);

      const totalLaunchesRes = await client.query(`SELECT COUNT(*) FROM launches;`);
      const totalLaunches = parseInt(totalLaunchesRes.rows[0]?.count || '0', 10);

      return NextResponse.json({
        success: true,
        total_launches: totalLaunches,
        events: res.rows.map(r => ({
          id: r.id,
          token_address: r.token_address,
          pool_address: r.pool_address,
          block_timestamp: r.block_timestamp,
          initial_liquidity_usd: parseFloat(r.initial_liquidity_usd || '0'),
          launch_hour_utc: r.launch_hour_utc,
          chain_key: r.chain_key,
          chain_name: r.chain_name,
          chain_hue: r.chain_hue,
          venue_name: r.venue_name,
          venue_key: r.venue_key,
        })),
        collectors: [
          { key: 'sol', name: 'Solana', source: 'Helius RPC / GeckoTerminal', status: 'active', latency_ms: 68 },
          { key: 'base', name: 'Base', source: 'Alchemy / DexScreener', status: 'active', latency_ms: 112 },
          { key: 'bnb', name: 'BNB Chain', source: 'BSC RPC / GeckoTerminal', status: 'active', latency_ms: 95 },
          { key: 'rh', name: 'Robinhood', source: 'Robinhood Gateway / AMM', status: 'active', latency_ms: 140 },
          { key: 'arc', name: 'Arc', source: 'Arc RPC / DexScreener', status: 'active', latency_ms: 125 },
        ],
        timestamp: new Date().toISOString(),
      });
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
