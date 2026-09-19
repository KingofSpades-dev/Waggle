import React from 'react';
import { CHAINS } from '@/lib/mockData';

export default function CoveragePage() {
  return (
    <div className="wrap">
      <section className="hero">
        <div className="eyebrow">coverage & gaps</div>
        <h1>Chain & Venue Coverage</h1>
        <p className="lede">
          A visible gap is credible. A guess presented as coverage is not. Below is the exact list of indexed chains, their data sources, sample sizes, and unindexed gaps.
        </p>
      </section>

      <section>
        <h2>Indexed Chains</h2>
        <div className="tablewrap" style={{ marginTop: 16 }}>
          <table>
            <thead>
              <tr>
                <th>Chain Name</th>
                <th>Status</th>
                <th>Data Source</th>
                <th>Sample Size (N)</th>
                <th>Confidence Floor</th>
              </tr>
            </thead>
            <tbody>
              {CHAINS.map(c => (
                <tr key={c.key}>
                  <td>
                    <span className="vname">
                      <i className="vchip" style={{ background: c.hue }}></i>
                      {c.name}
                    </span>
                  </td>
                  <td>
                    {c.isCovered ? (
                      <span className="conf c-high">Indexed</span>
                    ) : (
                      <span className="conf c-low">Not Covered</span>
                    )}
                  </td>
                  <td style={{ color: 'var(--dim)' }}>{c.src}</td>
                  <td>{c.n ? c.n.toLocaleString() : '0'}</td>
                  <td>
                    <span className={`conf c-${c.conf}`}>{c.conf}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>Explicit Gaps & Uncovered Chains</h2>
        <p className="lede">
          The newest chains are covered last by aggregators. For chains marked as &quot;no collector yet&quot;, cells show hatched <i className="nankey"></i> and report low confidence rather than fabricating estimates.
        </p>
      </section>
    </div>
  );
}
