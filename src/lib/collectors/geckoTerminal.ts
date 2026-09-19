export interface GeckoPoolAttributes {
  name: string;
  address: string;
  base_token_price_usd: string;
  quote_token_price_usd: string;
  reserve_in_usd: string;
  volume_usd: { h24: string };
  pool_created_at: string;
}

export interface GeckoPoolItem {
  id: string;
  type: string;
  attributes: GeckoPoolAttributes;
}

export class GeckoTerminalAdapter {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.GECKOTERMINAL_API_BASE_URL || 'https://api.geckoterminal.com/api/v2';
  }

  /**
   * Fetches newly created pools for a specific network (e.g., 'solana', 'base', 'bsc')
   */
  async fetchNewPools(network: string): Promise<GeckoPoolItem[]> {
    try {
      const url = `${this.baseUrl}/networks/${network}/new_pools?page=1`;
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 300 }
      });

      if (!response.ok) {
        throw new Error(`GeckoTerminal API HTTP Error: ${response.status} for network ${network}`);
      }

      const json = await response.json();
      return (json.data || []) as GeckoPoolItem[];
    } catch (error) {
      console.error(`[GeckoTerminalAdapter] Ingestion failed for ${network}:`, error);
      return [];
    }
  }

  /**
   * Fetches recent trade history for extraction calculations
   */
  async fetchPoolTrades(network: string, poolAddress: string): Promise<any[]> {
    try {
      const url = `${this.baseUrl}/networks/${network}/pools/${poolAddress}/trades`;
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) return [];
      const json = await response.json();
      return json.data || [];
    } catch (error) {
      console.error(`[GeckoTerminalAdapter] Failed to fetch trades for ${poolAddress}:`, error);
      return [];
    }
  }
}
