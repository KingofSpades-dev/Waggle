export interface EVMChainConfig {
  name: string;
  key: string;
  rpcUrl: string;
  chainId: number;
}

export class EVMRPCListener {
  private chains: Record<string, EVMChainConfig>;

  constructor() {
    const alchemyRaw = process.env.ALCHEMY_API_KEY || '';
    // Extract key if user pasted full URL like https://eth-mainnet.g.alchemy.com/v2/alch_31k8Ftt6zcO5XJlAgTeBm
    let alchemyKey = alchemyRaw.trim();
    if (alchemyKey.includes('/v2/')) {
      alchemyKey = alchemyKey.split('/v2/')[1] || alchemyKey;
    }

    const baseRpcUrl = (alchemyKey && alchemyKey.length > 0)
      ? `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`
      : (process.env.BASE_EVM_RPC_URL || 'https://mainnet.base.org');

    this.chains = {
      base: {
        name: 'Base',
        key: 'base',
        rpcUrl: baseRpcUrl,
        chainId: 8453
      },
      bnb: {
        name: 'BNB Chain',
        key: 'bnb',
        rpcUrl: process.env.BNB_EVM_RPC_URL || 'https://bsc-dataseed.binance.org',
        chainId: 56
      },
      rh: {
        name: 'Robinhood Chain',
        key: 'rh',
        rpcUrl: process.env.ROBINHOOD_RPC_URL || 'https://rpc.robinhoodchain.org',
        chainId: 7332
      },
      arc: {
        name: 'Arc Chain',
        key: 'arc',
        rpcUrl: process.env.ARC_RPC_URL || 'https://rpc.testnet.arc.network',
        chainId: parseInt(process.env.ARC_CHAIN_ID || '5042002', 10)
      }
    };
  }

  /**
   * Performs JSON-RPC eth_chainId test for a specified EVM chain key
   */
  async verifyChainId(chainKey: string): Promise<{ success: boolean; chainId?: number; error?: string }> {
    const config = this.chains[chainKey];
    if (!config || !config.rpcUrl) {
      return { success: false, error: `No RPC URL configured for EVM chain '${chainKey}'` };
    }

    try {
      const res = await fetch(config.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_chainId'
        })
      });

      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const json = await res.json();
      const decId = parseInt(json.result, 16);
      return { success: true, chainId: decId };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
