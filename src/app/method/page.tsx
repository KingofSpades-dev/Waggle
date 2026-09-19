import React from 'react';
import { WEIGHTS, METRICS_VERSION, WEIGHTS_VERSION, CLASSIFIER_VERSION } from '@/lib/mockData';

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
            <h3>Surviving at 7 Days</h3>
            <p>A launch is surviving at T+7 days if it meets both the minimum liquidity threshold ($5,000 USD) and trade count threshold (100 trades/24h). Both are named constants in code.</p>
          </div>
          <div className="card">
            <h3>First Minute Extraction</h3>
            <p>Share of first minute volume taken by wallets that buy inside sixty seconds of the first block, sell within thirty minutes, and hold nothing after. Lower is healthier.</p>
          </div>
          <div className="card">
            <h3>Top 5 Concentration</h3>
            <p>Share of chain volume held by its five largest tokens. Exposes a chain that looks busy while being one runner and a hundred bots.</p>
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

      <section>
        <div className="never">
          <h3>Conflict of Interest Policy</h3>
          <ul>
            <li>Never accept payment from any venue for placement, scoring, or removal.</li>
            <li>Never present raw volume as demand without adjusted volume beside it.</li>
            <li>Never show a figure without its sample size and confidence level.</li>
            <li>Submissions stay private and are never surfaced in public dashboards or aggregate charts.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
