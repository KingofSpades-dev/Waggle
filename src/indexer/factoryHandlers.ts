/**
 * Launchpad Factory Registry & Attribution Engine for Waggle v2 (Phase 2)
 */

export interface RegisteredFactory {
  name: string;
  key: string;
  chainKey: string;
  factoryAddress: string;
  curveType: string;
  status: 'active' | 'paused' | 'inactive';
}

export const ROBINHOOD_FACTORY_REGISTRY: Record<string, RegisteredFactory> = {
  '0x1111111111111111111111111111111111111101': {
    name: 'Pons',
    key: 'pons',
    chainKey: 'rh',
    factoryAddress: '0x1111111111111111111111111111111111111101',
    curveType: 'direct_liquidity',
    status: 'active',
  },
  '0x2222222222222222222222222222222222222202': {
    name: 'Pools.trade',
    key: 'pools_trade',
    chainKey: 'rh',
    factoryAddress: '0x2222222222222222222222222222222222222202',
    curveType: 'direct_liquidity',
    status: 'active',
  },
  '0x3333333333333333333333333333333333333303': {
    name: 'hood.fun',
    key: 'hood_fun',
    chainKey: 'rh',
    factoryAddress: '0x3333333333333333333333333333333333333303',
    curveType: 'bonding_curve',
    status: 'active',
  },
  '0x4444444444444444444444444444444444444404': {
    name: 'flap',
    key: 'flap',
    chainKey: 'rh',
    factoryAddress: '0x4444444444444444444444444444444444444404',
    curveType: 'bonding_curve',
    status: 'active',
  },
  '0x5555555555555555555555555555555555555505': {
    name: 'Noxa',
    key: 'noxa',
    chainKey: 'rh',
    factoryAddress: '0x5555555555555555555555555555555555555505',
    curveType: 'bonding_curve',
    status: 'paused', // Noxa paused
  },
  '0x6666666666666666666666666666666666666606': {
    name: 'LOOT',
    key: 'loot',
    chainKey: 'rh',
    factoryAddress: '0x6666666666666666666666666666666666666606',
    curveType: 'gaming_launchpad',
    status: 'active',
  },
  // Artemis Infrastructure on Robinhood Chain Mainnet (Chain ID: 4663)
  '0xeea9d0f7ee0958c6d59f25162be4e69ba60a0f71': {
    name: 'Artemis Launcher',
    key: 'artemis',
    chainKey: 'rh',
    factoryAddress: '0xeea9d0f7ee0958c6d59f25162be4e69ba60a0f71',
    curveType: 'atomic_launch',
    status: 'active',
  },
  '0x8bceaa40b9acdfaedf85adf4ff01f5ad6517937f': {
    name: 'Uniswap V2 (Robinhood)',
    key: 'uniswap_v2_rh',
    chainKey: 'rh',
    factoryAddress: '0x8bceaa40b9acdfaedf85adf4ff01f5ad6517937f',
    curveType: 'amm',
    status: 'active',
  },
};

export interface FactoryAttributionResult {
  venueKey: string;
  venueName: string;
  status: 'active' | 'paused' | 'inactive';
  isKnownVenue: boolean;
  poolType: 'bonding_curve' | 'amm';
}

/**
 * Resolves venue attribution for newly created pools/launches based on factory address.
 * Unregistered factories fall back to "unknown_venue".
 */
export function attributeFactoryLaunch(factoryAddress: string): FactoryAttributionResult {
  const normalized = (factoryAddress || '').toLowerCase();
  const match = Object.entries(ROBINHOOD_FACTORY_REGISTRY).find(
    ([addr]) => addr.toLowerCase() === normalized
  );

  if (match) {
    const venue = match[1];
    return {
      venueKey: venue.key,
      venueName: venue.name,
      status: venue.status,
      isKnownVenue: true,
      poolType: venue.curveType.includes('bonding') ? 'bonding_curve' : 'amm',
    };
  }

  return {
    venueKey: 'unknown_venue',
    venueName: 'Unknown / Generic Factory',
    status: 'active',
    isKnownVenue: false,
    poolType: 'amm',
  };
}
