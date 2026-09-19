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
            Read as: launches shaped like this one survive more often on {report.verdict.chain_name}, and{' '}
            {report.verdict.venue_name} is the venue there whose mechanics suit this shape.
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
