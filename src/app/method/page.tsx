import React from 'react';
import Link from 'next/link';
import { WEIGHTS, METRICS_VERSION, WEIGHTS_VERSION, CLASSIFIER_VERSION } from '@/lib/mockData';
import { WAGGLE_ATTESTOR_ADDRESS } from '@/lib/viemClient';

export default function MethodPage() {
  return (
    <div className="wrap">
      <section className="hero">
        <div className="eyebrow">methodology & transparency</div>
        <h1>Public Method & Conflict Policy</h1>
        <p className="lede">
          Waggle exists to publish the comparison that does not exist in public. Every definition, weight, and threshold is versioned, frozen, and published before it takes effect.
        </p>
      </section>

      <section>
        <h2>Current Version Numbers</h2>
        <div className="cellinfo" style={{ marginTop: 16 }}>
          <div className="kv">
            <div>Metrics Engine Version</div>
            <div><code>{METRICS_VERSION}</code></div>
            <div>Weights Model Version</div>
            <div><code>{WEIGHTS_VERSION}</code></div>
            <div>Taxonomy Classifier Version</div>
            <div><code>{CLASSIFIER_VERSION}</code></div>
          </div>
        </div>
      </section>

      <section>
        <h2>Metric Definitions</h2>
        <div className="cards">
          <div className="card">
            <h3>Strict Survival (Met Thresholds at Day 7)</h3>
            <p>A launch is strictly surviving at T+7 days if it meets both the minimum liquidity threshold (<code>MIN_SURVIVAL_LIQUIDITY_USD = $1,000 USD</code>) and trade count threshold (<code>MIN_SURVIVAL_TRADES_24H = 50 trades/24h</code>). Both are named constants in code.</p>
          </div>
          <div className="card">
            <h3>Active Survival (Any Trade in 7 Days)</h3>
            <p>A launch has active survival if at least one organic swap transaction was executed in the preceding 7 days, regardless of depth.</p>
          </div>
          <div className="card">
            <h3>First Minute Extraction</h3>
            <p>Share of first minute volume taken by wallets that buy inside sixty seconds of the first block, sell within thirty minutes, and hold nothing after. Lower is healthier.</p>
          </div>
          <div className="card">
            <h3>Adjusted Volume</h3>
            <p>Raw volume minus flow matching wash patterns. Published beside raw volume always, with the adjustment method linked.</p>
          </div>
        </div>
      </section>

      <section>
        <h2>Scoring Dimension Weights</h2>
        <div className="weights">
          {Object.entries(WEIGHTS).map(([k, v]) => (
            <div className="wrow" key={k}>
              <span style={{ color: 'var(--dim)' }}>
                {k === 'chain' && 'chain fit'}
                {k === 'venue' && 'venue fit'}
                {k === 'meta' && 'meta heat'}
                {k === 'hour' && 'hour window'}
              </span>
              <span className="t">
                <span className="f" style={{ width: `${(v / 35) * 100}%` }}></span>
              </span>
              <span>{v}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="check-numbers" style={{ marginTop: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2>How to Check Our Numbers Yourself</h2>
            <p className="lede" style={{ margin: '4px 0 0' }}>
              You do not need to trust Waggle, our servers, or our word. Every hourly metrics snapshot is cryptographically anchored onchain.
            </p>
          </div>
          <Link
            href="/verify"
            className="pill"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#2563eb',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: 8,
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.82rem'
            }}
          >
            <span>Open Interactive Verifier ↗</span>
          </Link>
        </div>

        <div className="cards" style={{ marginTop: 20 }}>
          <div className="card">
            <h3>1. What is a Merkle Proof? (Layman Explanation)</h3>
            <p>
              Imagine a digital wax seal for tens of thousands of data points. Storing every individual launch and liquidity metric directly on the blockchain would cost exorbitant gas fees. Instead, Waggle bundles all hourly metrics into a mathematical tree (a <b>Merkle Tree</b>) and publishes only the single 32-byte <b>Root Hash</b> directly to the <code>WaggleAttestor</code> smart contract on Robinhood Chain.
            </p>
          </div>

          <div className="card">
            <h3>2. The Cryptographic Invariant</h3>
            <p>
              Even changing a single decimal point (e.g. changing 49.0% survival to 49.1%) completely changes the leaf hash, which cascades and produces a completely different Root Hash. An altered number <b>cannot mathematically match</b> the root stored in the Robinhood Chain smart contract.
            </p>
          </div>

          <div className="card">
            <h3>3. Step-by-Step DIY Verification</h3>
            <ol style={{ margin: 0, paddingLeft: 18, color: 'var(--dim)', fontSize: '0.88rem', lineHeight: 1.6 }}>
              <li>
                <b>Query the Contract:</b> Inspect <code>WaggleAttestor</code> at <a href={`https://robinhoodchain.blockscout.com/address/${WAGGLE_ATTESTOR_ADDRESS || '0x7fc7f477b12045cfefbde9e692812f64391b969b'}`} target="_blank" rel="noreferrer" style={{ color: '#0284c7', textDecoration: 'underline' }}><code>{WAGGLE_ATTESTOR_ADDRESS || '0x7fc7f477b12045cfefbde9e692812f64391b969b'}</code></a> on Robinhood Chain Blockscout and read <code>getAttestation(snapshotId)</code> to see the published Merkle Root and ArbSys block checkpoint.
              </li>
              <li>
                <b>Fetch the Public Proof:</b> Call our open endpoint <code>GET /v1/proof?chain_id=rh&venue_id=hood_fun&hour=16</code> to obtain the leaf row and sibling hashes.
              </li>
              <li>
                <b>Hash with Standard Libraries:</b> Recompute using <code>@openzeppelin/merkle-tree</code> StandardMerkleTree standard: <code>keccak256(keccak256(leaf))</code>.
              </li>
              <li>
                <b>Compare:</b> If your computed root equals the onchain root, the data is 100% genuine and uncorrupted.
              </li>
            </ol>
          </div>

          <div className="card">
            <h3>4. Open Source Verification Code</h3>
            <p style={{ margin: '0 0 10px' }}>You can verify any snapshot proof in 5 lines of JavaScript in your own terminal:</p>
            <pre style={{ margin: 0, padding: 12, background: '#0f172a', color: '#38bdf8', borderRadius: 8, fontSize: '0.74rem', overflowX: 'auto', fontFamily: 'monospace' }}>
{`import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
const valid = StandardMerkleTree.verify(
  onchainRoot,
  ["string", "string", "uint8", "uint64", "uint64", "uint64"],
  leafData,
  proof
);
console.log("Proof Valid:", valid); // true`}
            </pre>
          </div>
        </div>
      </section>

      <section style={{ marginTop: 36 }}>
        <div className="never">
          <h3>Conflict of Interest Policy & Disclosures</h3>
          <ul>
            <li>Never accept payment from any venue for placement, scoring, or removal.</li>
            <li>Never present raw volume as demand without adjusted volume beside it.</li>
            <li>Never show a figure without its sample size and confidence level.</li>
            <li>Submissions stay private and are never surfaced in public dashboards or aggregate charts.</li>
            <li><b>Factual disclosure:</b> Modus launched a token on Pons.</li>
          </ul>
        </div>
      </section>

      <footer style={{ marginTop: 60, textAlign: 'center', fontSize: '0.8rem', color: 'var(--dim)' }}>
        <p>Last updated: September 2026 · Waggle Protocol v2</p>
        <p>
          <Link href="/terms" style={{ color: '#2563eb', marginRight: 14 }}>Terms of Service</Link>
          <Link href="/privacy" style={{ color: '#2563eb', marginRight: 14 }}>Privacy Policy</Link>
          <Link href="/verify" style={{ color: '#2563eb' }}>Verify Onchain</Link>
        </p>
      </footer>
    </div>
  );
}
