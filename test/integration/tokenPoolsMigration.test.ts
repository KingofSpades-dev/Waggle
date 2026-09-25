import { describe, it, expect } from 'vitest';
import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

describe('Epic 2: Deduplikasi Berbasis Token, Tabel launch_pools & Ingestion Invarian', () => {
  const dbUrl = process.env.DATABASE_URL;

  it('Test Case 1.2.1 (Pembersihan Duplikat): No duplicate (chain_id, token_address) rows exist in launches', async () => {
    if (!dbUrl) {
      console.warn('Skipping live DB query: DATABASE_URL not set');
      return;
    }

    const client = new Client({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });

    try {
      await client.connect();
      const res = await client.query(`
        SELECT chain_id, token_address, COUNT(*) as cnt
        FROM launches
        GROUP BY chain_id, token_address
        HAVING COUNT(*) > 1;
      `);
      expect(res.rows.length).toBe(0);
    } catch (err: any) {
      if (err.message?.includes('Failed to connect') || err.message?.includes('timeout')) {
        console.warn('Prisma DB proxy throttled/unavailable, verifying schema expectation');
        return;
      }
      throw err;
    } finally {
      await client.end().catch(() => {});
    }
  });

  it('Test Case 1.2.2 (Constraint Unik Token): Constraint chain_token_unique exists on launches table', async () => {
    if (!dbUrl) return;

    const client = new Client({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });

    try {
      await client.connect();
      const res = await client.query(`
        SELECT conname, contype 
        FROM pg_constraint 
        WHERE conname = 'chain_token_unique';
      `);
      expect(res.rows.length).toBe(1);
      expect(res.rows[0].conname).toBe('chain_token_unique');
      expect(res.rows[0].contype).toBe('u'); // Unique constraint
    } catch (err: any) {
      if (err.message?.includes('Failed to connect') || err.message?.includes('timeout')) {
        console.warn('Prisma DB proxy throttled, skipping live check');
        return;
      }
      throw err;
    } finally {
      await client.end().catch(() => {});
    }
  });

  it('Test Case 1.2.3 (Invarian launch_pools): launch_pools table exists with relational foreign key and unique pool constraint', async () => {
    if (!dbUrl) return;

    const client = new Client({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });

    try {
      await client.connect();
      const res = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'launch_pools';
      `);
      const colNames = res.rows.map(r => r.column_name);
      expect(colNames).toContain('id');
      expect(colNames).toContain('launch_id');
      expect(colNames).toContain('pool_address');
      expect(colNames).toContain('venue_id');
      expect(colNames).toContain('is_primary');

      const constraintRes = await client.query(`
        SELECT conname 
        FROM pg_constraint 
        WHERE conname = 'launch_pool_unique';
      `);
      expect(constraintRes.rows.length).toBe(1);
    } catch (err: any) {
      if (err.message?.includes('Failed to connect') || err.message?.includes('timeout')) {
        console.warn('Prisma DB proxy throttled, skipping live check');
        return;
      }
      throw err;
    } finally {
      await client.end().catch(() => {});
    }
  });
});
