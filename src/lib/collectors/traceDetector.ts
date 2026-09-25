import { PublicClient } from 'viem';

export interface ContractCreationDetectionResult {
  tokenAddress: string;
  creationBlock: bigint;
  detectionMethod: 'TRACE' | 'ARCHIVE_BINARY_SEARCH' | 'RECEIPT_FALLBACK';
  isArchiveSearchUsed: boolean;
}

/**
 * Detects contract creation block using RPC trace methods with fallback to
 * binary search via eth_getCode on Archive Node when trace methods are unavailable.
 */
export async function detectContractCreationBlock(
  client: PublicClient,
  tokenAddress: `0x${string}`,
  searchWindow: { fromBlock: bigint; toBlock: bigint }
): Promise<ContractCreationDetectionResult> {
  // 1. Attempt Trace API
  try {
    const traceResult = await (client as any).request({
      method: 'trace_block',
      params: [`0x${searchWindow.toBlock.toString(16)}`],
    });
    if (traceResult && Array.isArray(traceResult)) {
      // Find create action matching tokenAddress
      const match = traceResult.find(
        (t: any) => t.type === 'create' && t.result?.address?.toLowerCase() === tokenAddress.toLowerCase()
      );
      if (match) {
        return {
          tokenAddress,
          creationBlock: BigInt(match.blockNumber || searchWindow.toBlock),
          detectionMethod: 'TRACE',
          isArchiveSearchUsed: false,
        };
      }
    }
  } catch {
    // Trace method unavailable (standard on public EVM RPC endpoints)
  }

  // 2. Binary search fallback using eth_getCode
  let low = searchWindow.fromBlock;
  let high = searchWindow.toBlock;
  let firstSeenBlock = high;

  // Confirm contract exists at high block
  const highCode = await client.getBytecode({ address: tokenAddress, blockNumber: high });
  if (!highCode || highCode === '0x') {
    return {
      tokenAddress,
      creationBlock: high,
      detectionMethod: 'RECEIPT_FALLBACK',
      isArchiveSearchUsed: true,
    };
  }

  // Binary search to find exact block where code appears
  while (low <= high) {
    const mid = (low + high) / BigInt(2);
    try {
      const code = await client.getBytecode({ address: tokenAddress, blockNumber: mid });
      if (code && code !== '0x') {
        firstSeenBlock = mid;
        high = mid - BigInt(1); // Search earlier blocks
      } else {
        low = mid + BigInt(1); // Search later blocks
      }
    } catch {
      // If archive node has rate limit, fallback to window estimation
      break;
    }
  }

  return {
    tokenAddress,
    creationBlock: firstSeenBlock,
    detectionMethod: 'ARCHIVE_BINARY_SEARCH',
    isArchiveSearchUsed: true,
  };
}
