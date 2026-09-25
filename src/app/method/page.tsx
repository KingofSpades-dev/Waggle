import React from 'react';
import Link from 'next/link';
import { WEIGHTS, METRICS_VERSION, WEIGHTS_VERSION, CLASSIFIER_VERSION } from '@/lib/mockData';
import { WAGGLE_ATTESTOR_ADDRESS } from '@/lib/viemClient';
import CondorcetCalculator from '@/components/CondorcetCalculator';

const WEIGHT_DETAILS: Record<string, { label: string; desc: string }> = {
  chain: { label: 'chain fit', desc: '7-day survival baseline & DEX liquidity depth across the chain' },
  venue: { label: 'venue fit', desc: 'Bonding curve mechanics, graduation rate & initial liquidity' },
  meta: { label: 'meta heat', desc: 'Taxonomy demand score (AI agent, meme, DeFi, game, RWA)' },
  hour: { label: 'hour window', desc: 'Diurnal UTC liquidity peak & bot extraction avoidance' }
};

export default function MethodPage() {
  return (
    <main className="wrap" style={{ paddingTop: '28px', paddingBottom: '32px' }}>
      {/* Top Breadcrumbs & Spec Badge */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.78rem',
        color: 'var(--dim)',
        marginBottom: '12px',
        paddingBottom: '8px',
        borderBottom: '1px solid var(--line)',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href="/" style={{ color: 'var(--dim)', textDecoration: 'none' }}>Waggle</Link>
          <span>/</span>
          <span style={{ color: 'var(--navy-900)', fontFamily: 'monospace', fontWeight: 700 }}>methodology-spec</span>
        </div>

        <span className="conf" style={{
          fontSize: '0.72rem',
          padding: '2px 8px',
          background: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: '6px',
          color: 'var(--navy-900)',
          fontFamily: 'monospace',
          fontWeight: 600
        }}>
          Spec Version: v2.6-frozen
        </span>
      </div>

      {/* Hero Header */}
      <section className="hero" style={{ padding: '0 0 12px 0' }}>
        <div className="eyebrow">methodology & transparency</div>
        <h1>Public Method & Conflict Policy</h1>
        <p className="lede">
          Waggle scores launchpads the way a hive picks a new home: many independent signals, one majority verdict, anchored onchain. Every definition, weight, and threshold is versioned, frozen, and published before it takes effect.
        </p>
      </section>

      {/* Mathematical Theorem: Condorcet Jury Theorem (1785) */}
      <section style={{ marginBottom: 20, paddingTop: 16 }}>
        <div className="eyebrow">mathematical foundation</div>
        <h2 style={{ margin: '2px 0 6px' }}>Condorcet&apos;s Jury Theorem (1785)</h2>
        <p style={{ margin: 0, color: 'var(--dim)', fontSize: '0.9rem', maxWidth: '820px' }}>
          If a group of independent decision makers (scouts) each has a probability <i>p &gt; 0.5</i> of choosing correctly, the probability <i>P<sub>N</sub></i> that the majority decision is correct increases as the group size <i>N</i> grows, approaching 100%.
        </p>

        {/* Formula Box & Theorem Legend */}
        <div className="theorem-card">
          <div className="theorem-grid">
            <div className="formula-box">
              <div className="formula-display">
                <span>P<sub>N</sub> = </span>
                <div className="formula-sigma">
                  <span className="lim">N</span>
                  <span className="big-sigma">∑</span>
                  <span className="lim">k=⌊N/2⌋+1</span>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', margin: '0 4px' }}>
                  <svg width="14" height="42" viewBox="0 0 18 48" fill="none" style={{ verticalAlign: 'middle', marginRight: '-2px' }}>
                    <path d="M14 2C6 12 6 36 14 46" stroke="var(--navy-900)" strokeWidth="2.8" strokeLinecap="round" />
                  </svg>
                  <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.1, fontSize: '0.74em', padding: '0 3px', fontFamily: 'serif' }}>
                    <span style={{ fontWeight: 600 }}>N</span>
                    <span style={{ fontWeight: 600 }}>k</span>
                  </div>
                  <svg width="14" height="42" viewBox="0 0 18 48" fill="none" style={{ verticalAlign: 'middle', marginLeft: '-2px' }}>
                    <path d="M4 2C12 12 12 36 4 46" stroke="var(--navy-900)" strokeWidth="2.8" strokeLinecap="round" />
                  </svg>
                </div>
                <span>p<sup>k</sup> (1−p)<sup>N−k</sup></span>
              </div>
              
              <div className="formula-legend">
                <div className="formula-legend-item">
                  <b>N</b>
                  <span>Independent scouts (measured metrics)</span>
                </div>
                <div className="formula-legend-item">
                  <b>p</b>
                  <span>Individual accuracy of each scout (p &gt; 0.5)</span>
                </div>
                <div className="formula-legend-item">
                  <b>P<sub>N</sub></b>
                  <span>Probability majority decision is correct (P<sub>N</sub> &gt; p)</span>
                </div>
              </div>
            </div>

            <div>
              <h3 style={{ margin: '0 0 10px', fontSize: '1.25rem' }}>Signal Amplification &amp; Majority Verdicts</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--dim)', lineHeight: 1.6, marginBottom: 12 }}>
                When applied to noisy crypto markets, no single indicator is 100% reliable on its own. However, when multiple independent signals are combined, Condorcet&apos;s Jury Theorem mathematically proves that the majority verdict is significantly more accurate than any single measurement.
              </p>
              <div style={{ background: 'var(--gray-50)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--line)', fontSize: '0.82rem', fontFamily: 'monospace' }}>
                💡 <b>Waggle Principle:</b> Waggle combines 4 independent structural vectors. If each vector has an accuracy of 60%, the combined majority verdict achieves 73.3%+ precision.
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Calculator */}
        <div style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: 4 }}>Interactive Condorcet Probability Simulator</h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--dim)', margin: '0 0 12px' }}>
            Test how the number of signals (<i>n</i>) and individual accuracy (<i>p</i>) amplify the precision of Waggle recommendations:
          </p>
          <CondorcetCalculator />
        </div>

        {/* How Waggle Applies It - 3 Step Practical Application */}
        <div style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: 12 }}>From a 1785 Essay to a Launchpad Verdict</h3>
          <div className="condorcet-steps-grid">
            <div className="condorcet-step-card">
              <div className="condorcet-step-num">I.</div>
              <h4 style={{ margin: '0 0 6px', fontSize: '1.02rem', fontWeight: 700, color: 'var(--navy-900)' }}>Independent Scouts</h4>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--dim)', lineHeight: 1.55 }}>
                Each measured signal is a scout: T+7 day survival, launch liquidity depth, first-minute extraction share, and launch-hour conditions. Each reports independently.
              </p>
            </div>

            <div className="condorcet-step-card">
              <div className="condorcet-step-num">II.</div>
              <h4 style={{ margin: '0 0 6px', fontSize: '1.02rem', fontWeight: 700, color: 'var(--navy-900)' }}>A Majority Verdict</h4>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--dim)', lineHeight: 1.55 }}>
                No single metric decides. A launchpad earns a top recommendation only when the composite weight of independent evidence points in the same structural direction.
              </p>
            </div>

            <div className="condorcet-step-card">
              <div className="condorcet-step-num">III.</div>
              <h4 style={{ margin: '0 0 6px', fontSize: '1.02rem', fontWeight: 700, color: 'var(--navy-900)' }}>A Record Nobody Can Edit</h4>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--dim)', lineHeight: 1.55 }}>
                Every snapshot of evidence is cryptographically fingerprinted onchain each hour. Any score on the dashboard can be verified against <code>WaggleAttestor.sol</code>.
              </p>
            </div>
          </div>

          {/* Honest Limit & Disclaimer Caveat */}
          <div className="condorcet-caveat-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div style={{ fontSize: '0.84rem', color: 'var(--navy-800)', lineHeight: 1.55 }}>
              <b>An Honest Research Limit:</b> The Condorcet Jury Theorem assumes voters who judge with total statistical independence. Onchain data signals drawn from the same blockchain exhibit partial correlation, which slightly weakens the pure theoretical guarantee. This simulator demonstrates Waggle&apos;s underlying structural principle rather than an absolute risk-free promise.
            </div>
          </div>
        </div>
      </section>

      {/* 1. Version Numbers Cards */}
      <section style={{ marginBottom: 20, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
        <p className="eyebrow">PROTOCOL VERSIONING &amp; SPECIFICATION</p>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 600, color: 'var(--navy-900)', margin: '2px 0 12px' }}>
          Current Version Numbers
        </h2>
        <div className="modus-version-grid">
          <div className="modus-card" style={{ padding: '16px 20px' }}>
            <span className="modus-badge">Metrics Engine</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--navy-900)', fontFamily: 'var(--font-mono)', margin: '6px 0 4px' }}>
              {METRICS_VERSION}
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--dim)', margin: 0, lineHeight: 1.5 }}>Fixed-point deterministic serializer</p>
          </div>

          <div className="modus-card" style={{ padding: '16px 20px' }}>
            <span className="modus-badge">Weights Model</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--navy-900)', fontFamily: 'var(--font-mono)', margin: '6px 0 4px' }}>
              {WEIGHTS_VERSION}
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--dim)', margin: 0, lineHeight: 1.5 }}>4 independent structural vectors</p>
          </div>

          <div className="modus-card" style={{ padding: '16px 20px' }}>
            <span className="modus-badge">Taxonomy Classifier</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--navy-900)', fontFamily: 'var(--font-mono)', margin: '6px 0 4px' }}>
              {CLASSIFIER_VERSION}
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--dim)', margin: 0, lineHeight: 1.5 }}>AI agent, meme, DeFi, game, RWA</p>
          </div>

          <div className="modus-card" style={{ padding: '16px 20px' }}>
            <span className="modus-badge" style={{ background: '#ECFDF5', borderColor: '#A7F3D0', color: '#059669' }}>Attestation Protocol</span>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#059669', fontFamily: 'var(--font-mono)', margin: '6px 0 4px' }}>
              WaggleAttestor
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--dim)', margin: 0, lineHeight: 1.5 }}>Robinhood Chain (ID: 4663)</p>
          </div>
        </div>
      </section>

      {/* 2. Metric Definitions */}
      <section style={{ marginBottom: 20, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
        <p className="eyebrow">SPECIFICATION &amp; CONSTANTS</p>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 600, color: 'var(--navy-900)', margin: '2px 0 4px' }}>
          Metric Definitions
        </h2>
        <p style={{ fontSize: '0.92rem', color: 'var(--dim)', margin: '0 0 14px', maxWidth: '780px' }}>
          Deterministic metric definitions, frozen thresholds, and flow filters applied across all indexed launchpads.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          <div className="modus-card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h3 className="modus-card-title">Strict Survival</h3>
              <span className="modus-badge">Strict</span>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.55, margin: 0 }}>
              A launch is strictly surviving at T+7 days if it meets both the minimum liquidity threshold (<code style={{ background: 'var(--gray-50)', padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--navy-900)', border: '1px solid var(--line2)' }}>MIN_SURVIVAL_LIQUIDITY_USD = $1,000 USD</code>) and trade count threshold (<code style={{ background: 'var(--gray-50)', padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--navy-900)', border: '1px solid var(--line2)' }}>MIN_SURVIVAL_TRADES_24H = 50 trades/24h</code>).
            </p>
          </div>

          <div className="modus-card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h3 className="modus-card-title">Active Survival</h3>
              <span className="modus-badge">Active</span>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.55, margin: 0 }}>
              A launch has active survival if at least one organic swap transaction was executed in the preceding 7 days, regardless of depth.
            </p>
          </div>

          <div className="modus-card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h3 className="modus-card-title">First Minute Extraction</h3>
              <span className="modus-badge" style={{ background: '#FFFBEB', borderColor: '#FDE68A', color: '#D97706' }}>Anti-MEV</span>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.55, margin: 0 }}>
              Share of first minute volume taken by wallets that buy inside sixty seconds of the first block, sell within thirty minutes, and hold nothing after. Lower is healthier.
            </p>
          </div>

          <div className="modus-card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h3 className="modus-card-title">Adjusted Volume</h3>
              <span className="modus-badge" style={{ background: '#F0F9FF', borderColor: '#BAE6FD', color: '#0284C7' }}>Wash Filter</span>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.55, margin: 0 }}>
              Raw volume minus flow matching wash patterns. Published beside raw volume always, with the adjustment method linked.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Hypothesis Model */}
      <section style={{ marginBottom: 20, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
        <div className="modus-card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid var(--line2)' }}>
            <div>
              <p className="eyebrow" style={{ color: 'var(--dim)', marginBottom: 2 }}>COMPOSITE FIT WEIGHTING SYSTEM</p>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', fontWeight: 600, color: 'var(--navy-900)', margin: '2px 0 4px' }}>
                Hypothesis Model
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text)', margin: 0 }}>
                How Waggle calculates the 0–100 structural fit score across four independent on-chain vectors.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, background: 'var(--gray-50)', padding: '8px 14px', border: '1px solid var(--line2)', borderRadius: 'var(--r-xs)' }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 600, color: 'var(--navy-900)', lineHeight: 1 }}>100</span>
              <span style={{ fontSize: '12px', color: 'var(--dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total Pts</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            {Object.entries(WEIGHTS).map(([k, v]) => {
              const info = WEIGHT_DETAILS[k] || { label: k, desc: '' };
              return (
                <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 16px', background: 'var(--gray-50)', border: '1px solid var(--line2)', borderRadius: 'var(--r-xs)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '17px', fontWeight: 600, color: 'var(--navy-900)', textTransform: 'capitalize' }}>
                      {info.label}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--navy-800)' }}>
                      <b>{v}</b> pts ({v}%)
                    </span>
                  </div>
                  <div style={{ height: 8, background: 'var(--panel2)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${(v / 35) * 100}%`, height: '100%', background: 'var(--navy-800)' }} />
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--dim)', margin: 0, lineHeight: 1.45 }}>
                    {info.desc}
                  </p>
                </div>
              );
            })}
          </div>

          <p style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--line2)', fontSize: '0.84rem', color: 'var(--dim)', fontStyle: 'italic', margin: '16px 0 0' }}>
            Starting weights, treated as a hypothesis. Any change is evaluated against held-out launches before it ships.
          </p>
        </div>
      </section>

      {/* 4. Cryptographic Verification & Onchain Proof */}
      <section id="proof" style={{ marginBottom: 20, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 24, alignItems: 'start' }}>
          <div style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <p className="eyebrow" style={{ color: 'var(--dim)', marginBottom: 2 }}>ONCHAIN PROOF &amp; CRYPTOGRAPHIC VERIFICATION</p>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 600, color: 'var(--navy-900)', margin: '2px 0 4px', lineHeight: 1.15 }}>
                Don&apos;t trust the ranking. Check it.
              </h2>
              <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '1rem', fontWeight: 700, color: 'var(--navy-800)', margin: '0 0 8px' }}>
                How to Check Our Numbers Yourself
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.55, margin: 0 }}>
                A recommendation engine nobody can inspect is indistinguishable from an advertisement. Waggle&apos;s snapshots are fingerprinted and anchored on Robinhood Chain.
              </p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 2 }}>
              <Link href="/verify" className="modus-btn-solid" style={{ minHeight: '38px', padding: '0 18px', fontSize: '13px' }}>Verify a number</Link>
              <a href={`https://robinhoodchain.blockscout.com/address/${WAGGLE_ATTESTOR_ADDRESS}`} target="_blank" rel="noreferrer" className="modus-btn-line" style={{ minHeight: '38px', padding: '0 18px', fontSize: '13px' }}>
                View contract ↗
              </a>
            </div>
          </div>

          <div style={{ gridColumn: 'span 7' }}>
            <dl className="modus-dl">
              <div>
                <dt className="modus-dt">Network</dt>
                <dd className="modus-dd">Robinhood Chain, chain ID 4663</dd>
              </div>
              <div>
                <dt className="modus-dt">WaggleAttestor</dt>
                <dd className="modus-dd modus-dd-mono">{WAGGLE_ATTESTOR_ADDRESS}</dd>
              </div>
              <div>
                <dt className="modus-dt">Deploy block</dt>
                <dd className="modus-dd modus-dd-mono">72,088,517</dd>
              </div>
              <div>
                <dt className="modus-dt">Cadence</dt>
                <dd className="modus-dd">One Merkle root per hourly snapshot</dd>
              </div>
              <div>
                <dt className="modus-dt">Attestation Protocol</dt>
                <dd className="modus-dd modus-dd-mono">StandardMerkleTree (OpenZeppelin v5)</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* 4 DIY Step Verification Cards */}
        <div style={{ marginTop: 24 }}>
          <p className="eyebrow" style={{ color: 'var(--dim)', marginBottom: 10 }}>DIY VERIFICATION STEPS</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
            <div className="modus-step-box" style={{ paddingTop: 14 }}>
              <div className="modus-step-num">I.</div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '19px', color: 'var(--navy-900)', margin: '0 0 4px' }}>
                What is a Merkle Proof?
              </h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text)', lineHeight: 1.55, margin: 0 }}>
                Imagine a digital wax seal for tens of thousands of data points. Waggle bundles all hourly metrics into a mathematical tree (a <b>Merkle Tree</b>) and publishes only the single 32-byte <b>Root Hash</b> directly to <code>WaggleAttestor</code> onchain.
              </p>
            </div>

            <div className="modus-step-box" style={{ paddingTop: 14 }}>
              <div className="modus-step-num">II.</div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '19px', color: 'var(--navy-900)', margin: '0 0 4px' }}>
                The Cryptographic Invariant
              </h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text)', lineHeight: 1.55, margin: 0 }}>
                Even changing a single decimal point (e.g. changing 49.0% survival to 49.1%) completely changes the leaf hash and produces a different Root Hash. An altered number <b>cannot mathematically match</b> the root onchain.
              </p>
            </div>

            <div className="modus-step-box" style={{ paddingTop: 14 }}>
              <div className="modus-step-num">III.</div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '19px', color: 'var(--navy-900)', margin: '0 0 4px' }}>
                Step-by-Step DIY Verification
              </h3>
              <ol style={{ margin: 0, paddingLeft: 18, color: 'var(--text)', fontSize: '0.82rem', lineHeight: 1.55 }}>
                <li style={{ marginBottom: 3 }}>Call <code>rootOf(snapshotId)</code> on <code>WaggleAttestor</code>.</li>
                <li style={{ marginBottom: 3 }}>Fetch proof payload via <code>GET /v1/proof</code>.</li>
                <li style={{ marginBottom: 3 }}>Recompute root with <code>@openzeppelin/merkle-tree</code>.</li>
                <li>Compare recomputed root against the onchain root.</li>
              </ol>
            </div>

            <div className="modus-step-box" style={{ paddingTop: 14 }}>
              <div className="modus-step-num">IV.</div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '19px', color: 'var(--navy-900)', margin: '0 0 4px' }}>
                Terminal Verification
              </h3>
              <pre style={{
                margin: 0,
                padding: '10px 12px',
                background: 'var(--navy-900)',
                color: '#edf1f4',
                borderRadius: 'var(--r-xs)',
                fontSize: '0.74rem',
                lineHeight: 1.45,
                overflowX: 'auto',
                fontFamily: 'var(--font-mono)'
              }}>
{`import { StandardMerkleTree } from 
  "@openzeppelin/merkle-tree";

const valid = StandardMerkleTree.verify(
  onchainRoot,
  schema,
  leafTuple,
  proof
);
console.log("Valid:", valid); // true`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Integrity Invariants */}
      <section style={{ marginBottom: 20, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
        <div>
          <p className="eyebrow" style={{ color: 'var(--dim)', marginBottom: 2 }}>CONFLICT POLICY &amp; DISCLOSURE</p>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 600, color: 'var(--navy-900)', margin: '2px 0 6px' }}>
            Integrity Invariants
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text)', margin: '0 0 16px', maxWidth: '780px' }}>
            A public, unalterable commitment to conflict-free indexing, algorithmic neutrality, and methodology independence.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          <div className="modus-step-box" style={{ borderColor: 'var(--navy-800)', paddingTop: 12 }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--navy-900)', margin: '0 0 4px' }}>
              Never accept payment from launchpads
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text)', lineHeight: 1.55, margin: 0 }}>
              Zero sponsored placement, paid scores, or affiliate kickbacks from any venue, factory, or protocol.
            </p>
          </div>

          <div className="modus-step-box" style={{ borderColor: 'var(--navy-800)', paddingTop: 12 }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--navy-900)', margin: '0 0 4px' }}>
              Never predict token success
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text)', lineHeight: 1.55, margin: 0 }}>
              Waggle describes historical structural fit, nothing more. It never predicts price, returns, or future profitability.
            </p>
          </div>

          <div className="modus-step-box" style={{ borderColor: 'var(--navy-800)', paddingTop: 12 }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--navy-900)', margin: '0 0 4px' }}>
              Never hold positions in scored venues
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text)', lineHeight: 1.55, margin: 0 }}>
              Modus Research Lab holds zero financial positions or equity stakes in any venue or launchpad it scores.
            </p>
          </div>

          <div className="modus-step-box" style={{ borderColor: 'var(--navy-800)', paddingTop: 12 }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--navy-900)', margin: '0 0 4px' }}>
              Never hide sample sizes or confidence
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text)', lineHeight: 1.55, margin: 0 }}>
              Every figure carries its sample size (N). Below the floor it reads low and is never quietly averaged or masked.
            </p>
          </div>

          <div className="modus-step-box" style={{ borderColor: 'var(--navy-800)', paddingTop: 12, gridColumn: '1 / -1' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--navy-900)', margin: '0 0 4px' }}>
              Factual disclosure: Modus launched a token on Pons.
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text)', lineHeight: 1.55, margin: 0 }}>
              Modus maintains full independence and transparency across all scored chains and factories.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ marginTop: '28px', paddingBottom: '16px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--dim)' }}>
        <p style={{ margin: '0 0 6px' }}>Last updated: September 2026 · Waggle Protocol v2</p>
        <p style={{ margin: 0 }}>
          <Link href="/terms" style={{ color: 'var(--navy-800)', marginRight: 14 }}>Terms of Service</Link>
          <Link href="/privacy" style={{ color: 'var(--navy-800)', marginRight: 14 }}>Privacy Policy</Link>
          <Link href="/verify" style={{ color: 'var(--navy-800)' }}>Verify Onchain</Link>
        </p>
      </footer>
    </main>
  );
}


