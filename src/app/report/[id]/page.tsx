import React from 'react';
import { scoutProject } from '@/lib/scorer';
import { CHAINS } from '@/lib/mockData';

export default async function ReportPermalinkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Generate reproducible mock report for permalink
  const report = await scoutProject({
    description: "An autonomous trading agent that rebalances onchain positions for DeFi users."
  });

  return (
    <div className="wrap">
      <section className="hero">
        <div className="eyebrow">reproducible report permalink</div>
        <div className="livebar" style={{ marginBottom: 10 }}>
          <span className="pill">Permalink ID: {id}</span>
          <span>·</span>
          <span>Snapshot ID: <code>{report.version_metadata.snapshot_id}</code></span>
        </div>

        <div className="report on" style={{ display: 'block', marginTop: 20 }}>
          <div className="verdict">
            <span
              className="big"
              style={{
                color: CHAINS.find(c => c.name === report.verdict.chain_name)?.hue || '#7b45d8'
              }}
            >
              {report.verdict.chain_name}
            </span>
            <span className="score">
              fit {report.verdict.composite_score} of 100 · {report.verdict.venue_name} ·{' '}
              {String(report.verdict.hour_utc).padStart(2, '0')}:00 UTC window
            </span>
          </div>

          <p className="vsub">
            {report.read_as ? (
              report.read_as
            ) : (
              <>
                Read as: launches shaped like this one survive more often on {report.verdict.chain_name}, and{' '}
                {report.verdict.venue_name} is the venue there whose mechanics suit this shape.
              </>
            )}
          </p>

          <div className="dims" style={{ marginTop: 20 }}>
            <div className="dim">
              <span className="nm">chain fit</span>
              <span className="track">
                <span className="fill fill-chain" style={{ width: `${report.dimensions.chain_fit}%` }}></span>
              </span>
              <span className="vl">
                <b>{report.dimensions.chain_fit}%</b> <small>({(report.dimensions.chain_fit * 0.35).toFixed(1)}/35 pts)</small>
              </span>
            </div>
            <div className="dim">
              <span className="nm">venue fit</span>
              <span className="track">
                <span className="fill fill-venue" style={{ width: `${report.dimensions.venue_fit}%` }}></span>
              </span>
              <span className="vl">
                <b>{report.dimensions.venue_fit}%</b> <small>({(report.dimensions.venue_fit * 0.30).toFixed(1)}/30 pts)</small>
              </span>
            </div>
            <div className="dim">
              <span className="nm">meta heat</span>
              <span className="track">
                <span className="fill fill-meta" style={{ width: `${report.dimensions.meta_heat}%` }}></span>
              </span>
              <span className="vl">
                <b>{report.dimensions.meta_heat}%</b> <small>({(report.dimensions.meta_heat * 0.20).toFixed(1)}/20 pts)</small>
              </span>
            </div>
            <div className="dim">
              <span className="nm">hour window</span>
              <span className="track">
                <span className="fill fill-hour" style={{ width: `${report.dimensions.hour_window}%` }}></span>
              </span>
              <span className="vl">
                <b>{report.dimensions.hour_window}%</b> <small>({(report.dimensions.hour_window * 0.15).toFixed(1)}/15 pts)</small>
              </span>
            </div>
          </div>

          {/* Recommended Launchpad & Venue Breakdown */}
          {report.recommended_launchpad && (
            <div className="lp-section">
              <div className="lp-header">
                <div className="lp-title-block">
                  <div className="lp-icon-hex">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M12 2L21 7.2V16.8L12 22L3 16.8V7.2L12 2Z" />
                    </svg>
                  </div>
                  <div>
                    <span className="lp-eyebrow">RECOMMENDED LAUNCHPAD & VENUE</span>
                    <h3 className="lp-name">{report.recommended_launchpad.name}</h3>
                  </div>
                </div>
                <div className="lp-badges">
                  <span className="lp-tag-curve">{report.recommended_launchpad.curve_display}</span>
                  <span className="lp-tag-chain">{report.recommended_launchpad.chain_name} Ecosystem</span>
                  <span className="lp-tag-match">Top Structural Match</span>
                </div>
              </div>

              {/* Unified 4-Column Stat Strip */}
              <div className="lp-stats-strip">
                <div className="lp-stat-cell">
                  <span className="lp-stat-label">7-Day Survival</span>
                  <span className="lp-stat-val text-emerald">{report.recommended_launchpad.survival_rate_pct}%</span>
                  <span className="lp-stat-sub">● Historical survival</span>
                </div>
                <div className="lp-stat-cell">
                  <span className="lp-stat-label">Sniper Extraction</span>
                  <span className="lp-stat-val text-amber">{report.recommended_launchpad.extraction_pct}%</span>
                  <span className="lp-stat-sub">1st min MEV take</span>
                </div>
                <div className="lp-stat-cell">
                  <span className="lp-stat-label">Avg Seed Liquidity</span>
                  <span className="lp-stat-val text-sky">${report.recommended_launchpad.avg_initial_liquidity_usd.toLocaleString('en-US')}</span>
                  <span className="lp-stat-sub">Initial pool depth</span>
                </div>
                <div className="lp-stat-cell">
                  <span className="lp-stat-label">Indexed Launches</span>
                  <span className="lp-stat-val text-navy">{report.recommended_launchpad.launches_count.toLocaleString('en-US')}</span>
                  <span className="lp-stat-sub">Sample size (N)</span>
                </div>
              </div>

              {/* 2-Column Reasoning Cards */}
              <div className="lp-intel-grid">
                <div className="lp-intel-card">
                  <div className="lp-intel-header">
                    <span className="lp-intel-hex-icon icon-curve">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L20.66 7V17L12 22L3.34 17V7L12 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M7.5 15.5C9.5 15.5 11 14 13 10.8C14.5 8 15.8 7.2 16.8 7.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="16.8" cy="7.2" r="1.5" fill="currentColor" />
                      </svg>
                    </span>
                    <span className="lp-intel-title">Bonding Curve Mechanics</span>
                  </div>
                  <p className="lp-intel-body">{report.recommended_launchpad.mechanics_summary}</p>
                </div>
                <div className="lp-intel-card">
                  <div className="lp-intel-header">
                    <span className="lp-intel-hex-icon icon-fit">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L20.66 7V17L12 22L3.34 17V7L12 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
                        <circle cx="12" cy="12" r="1.4" fill="currentColor" />
                        <path d="M12 4.8V7M12 17V19.2M4.8 12H7M17 12H19.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    </span>
                    <span className="lp-intel-title">Why It Fits This Token</span>
                  </div>
                  <p className="lp-intel-body">{report.recommended_launchpad.fit_reason}</p>
                </div>
              </div>

              {/* Alternative Launchpads */}
              {report.alternative_launchpads && report.alternative_launchpads.length > 0 && (
                <div className="lp-alts-row">
                  <span className="lp-alts-title">Alternative Options:</span>
                  <div className="lp-alts-list">
                    {report.alternative_launchpads.map(alt => (
                      <div key={alt.name} className="lp-alt-pill">
                        <span className="lp-alt-name">{alt.name}</span>
                        <span className="lp-alt-meta">({alt.chain_name} · {alt.curve_type.replace('_', ' ')})</span>
                        <span className="lp-alt-rate">{alt.survival_rate_pct}% surv</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="cellinfo" style={{ marginTop: 16 }}>
            <b>Version Lineage & Provenance</b>
            <div className="kv">
              <div>Metrics Engine Version</div>
              <div><code>{report.version_metadata.metrics_version}</code></div>
              <div>Weights Version</div>
              <div><code>{report.version_metadata.weights_version}</code></div>
              <div>Classifier Version</div>
              <div><code>{report.version_metadata.classifier_version}</code></div>
              <div>Sample Size (N)</div>
              <div>{report.sample_size.toLocaleString()}</div>
            </div>
          </div>

          <p className="caveat" style={{ marginTop: 16 }}>
            {report.confidence_caveat} {report.disclaimer}
          </p>
        </div>
      </section>
    </div>
  );
}
