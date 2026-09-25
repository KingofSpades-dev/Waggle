/**
 * Generic Token Detection & Dual-Signal Discovery Handler (TASK-2.2.2)
 *
 * Rules:
 * 1. Filter and ignore Uniswap V2/V3 LP tokens.
 * 2. Use first trade as trigger, but backtrack to token_creation_timestamp for true birth time.
 * 3. Calculate first-minute extraction from creation time, not trade time.
 */

export interface TokenBirthEvent {
  tokenAddress: string;
  tokenCreationTimestamp: number;
  tokenCreationBlock: number;
  firstTradeTimestamp?: number;
  isLpToken: boolean;
  attributedVenueKey: string;
}

// Known DEX Pair / LP bytecode signatures or method signatures (e.g. getReserves, kLast, feeGrowthGlobal0X128)
const LP_SIGNATURES = [
  '0x0902f1ac', // getReserves()
  '0x7464f216', // kLast()
  '0x3850c7bd', // feeGrowthGlobal0X128()
];

export function isUniswapLpToken(bytecodeOrMethods: string[]): boolean {
  if (!bytecodeOrMethods || bytecodeOrMethods.length === 0) return false;
  return bytecodeOrMethods.some(sig => LP_SIGNATURES.includes(sig.toLowerCase()));
}

export function processDualSignalLaunch(params: {
  tokenAddress: string;
  creationBlock: number;
  creationTimestamp: number;
  firstTradeTimestamp: number;
  bytecodeSignatures?: string[];
  factoryAddress?: string;
}): TokenBirthEvent | null {
  // 1. Exclude LP tokens
  if (params.bytecodeSignatures && isUniswapLpToken(params.bytecodeSignatures)) {
    return null; // Ignore LP token minting
  }

  // 2. Determine True Birth Time: must be <= firstTradeTimestamp
  const trueBirthTimestamp = Math.min(params.creationTimestamp, params.firstTradeTimestamp);

  return {
    tokenAddress: params.tokenAddress,
    tokenCreationTimestamp: trueBirthTimestamp,
    tokenCreationBlock: params.creationBlock,
    firstTradeTimestamp: params.firstTradeTimestamp,
    isLpToken: false,
    attributedVenueKey: params.factoryAddress ? 'registered_factory' : 'unknown_venue',
  };
}

export function calculateFirstMinuteExtractionWindow(tokenCreationTimestamp: number): {
  windowStart: number;
  windowEnd: number;
} {
  return {
    windowStart: tokenCreationTimestamp,
    windowEnd: tokenCreationTimestamp + 60, // strictly 60 seconds from true creation
  };
}
