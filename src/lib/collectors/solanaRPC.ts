export class SolanaRPCListener {
  private rpcUrl: string;

  constructor() {
    const heliusKey = process.env.HELIUS_API_KEY;
    if (heliusKey && heliusKey.trim().length > 0) {
      this.rpcUrl = `https://mainnet.helius-rpc.com/?api-key=${heliusKey.trim()}`;
    } else {
      this.rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    }
  }

  /**
   * Fetches recent Raydium / Pump.fun Program logs to detect new pool launches
   */
  async fetchRecentPoolLogs(): Promise<any[]> {
    try {
      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'waggle-solana-ingest',
          method: 'getProgramAccounts',
          params: [
            '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8', // Raydium Liquidity Program V4
            {
              encoding: 'jsonParsed',
              dataSlice: { offset: 0, length: 128 },
              filters: [{ dataSize: 752 }]
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Solana RPC HTTP Error: ${response.status}`);
      }

      const json = await response.json();
      return json.result || [];
    } catch (error) {
      console.warn('[SolanaRPCListener] Failed to fetch program logs from RPC:', error);
      return [];
    }
  }
}
