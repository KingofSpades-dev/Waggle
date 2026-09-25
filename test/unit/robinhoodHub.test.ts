import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Epic 8: Robinhood Chain Dedicated Hub (/robinhood)', () => {
  it('Test Case 2.3.1 (Hub 5 Core Elements): robinhood/page.tsx includes leaderboard, heatmap, market share, gauge, and attestation widget', () => {
    const pagePath = path.resolve(__dirname, '../../src/app/robinhood/page.tsx');
    expect(fs.existsSync(pagePath)).toBe(true);

    const content = fs.readFileSync(pagePath, 'utf-8');

    // 1. Leaderboard with Robinhood venues
    expect(content).toContain('Robinhood Chain Leaderboard');
    expect(content).toContain('Launchpad Performance Rankings');
    expect(content).toContain('Pons');
    expect(content).toContain('Pools.trade');
    expect(content).toContain('hood.fun');
    expect(content).toContain('Noxa');
    expect(content).toContain('PAUSED');

    // 2. Hourly Heatmap UTC 00 - 23
    expect(content).toContain('Hourly Survival Heatmap (UTC)');
    expect(content).toContain('14:00 - 18:00 UTC'); // Peak window

    // 3. Share of launches by venue
    expect(content).toContain('Launchpad Market Share Distribution');
    expect(content).toContain('attributedSharePct');

    // 4. Registry Completeness Gauge
    expect(content).toContain('Factory Registry Completeness');
    expect(content).toContain('totalAttributedPct');

    // 5. Onchain Attestation Widget
    expect(content).toContain('Latest Onchain Attestation');
    expect(content).toContain('Merkle Root');
    expect(content).toContain('ArbSys L2 Block');
  });

  it('Test Case 2.3.2 (Social Card OpenGraph Route): OG image route exists and exports standard 1200x630 dimensions', () => {
    const ogPath = path.resolve(__dirname, '../../src/app/api/og/robinhood/route.tsx');
    expect(fs.existsSync(ogPath)).toBe(true);

    const content = fs.readFileSync(ogPath, 'utf-8');
    expect(content).toContain('ImageResponse');
    expect(content).toContain('width: 1200');
    expect(content).toContain('height: 630');
    expect(content).toContain('Robinhood Launchpad Leaderboard');
    expect(content).toContain('Pons');
  });
});
