import { describe, it, expect } from 'vitest';
import { attributeFactoryLaunch, ROBINHOOD_FACTORY_REGISTRY } from '@/indexer/factoryHandlers';
import { processDualSignalLaunch, isUniswapLpToken, calculateFirstMinuteExtractionWindow } from '@/indexer/genericHandlers';
import { scoutProject } from '@/lib/scorer';

describe('Epic 7: Launchpad Factory Registry & Dual-Signal Discovery', () => {
  it('Test Case 2.2.1 (Factory Attribution): Registered factories attribute correctly, unregistered falls back to unknown_venue', () => {
    // 1. Pons attribution
    const pons = attributeFactoryLaunch('0x1111111111111111111111111111111111111101');
    expect(pons.venueKey).toBe('pons');
    expect(pons.venueName).toBe('Pons');
    expect(pons.isKnownVenue).toBe(true);
    expect(pons.status).toBe('active');

    // 2. Pools.trade attribution
    const poolsTrade = attributeFactoryLaunch('0x2222222222222222222222222222222222222202');
    expect(poolsTrade.venueKey).toBe('pools_trade');
    expect(poolsTrade.isKnownVenue).toBe(true);

    // 3. Unregistered factory fallback
    const unknown = attributeFactoryLaunch('0x9999999999999999999999999999999999999999');
    expect(unknown.venueKey).toBe('unknown_venue');
    expect(unknown.isKnownVenue).toBe(false);
  });

  it('Test Case 2.2.2 (LP Token Exclusion & True Birth Time): Excludes Uniswap LP tokens and preserves token creation timestamp', () => {
    // 1. Uniswap LP signature detected -> ignored
    const lpCheck = isUniswapLpToken(['0x0902f1ac']); // getReserves signature
    expect(lpCheck).toBe(true);

    const ignoredLp = processDualSignalLaunch({
      tokenAddress: '0xLpTokenAddress123',
      creationBlock: 500,
      creationTimestamp: 1700000000,
      firstTradeTimestamp: 1700000020,
      bytecodeSignatures: ['0x0902f1ac', '0x7464f216'],
    });
    expect(ignoredLp).toBeNull();

    // 2. Genuine token launch with first trade happening later
    const launch = processDualSignalLaunch({
      tokenAddress: '0xValidTokenAddress456',
      creationBlock: 550,
      creationTimestamp: 1700000000,
      firstTradeTimestamp: 1700000300, // Trade happened 300s after creation
    });

    expect(launch).not.toBeNull();
    expect(launch?.tokenCreationTimestamp).toBe(1700000000); // Backtracks to true birth time
    expect(launch?.firstTradeTimestamp).toBe(1700000300);

    // 3. First minute extraction window is strictly [creation, creation + 60s]
    const window = calculateFirstMinuteExtractionWindow(1700000000);
    expect(window.windowStart).toBe(1700000000);
    expect(window.windowEnd).toBe(1700000060);
  });

  it('Test Case 2.2.3 (Noxa Paused Exclusion): Noxa is marked PAUSED and excluded from recommendation verdict', async () => {
    // 1. Verify Noxa status in registry
    const noxa = ROBINHOOD_FACTORY_REGISTRY['0x5555555555555555555555555555555555555505'];
    expect(noxa).toBeDefined();
    expect(noxa.status).toBe('paused');

    // 2. Run scout project for Robinhood Chain archetype
    const result = await scoutProject({
      description: 'An institutional compliant asset tokenization primitive on Robinhood Chain.',
      constraints: { audience: 'none', treasury_usd: 15000 },
    });

    expect(result).toBeDefined();
    expect(result.verdict.venue_name).not.toBe('Noxa');
    if (result.recommended_launchpad) {
      expect(result.recommended_launchpad.name).not.toBe('Noxa');
    }
  });
});
