export interface BirdeyeTokenOverview {
  address: string;
  decimals: number;
  symbol: string;
  name: string;
  liquidity: number;
  price: number;
  trade24h: number;
  v24hUSD: number;
}

export class BirdeyeAdapter {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = 'https://public-api.birdeye.so';
    this.apiKey = process.env.BIRDEYE_API_KEY || '';
  }

  /**
   * Fetches detailed token & liquidity depth for Solana tokens
   */
  async fetchTokenOverview(tokenAddress: string): Promise<BirdeyeTokenOverview | null> {
    if (!this.apiKey || this.apiKey.trim().length === 0) {
      console.warn('[BirdeyeAdapter] BIRDEYE_API_KEY is not configured in .env.local.');
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/defi/token_overview?address=${tokenAddress}`, {
        headers: {
          'Accept': 'application/json',
          'X-API-KEY': this.apiKey.trim(),
          'x-chain': 'solana'
        },
        next: { revalidate: 300 }
      });

      if (!response.ok) {
        throw new Error(`Birdeye API HTTP Error: ${response.status} ${response.statusText}`);
      }

      const json = await response.json();
      if (!json.success || !json.data) return null;

      const data = json.data;
      return {
        address: data.address,
        decimals: data.decimals,
        symbol: data.symbol,
        name: data.name,
        liquidity: data.liquidity || 0,
        price: data.value || 0,
        trade24h: data.trade24h || 0,
        v24hUSD: data.v24hUSD || 0
      };
    } catch (error) {
      console.error(`[BirdeyeAdapter] Failed to fetch overview for ${tokenAddress}:`, error);
      return null;
    }
  }
}
