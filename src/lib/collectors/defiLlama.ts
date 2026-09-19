import { ChainData } from '../types';

export interface DefiLlamaChainResponse {
  gecko_id: string;
  tvl: number;
  tokenSymbol: string;
  name: string;
}

export class DefiLlamaAdapter {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.DEFILLAMA_API_BASE_URL || 'https://api.llama.fi';
  }

  /**
   * Fetches real-time TVL & chain level stats from DefiLlama API
   */
  async fetchChainMetrics(): Promise<Record<string, { tvl: number; freshness: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/v2/chains`, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 3600 }
      });

      if (!response.ok) {
        throw new Error(`DefiLlama API HTTP Error: ${response.status} ${response.statusText}`);
      }

      const data: DefiLlamaChainResponse[] = await response.json();
      const results: Record<string, { tvl: number; freshness: string }> = {};

      data.forEach(item => {
        const key = item.name.toLowerCase();
        results[key] = {
          tvl: item.tvl || 0,
          freshness: new Date().toISOString()
        };
      });

      return results;
    } catch (error) {
      console.error('[DefiLlamaAdapter] Ingestion failed:', error);
      // Fail independently & loudly as required by Waggle brief rule 4
      return {};
    }
  }
}
