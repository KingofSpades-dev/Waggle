import { describe, it, expect } from 'vitest';
import { ROBINHOOD_CHAIN_ID, robinhoodChain, getRobinhoodPublicClient, SAFE_SINGLETON_ADDRESS, SAFE_FACTORY_ADDRESS } from '@/lib/viemClient';
import { PONDER_CONFIG, BACKFILL_92D_BLOCK_OFFSET } from '../../ponder.config';
import { detectContractCreationBlock } from '@/lib/collectors/traceDetector';

describe('Epic 6: Ponder Infrastructure & Safe Verification', () => {
  it('Test Case 2.1.1 (Viem Custom Chain 4663): Chain definition is configured with ID 4663 and valid RPC URL', () => {
    expect(robinhoodChain.id).toBe(ROBINHOOD_CHAIN_ID);
    expect(robinhoodChain.id).toBe(4663);
    expect(robinhoodChain.name).toBe('Robinhood Chain');
    expect(robinhoodChain.nativeCurrency.symbol).toBe('ETH');
    expect(robinhoodChain.rpcUrls.default.http[0]).toBeTruthy();

    const client = getRobinhoodPublicClient();
    expect(client).toBeDefined();
    expect(client.chain.id).toBe(4663);
  });

  it('Test Case 2.1.2 (Backfill Sync Configuration): Ponder config includes Robinhood network and 92-day backfill offset', () => {
    expect(PONDER_CONFIG.networks.robinhood).toBeDefined();
    expect(PONDER_CONFIG.networks.robinhood.chainId).toBe(4663);
    expect(PONDER_CONFIG.networks.robinhood.finalityBlockCount).toBe(32);

    // 92 days on Arbitrum stack (~1s blocks) = ~7.9M blocks
    expect(BACKFILL_92D_BLOCK_OFFSET).toBeGreaterThan(7_000_000);
    expect(PONDER_CONFIG.contracts.PonsFactory).toBeDefined();
    expect(PONDER_CONFIG.contracts.PoolsTradeFactory).toBeDefined();
    expect(PONDER_CONFIG.contracts.HoodFunFactory).toBeDefined();
  });

  it('Test Case 2.1.3 (Trace vs Binary Search Fallback): Detects contract creation block and triggers binary search fallback when trace fails', async () => {
    // Mock public client that simulates standard RPC (trace method unavailable)
    const mockClient: any = {
      request: async () => {
        throw new Error('Method trace_block not supported');
      },
      getBytecode: async ({ blockNumber }: { blockNumber: bigint }) => {
        // Contract deployed at block 100
        return blockNumber >= BigInt(100) ? '0x60806040...' : '0x';
      },
    };

    const result = await detectContractCreationBlock(
      mockClient,
      '0x1234567890123456789012345678901234567890' as `0x${string}`,
      { fromBlock: BigInt(50), toBlock: BigInt(150) }
    );

    expect(result).toBeDefined();
    expect(result.creationBlock).toBe(BigInt(100));
    expect(result.detectionMethod).toBe('ARCHIVE_BINARY_SEARCH');
    expect(result.isArchiveSearchUsed).toBe(true);
  });

  it('Test Case 2.1.4 (Safe Multisig Definition): Safe singleton and factory addresses are valid on Arbitrum stack', () => {
    expect(SAFE_SINGLETON_ADDRESS).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(SAFE_FACTORY_ADDRESS).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(SAFE_SINGLETON_ADDRESS.toLowerCase()).toBe('0x41f6252d04d10604b855e25b741566168763b407');
    expect(SAFE_FACTORY_ADDRESS.toLowerCase()).toBe('0x4e1dcdef7ed41d0f63b21114532b2e88a385f061');
  });
});
