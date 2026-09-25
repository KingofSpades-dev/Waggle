import { describe, it, expect } from 'vitest';
import { MIN_SURVIVAL_LIQUIDITY_USD, MIN_SURVIVAL_TRADES_24H } from '@/lib/types';
import { VENUES } from '@/lib/mockData';
import fs from 'fs';
import path from 'path';

describe('Epic 5: Taksonomi Survival, Venue Type, & Disclosures', () => {
  it('Test Case 1.5.1 (Survival Constants Check): Named constants exist with correct threshold values', () => {
    expect(MIN_SURVIVAL_LIQUIDITY_USD).toBe(1000.0);
    expect(MIN_SURVIVAL_TRADES_24H).toBe(50);
  });

  it('Test Case 1.5.2 (Venue Type Classification): DEX pools vs Launchpads are strictly separated', () => {
    const dexPools = ['Raydium CPMM', 'Meteora DLMM', 'Aerodrome SlipStream', 'PancakeSwap v3', 'ArcSwap', 'Astrovault 1:1 AXV'];
    const launchpads = ['Pons', 'Pools.trade', 'hood.fun', 'Virtuals Protocol'];

    for (const poolName of dexPools) {
      const v = VENUES.find(item => item.name.toLowerCase() === poolName.toLowerCase());
      expect(v, `Expected to find ${poolName}`).toBeDefined();
      expect(v?.venueType).toBe('pool');
    }

    for (const lpName of launchpads) {
      const v = VENUES.find(item => item.name.toLowerCase() === lpName.toLowerCase());
      expect(v, `Expected to find ${lpName}`).toBeDefined();
      expect(v?.venueType).toBe('launchpad');
    }
  });

  it('Test Case 1.5.3 (Factual Disclosure Compliance): Exact disclosure copy exists in page.tsx and method/page.tsx', () => {
    const expectedDisclosure = 'Modus launched a token on Pons.';

    const pageContent = fs.readFileSync(path.resolve(__dirname, '../../../src/app/page.tsx'), 'utf-8');
    expect(pageContent).toContain(expectedDisclosure);

    const methodContent = fs.readFileSync(path.resolve(__dirname, '../../../src/app/method/page.tsx'), 'utf-8');
    expect(methodContent).toContain(expectedDisclosure);
  });

  it('Test Case 1.5.4 (Header Telemetry Compliance): OPUS 5.5 ACTIVE badge is eliminated from UI', () => {
    const pageContent = fs.readFileSync(path.resolve(__dirname, '../../../src/app/page.tsx'), 'utf-8');
    expect(pageContent).not.toContain('OPUS 5.5 ACTIVE');
    expect(pageContent).toContain('5 CHAINS INDEXED · TELEMETRY ACTIVE');
  });
});
