import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contractAddress, txHash, deployer, blockNumber } = body;

    if (!contractAddress || !/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      return NextResponse.json(
        { error: 'Invalid contract address. Must be a 40-character hex EVM address.' },
        { status: 400 }
      );
    }

    const normalizedAddress = contractAddress.toLowerCase();
    const deploymentRecord = {
      network: 'Robinhood Chain Mainnet',
      chainId: 4663,
      contractName: 'WaggleAttestor',
      contractAddress: contractAddress,
      deployer: deployer || '0xcdc52c6c98ee5775d1d6faee5f7f8329d1e1ac8a',
      txHash: txHash || null,
      blockNumber: blockNumber || null,
      deployedAt: new Date().toISOString(),
      explorerContractUrl: `https://robinhoodchain.blockscout.com/address/${contractAddress}`,
      explorerTxUrl: txHash ? `https://robinhoodchain.blockscout.com/tx/${txHash}` : null
    };

    // 1. Save to deployments record file
    const deploymentsDir = path.join(process.cwd(), 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    const deploymentFile = path.join(deploymentsDir, 'robinhood-mainnet.json');
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentRecord, null, 2), 'utf-8');

    // 2. Update .env.local
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf-8');
      if (envContent.includes('NEXT_PUBLIC_WAGGLE_ATTESTOR_ADDRESS=')) {
        envContent = envContent.replace(
          /NEXT_PUBLIC_WAGGLE_ATTESTOR_ADDRESS="?[^"\r\n]*"?/,
          `NEXT_PUBLIC_WAGGLE_ATTESTOR_ADDRESS="${contractAddress}"`
        );
      } else {
        envContent += `\nNEXT_PUBLIC_WAGGLE_ATTESTOR_ADDRESS="${contractAddress}"\n`;
      }
      fs.writeFileSync(envPath, envContent, 'utf-8');
    }

    // 3. Update default fallback in src/lib/viemClient.ts
    const viemClientPath = path.join(process.cwd(), 'src', 'lib', 'viemClient.ts');
    if (fs.existsSync(viemClientPath)) {
      let viemContent = fs.readFileSync(viemClientPath, 'utf-8');
      // Replace fallback address if it still has placeholder
      viemContent = viemContent.replace(
        /export const WAGGLE_ATTESTOR_ADDRESS = \(process\.env\.NEXT_PUBLIC_WAGGLE_ATTESTOR_ADDRESS \|\| '[^']*'\)/,
        `export const WAGGLE_ATTESTOR_ADDRESS = (process.env.NEXT_PUBLIC_WAGGLE_ATTESTOR_ADDRESS || '${contractAddress}')`
      );
      fs.writeFileSync(viemClientPath, viemContent, 'utf-8');
    }

    return NextResponse.json({
      success: true,
      contractAddress,
      record: deploymentRecord,
      message: `Waggle configuration updated! WaggleAttestor is now bound to ${contractAddress}`
    });
  } catch (error: any) {
    console.error('Failed to record deployment:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to record deployment' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const deploymentFile = path.join(process.cwd(), 'deployments', 'robinhood-mainnet.json');
    if (fs.existsSync(deploymentFile)) {
      const data = JSON.parse(fs.readFileSync(deploymentFile, 'utf-8'));
      return NextResponse.json({ deployed: true, data });
    }
    return NextResponse.json({
      deployed: false,
      contractAddress: process.env.NEXT_PUBLIC_WAGGLE_ATTESTOR_ADDRESS || null
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
