import React from 'react';
import Link from 'next/link';
import { WEIGHTS, METRICS_VERSION, WEIGHTS_VERSION, CLASSIFIER_VERSION } from '@/lib/mockData';
import { WAGGLE_ATTESTOR_ADDRESS } from '@/lib/viemClient';

const WEIGHT_DETAILS: Record<string, { label: string; desc: string }> = {
  chain: { label: 'chain fit', desc: '7-day survival baseline & DEX liquidity depth across the chain' },
  venue: { label: 'venue fit', desc: 'Bonding curve mechanics, graduation rate & initial liquidity' },
  meta: { label: 'meta heat', desc: 'Taxonomy demand score (AI agent, meme, DeFi, game, RWA)' },
  hour: { label: 'hour window', desc: 'Diurnal UTC liquidity peak & bot extraction avoidance' }
};

export default function MethodPage() {
  return (
    <div className="wrap">
      {/* Hero Header */}
      <section className="hero">
        <div className="eyebrow">methodology & transparency</div>
        <h1>Public Method & Conflict Policy</h1>
        <p className="lede">
          Waggle exists to publish the comparison that does not exist in public. Every definition, weight, and threshold is versioned, frozen, and published before it takes effect.
        </p>
      </section>

      {/* Version Numbers Cards */}
      <section style={{ marginBottom: 32 }}>
        <h2>Current Version Numbers</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
          marginTop: 16
        }}>
          <div className="card" style={{ padding: '14px 16px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--dim)', textTransform: 'uppercase', fontWeight: 600 }}>Metrics Engine</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy-900)', fontFamily: 'monospace', margin: '4px 0' }}>
              {METRICS_VERSION}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--dim)' }}>Fixed-point deterministic serializer</span>
          </div>

          <div className="card" style={{ padding: '14px 16px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--dim)', textTransform: 'uppercase', fontWeight: 600 }}>Weights Model</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy-900)', fontFamily: 'monospace', margin: '4px 0' }}>
              {WEIGHTS_VERSION}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--dim)' }}>4 independent structural vectors</span>
          </div>

          <div className="card" style={{ padding: '14px 16px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--dim)', textTransform: 'uppercase', fontWeight: 600 }}>Taxonomy Classifier</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy-900)', fontFamily: 'monospace', margin: '4px 0' }}>
              {CLASSIFIER_VERSION}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--dim)' }}>AI agent, meme, DeFi, game, RWA</span>
          </div>

          <div className="card" style={{ padding: '14px 16px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--dim)', textTransform: 'uppercase', fontWeight: 600 }}>Attestation Protocol</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981', fontFamily: 'monospace', margin: '4px 0' }}>
              WaggleAttestor
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--dim)' }}>Robinhood Chain (ID: 4663)</span>
          </div>
        </div>
      </section>

      {/* Metric Definitions */}
      <section style={{ marginBottom: 32 }}>
        <h2>Metric Definitions</h2>
        <div className="cards" style={{ marginTop: 16 }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <h3 style={{ margin: 0 }}>Strict Survival (Met Thresholds at Day 7)</h3>
              <span className="conf c-high" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>Strict</span>
            </div>
            <p>
              A launch is strictly surviving at T+7 days if it meets both the minimum liquidity threshold (<code>MIN_SURVIVAL_LIQUIDITY_USD = $1,000 USD</code>) and trade count threshold (<code>MIN_SURVIVAL_TRADES_24H = 50 trades/24h</code>). Both are named constants in code.
            </p>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <h3 style={{ margin: 0 }}>Active Survival (Any Trade in 7 Days)</h3>
              <span className="conf" style={{ fontSize: '0.68rem', padding: '2px 6px', background: 'var(--gray-50)', border: '1px solid var(--line)' }}>Active</span>
            </div>
            <p>
              A launch has active survival if at least one organic swap transaction was executed in the preceding 7 days, regardless of depth.
            </p>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <h3 style={{ margin: 0 }}>First Minute Extraction</h3>
              <span className="conf" style={{ fontSize: '0.68rem', padding: '2px 6px', background: 'rgba(217, 119, 6, 0.1)', color: '#d97706', border: '1px solid rgba(217, 119, 6, 0.3)' }}>Anti-MEV</span>
            </div>
            <p>
              Share of first minute volume taken by wallets that buy inside sixty seconds of the first block, sell within thirty minutes, and hold nothing after. Lower is healthier.
            </p>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <h3 style={{ margin: 0 }}>Adjusted Volume</h3>
              <span className="conf" style={{ fontSize: '0.68rem', padding: '2px 6px', background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', border: '1px solid rgba(2, 132, 199, 0.3)' }}>Wash Filter</span>
            </div>
            <p>
              Raw volume minus flow matching wash patterns. Published beside raw volume always, with the adjustment method linked.
            </p>
          </div>
        </div>
      </section>

      {/* Scoring Dimension Weights */}
      <section style={{ marginBottom: 36 }}>
        <div className="weights-panel">
          <div className="weights-header">
            <div className="weights-title-group">
              <span className="weights-tag">Hypothesis Model</span>
              <h3>Composite Fit Weighting System</h3>
              <p>How Waggle calculates the 0–100 structural fit score across four independent on-chain vectors.</p>
            </div>
            <div className="weights-total-badge">
              <span className="total-num">100</span>
              <span className="total-label">Total Pts</span>
            </div>
          </div>

          <div className="weights-grid">
            {Object.entries(WEIGHTS).map(([k, v]) => {
              const info = WEIGHT_DETAILS[k] || { label: k, desc: '' };
              const fillClass = `fill-${k}`;
              return (
                <div className="witem" key={k}>
                  <div className="witem-top">
                    <div className="witem-label">
                      <i className={`wchip wchip-${k}`}></i>
                      <span className="witem-name">{info.label}</span>
                    </div>
                    <div className="witem-val">
                      <b>{v}</b> <span>pts ({v}%)</span>
                    </div>
                  </div>
                  <div className="wtrack">
                    <div
                      className={`wfill ${fillClass}`}
                      style={{ width: `${(v / 35) * 100}%` }}
                    ></div>
                  </div>
                  <div className="witem-desc">{info.desc}</div>
                </div>
              );
            })}
          </div>

          <p className="weights-footer-note">
            Starting weights, treated as a hypothesis. Any change is evaluated against held out launches before it ships.
          </p>
        </div>
      </section>

      {/* How to Check Our Numbers Yourself */}
      <section id="check-numbers" style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="eyebrow">cryptographic verification</div>
            <h2 style={{ margin: '2px 0 0' }}>How to Check Our Numbers Yourself</h2>
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
              fontSize: '0.82rem',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
            }}
          >
            <span>Open Interactive Verifier ↗</span>
          </Link>
        </div>

        {/* 2x2 Balanced Grid */}
        <div className="method-check-grid">
          {/* Card 1: What is a Merkle Proof? */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{
                background: 'rgba(37, 99, 235, 0.1)',
                color: '#2563eb',
                width: 24,
                height: 24,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 800
              }}>1</span>
              <h3 style={{ margin: 0, fontSize: '0.98rem' }}>What is a Merkle Proof? (Layman Explanation)</h3>
            </div>
            <p style={{ margin: 0, lineHeight: 1.6, color: 'var(--dim)', fontSize: '0.88rem' }}>
              Imagine a digital wax seal for tens of thousands of data points. Storing every individual launch and liquidity metric directly on the blockchain would cost exorbitant gas fees. Instead, Waggle bundles all hourly metrics into a mathematical tree (a <b>Merkle Tree</b>) and publishes only the single 32-byte <b>Root Hash</b> directly to the <code>WaggleAttestor</code> smart contract on Robinhood Chain.
            </p>
          </div>

          {/* Card 2: The Cryptographic Invariant */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                width: 24,
                height: 24,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 800
              }}>2</span>
              <h3 style={{ margin: 0, fontSize: '0.98rem' }}>The Cryptographic Invariant</h3>
            </div>
            <p style={{ margin: 0, lineHeight: 1.6, color: 'var(--dim)', fontSize: '0.88rem' }}>
              Even changing a single decimal point (e.g. changing 49.0% survival to 49.1%) completely changes the leaf hash, which cascades and produces a completely different Root Hash. An altered number <b>cannot mathematically match</b> the root stored in the Robinhood Chain smart contract.
            </p>
          </div>

          {/* Card 3: Step-by-Step DIY Verification */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{
                background: 'rgba(217, 119, 6, 0.1)',
                color: '#d97706',
                width: 24,
                height: 24,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 800
              }}>3</span>
              <h3 style={{ margin: 0, fontSize: '0.98rem' }}>Step-by-Step DIY Verification</h3>
            </div>
            <ol style={{ margin: 0, paddingLeft: 18, color: 'var(--dim)', fontSize: '0.84rem', lineHeight: 1.65 }}>
              <li style={{ marginBottom: 6 }}>
                <b>Query the Contract:</b> Inspect <code>WaggleAttestor</code> at <a href={`https://robinhoodchain.blockscout.com/address/${WAGGLE_ATTESTOR_ADDRESS}`} target="_blank" rel="noreferrer" style={{ color: '#0284c7', textDecoration: 'underline', wordBreak: 'break-all' }}><code>{WAGGLE_ATTESTOR_ADDRESS}</code></a> on Robinhood Chain Blockscout and call <code>rootOf(snapshotId)</code>.
              </li>
              <li style={{ marginBottom: 6 }}>
                <b>Fetch the Public Proof:</b> Call our open endpoint <code>GET /v1/proof?snapshot_id=101&venue_key=pons</code> to obtain the leaf row and sibling hashes.
              </li>
              <li style={{ marginBottom: 6 }}>
                <b>Hash with Standard Libraries:</b> Recompute using <code>@openzeppelin/merkle-tree</code> StandardMerkleTree standard: <code>keccak256(keccak256(leaf))</code>.
              </li>
              <li>
                <b>Compare:</b> If your computed root equals the onchain root, the data is 100% genuine and uncorrupted.
              </li>
            </ol>
          </div>

          {/* Card 4: Open Source Verification Code */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{
                background: 'rgba(123, 69, 216, 0.1)',
                color: '#7b45d8',
                width: 24,
                height: 24,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 800
              }}>4</span>
              <h3 style={{ margin: 0, fontSize: '0.98rem' }}>Open Source Verification Code</h3>
            </div>
            <p style={{ margin: '0 0 8px', fontSize: '0.84rem', color: 'var(--dim)' }}>
              Verify any snapshot proof in 5 lines of JavaScript in your own terminal:
            </p>
            <pre style={{
              margin: 0,
              padding: '12px 14px',
              background: '#0f172a',
              color: '#38bdf8',
              borderRadius: 8,
              fontSize: '0.75rem',
              lineHeight: 1.5,
              overflowX: 'auto',
              fontFamily: 'monospace',
              flex: 1
            }}>
{`import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

// 1. Obtain leafTuple & proof from /v1/proof
// 2. Query WaggleAttestor.rootOf(snapshotId)
const valid = StandardMerkleTree.verify(
  onchainRoot,
  schema,
  leafTuple,
  proof
);

console.log("Proof Valid:", valid); // true`}
            </pre>
          </div>
        </div>
      </section>

      {/* Conflict of Interest Policy & Disclosures */}
      <section style={{ marginBottom: 40 }}>
        <div className="never">
          <div className="never-left">
            <span className="never-tag">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12,2 21,7.2 21,16.8 12,22 3,16.8 3,7.2" />
              </svg>
              Integrity Invariants
            </span>
            <h3>What Waggle will never do</h3>
            <p className="never-lead">
              A public, unalterable commitment to conflict-free indexing, algorithmic neutrality, and methodology independence.
            </p>
            <div className="never-guarantee">
              <div className="never-guarantee-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12,2 21,7.2 21,16.8 12,22 3,16.8 3,7.2" />
                  <polyline points="8 12 11 15 16 9" />
                </svg>
              </div>
              <div>
                <div className="never-guarantee-title">Verifiable Invariants</div>
                <div className="never-guarantee-sub">Code and queries audit-ready in public</div>
              </div>
            </div>
          </div>

          <div className="never-items">
            <div className="never-item">
              <div className="never-item-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12,2 21,7.2 21,16.8 12,22 3,16.8 3,7.2" />
                  <line x1="6.5" y1="6.5" x2="17.5" y2="17.5" />
                </svg>
              </div>
              <div className="never-item-text">
                <strong>Never accept payment from launchpads</strong>
                <p>Zero sponsored placement, paid scores, or affiliate kickbacks from any venue or protocol.</p>
              </div>
            </div>

            <div className="never-item">
              <div className="never-item-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12,2 21,7.2 21,16.8 12,22 3,16.8 3,7.2" />
                  <line x1="6.5" y1="6.5" x2="17.5" y2="17.5" />
                </svg>
              </div>
              <div className="never-item-text">
                <strong>Never predict token success</strong>
                <p>Waggle describes historical structural fit, nothing more. It never predicts price, returns, or profitability.</p>
              </div>
            </div>

            <div className="never-item">
              <div className="never-item-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12,2 21,7.2 21,16.8 12,22 3,16.8 3,7.2" />
                  <line x1="6.5" y1="6.5" x2="17.5" y2="17.5" />
                </svg>
              </div>
              <div className="never-item-text">
                <strong>Never hold positions in scored venues</strong>
                <p>Modus Research Lab holds zero financial positions or equity stakes in any venue it scores.</p>
              </div>
            </div>

            <div className="never-item">
              <div className="never-item-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12,2 21,7.2 21,16.8 12,22 3,16.8 3,7.2" />
                  <line x1="6.5" y1="6.5" x2="17.5" y2="17.5" />
                </svg>
              </div>
              <div className="never-item-text">
                <strong>Never hide sample sizes or confidence</strong>
                <p>Every figure carries its sample size (N). Below the floor it reads low and is never quietly averaged.</p>
              </div>
            </div>

            <div className="never-item">
              <div className="never-item-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12,2 21,7.2 21,16.8 12,22 3,16.8 3,7.2" />
                  <line x1="6.5" y1="6.5" x2="17.5" y2="17.5" />
                </svg>
              </div>
              <div className="never-item-text">
                <strong>Factual disclosure: Modus launched a token on Pons.</strong>
                <p>Modus maintains full independence and transparency across all scored chains and factories.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
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
