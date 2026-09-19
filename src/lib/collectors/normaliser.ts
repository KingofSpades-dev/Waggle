import { GeckoPoolItem } from './geckoTerminal';

export interface InternalNormalizedLaunch {
  chainKey: string;
  venueKey: string;
  tokenAddress: string;
  poolAddress: string;
  blockTimestamp: Date;
  launchHourUtc: number;
  initialLiquidityUsd: number;
  rawVendorPayload: any;
}

export interface InternalNormalizedTrade {
  launchAddress: string;
  txHash: string;
  traderWallet: string;
  secondsAfterLaunch: number;
  isBuy: boolean;
  amountUsd: number;
}

export class Normaliser {
  /**
   * Normalizes GeckoTerminal Pool Payload into internal Launch schema
   */
  static normalizeGeckoPool(item: GeckoPoolItem, chainKey: string): InternalNormalizedLaunch {
    const attr = item.attributes;
    const createdAt = attr.pool_created_at ? new Date(attr.pool_created_at) : new Date();
    
    // Map venue key from pool name (e.g., 'Pump.fun / SOL' -> 'pump_fun')
    let venueKey = "default_amm";
    const nameLower = attr.name.toLowerCase();
    if (nameLower.includes("pump")) venueKey = "pump_fun";
    else if (nameLower.includes("bonk")) venueKey = "bonk_fun";
    else if (nameLower.includes("clanker")) venueKey = "clanker";
    else if (nameLower.includes("four")) venueKey = "four_meme";

    return {
      chainKey,
      venueKey,
      tokenAddress: attr.address,
      poolAddress: attr.address,
      blockTimestamp: createdAt,
      launchHourUtc: createdAt.getUTCHours(),
      initialLiquidityUsd: parseFloat(attr.reserve_in_usd || "0"),
      rawVendorPayload: item
    };
  }

  /**
   * Normalizes trade log into internal TradeFirstHour schema
   */
  static normalizeTrade(rawTrade: any, launchAddress: string, launchTimestamp: Date): InternalNormalizedTrade {
    const tradeTime = rawTrade.attributes?.block_timestamp 
      ? new Date(rawTrade.attributes.block_timestamp) 
      : new Date();
    
    const diffSec = Math.max(0, Math.floor((tradeTime.getTime() - launchTimestamp.getTime()) / 1000));

    return {
      launchAddress,
      txHash: rawTrade.id || `tx_${Math.random().toString(36).substring(2)}`,
      traderWallet: rawTrade.attributes?.trader_address || 'unknown_wallet',
      secondsAfterLaunch: diffSec,
      isBuy: rawTrade.attributes?.kind === 'buy',
      amountUsd: parseFloat(rawTrade.attributes?.volume_in_usd || '0')
    };
  }
}
