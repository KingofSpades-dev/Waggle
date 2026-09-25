import { ROBINHOOD_CHAIN_ID } from './src/lib/viemClient';

/**
 * Ponder Indexer Configuration for Waggle v2
 * Focus: Robinhood Chain (ID: 4663) and Multi-Venue Factory Ingestion
 *
 * Ponder natively manages:
 * - Deterministic block checkpointing
 * - Reorg rollbacks and safe block confirmations
 * - PostgreSQL direct persistence
 * - Factory event tracking (Uniswap/Pons/Pools.trade/hood.fun)
 */

// 92-Day Backfill calculation:
// On Arbitrum Nitro (avg ~1s block time):
// 92 days * 86,400 seconds = ~7,948,800 blocks
export const BACKFILL_92D_BLOCK_OFFSET = 7_948_800;

export const PONDER_CONFIG = {
  database: {
    kind: 'postgres',
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/waggle',
  },
  networks: {
    robinhood: {
      chainId: ROBINHOOD_CHAIN_ID,
      transport: process.env.ROBINHOOD_RPC_URL || 'https://rpc.robinhood.com',
      pollingInterval: 1_000,
      maxRequestsPerSecond: 50,
      finalityBlockCount: 32, // Safe block confirmation window
    },
  },
  contracts: {
    // 1. Pons Launchpad Factory
    PonsFactory: {
      network: 'robinhood',
      address: '0x1111111111111111111111111111111111111101',
      startBlock: 1,
      factory: {
        event: 'event PairCreated(address indexed token0, address indexed token1, address pair, uint256)',
        parameter: 'pair',
      },
    },
    // 2. Pools.trade Factory
    PoolsTradeFactory: {
      network: 'robinhood',
      address: '0x2222222222222222222222222222222222222202',
      startBlock: 1,
      factory: {
        event: 'event PoolCreated(address indexed tokenA, address indexed tokenB, address pool, uint24 fee)',
        parameter: 'pool',
      },
    },
    // 3. hood.fun Bonding Curve Factory
    HoodFunFactory: {
      network: 'robinhood',
      address: '0x3333333333333333333333333333333333333303',
      startBlock: 1,
      factory: {
        event: 'event TokenLaunched(address indexed token, address indexed bondingCurve, address creator)',
        parameter: 'bondingCurve',
      },
    },
    // 4. flap Factory
    FlapFactory: {
      network: 'robinhood',
      address: '0x4444444444444444444444444444444444444404',
      startBlock: 1,
      factory: {
        event: 'event FlapTokenCreated(address indexed token, address indexed pool)',
        parameter: 'pool',
      },
    },
    // 5. Noxa Factory (Paused)
    NoxaFactory: {
      network: 'robinhood',
      address: '0x5555555555555555555555555555555555555505',
      startBlock: 1,
      factory: {
        event: 'event NoxaPairCreated(address indexed token, address indexed pair)',
        parameter: 'pair',
      },
    },
    // 6. LOOT Factory
    LootFactory: {
      network: 'robinhood',
      address: '0x6666666666666666666666666666666666666606',
      startBlock: 1,
      factory: {
        event: 'event LootDeployed(address indexed token, address indexed pool)',
        parameter: 'pool',
      },
    },
    // 7. Artemis Launcher (Robinhood Chain Mainnet)
    ArtemisLauncher: {
      network: 'robinhood',
      address: '0xeea9d0f7ee0958c6d59f25162be4e69ba60a0f71',
      startBlock: 66_953_870,
      factory: {
        event: 'event TokenLaunched(address indexed token, address indexed pair, address launcher)',
        parameter: 'pair',
      },
    },
    // 8. Uniswap V2 Factory (Robinhood Chain Canonical)
    UniswapV2Factory: {
      network: 'robinhood',
      address: '0x8bceaa40b9acdfaedf85adf4ff01f5ad6517937f',
      startBlock: 66_953_870,
      factory: {
        event: 'event PairCreated(address indexed token0, address indexed token1, address pair, uint256)',
        parameter: 'pair',
      },
    },
  },
};

export default PONDER_CONFIG;
