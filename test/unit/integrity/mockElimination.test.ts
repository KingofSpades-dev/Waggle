import { describe, it, expect } from 'vitest';
import { getLiveDatabaseMetrics } from '@/lib/dbMetrics';
import { scoutProject } from '@/lib/scorer';
import { VENUES } from '@/lib/mockData';

const UNCOVERED_VENUE_KEYS = ['pump_fun', 'bonk_fun', 'bags', 'clanker', 'zora', 'four_meme'];
const UNCOVERED_VENUE_NAMES = ['Pump.fun', 'Bonk.fun', 'Bags', 'Clanker', 'Zora Protocol', 'Four.meme'];

describe('Epic 1: Eliminasi Total Mock Data & Null Safety', () => {
  it('Test Case 1.1.1 (No Mock Values): 6 target venues have sampleSize 0 and isCovered false', async () => {
    const metrics = await getLiveDatabaseMetrics();
    expect(metrics).toBeDefined();
    expect(metrics.venues).toBeDefined();

    const uncovered = metrics.venues.filter(v => UNCOVERED_VENUE_KEYS.includes(v.key));
    expect(uncovered.length).toBeGreaterThanOrEqual(6);

    for (const v of uncovered) {
      expect(v.isCovered).toBe(false);
      expect(v.sampleSize).toBe(0);
      expect(v.launchesCount).toBe(0);
      expect(v.survivalRatePct).toBe(0);
      expect(v.avgInitialLiquidityUsd).toBe(0);
      expect(v.extractionPct).toBe(0);
    }
  });

  it('Test Case 1.1.1b: mockData VENUES constant also marks the 6 venues as uncovered with sampleSize 0', () => {
    for (const name of UNCOVERED_VENUE_NAMES) {
      const found = VENUES.find(v => v.name.toLowerCase() === name.toLowerCase());
      expect(found).toBeDefined();
      expect(found?.isCovered).toBe(false);
      expect(found?.sampleSize).toBe(0);
      expect(found?.perday).toBe(0);
      expect(found?.liq).toBe(0);
      expect(found?.extract).toBe(0);
      expect(found?.surv).toBe(0);
    }
  });

  it('Test Case 1.1.2 (Scorer Guard): scoutProject never selects an uncovered venue as top recommendation', async () => {
    const memeResult = await scoutProject({
      description: 'A community meme token launched on Solana with no pre-existing audience.',
      constraints: { audience: 'none', treasury_usd: 500 }
    });

    expect(memeResult).toBeDefined();
    expect(memeResult.verdict).toBeDefined();
    // Must NOT be Pump.fun, Bonk.fun, or Bags!
    expect(UNCOVERED_VENUE_NAMES).not.toContain(memeResult.verdict.venue_name);

    const bnbResult = await scoutProject({
      description: 'A gaming community token launching on BNB Chain with low treasury.',
      constraints: { audience: 'none', treasury_usd: 1000 }
    });
    expect(UNCOVERED_VENUE_NAMES).not.toContain(bnbResult.verdict.venue_name);
  });
});
