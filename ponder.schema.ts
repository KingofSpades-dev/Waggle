/**
 * Ponder Database Schema for Waggle v2
 * Matches PostgreSQL schema with token-level deduplication and launch_pools relational table.
 */

export interface PonderVenue {
  id: string;
  name: string;
  key: string;
  chainId: string;
  venueType: 'launchpad' | 'pool';
  curveType: string;
  factoryAddress?: string;
  firstSeenBlock?: bigint;
  status: 'active' | 'paused' | 'inactive';
}

export interface PonderLaunch {
  id: string;
  chainId: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  tokenCreationTimestamp: bigint;
  tokenCreationBlock: bigint;
  venueId: string;
  firstTradeTimestamp?: bigint;
  initialLiquidityUsd: number;
  launchHourUtc: number;
  createdAt: bigint;
}

export interface PonderLaunchPool {
  id: string;
  launchId: string;
  poolAddress: string;
  venueId: string;
  poolType: 'bonding_curve' | 'amm';
  isPrimary: boolean;
  createdAt: bigint;
}
