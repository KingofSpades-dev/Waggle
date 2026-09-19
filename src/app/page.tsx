'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  CHAINS,
  VENUES,
  METRICS,
  WEIGHTS,
  EXAMPLES,
  MATRIX_DATA
} from '@/lib/mockData';
import { MetricType, AnalyseResponseBody, ChainData } from '@/lib/types';

// Color Ramp Logic matching waggle.html STOPS
const STOPS = [
  [228, 238, 252],
  [142, 198, 240],
  [64, 196, 214],
  [86, 214, 150],
  [246, 206, 74],
  [240, 136, 60],
  [214, 48, 104]
];

function ramp(t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  const x = clamped * (STOPS.length - 1);
  const i = Math.floor(x);
  const f = x - i;
  const a = STOPS[i];
  const b = STOPS[Math.min(i + 1, STOPS.length - 1)];
  const r = Math.round(a[0] + (b[0] - a[0]) * f);
  const g = Math.round(a[1] + (b[1] - a[1]) * f);
  const bl = Math.round(a[2] + (b[2] - a[2]) * f);
  return `rgb(${r},${g},${bl})`;
}

function hexrgb(h: string): string {
  const n = parseInt(h.slice(1), 16);
  return `rgb(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255})`;
}

function shade(rgbStr: string, f: number): string {
  const m = rgbStr.match(/\d+/g);
  if (!m) return rgbStr;
  return `rgb(${m.map(v => Math.round(Number(v) * f)).join(',')})`;
}

export default function HomePage() {
  const [description, setDescription] = useState('');
  const [report, setReport] = useState<AnalyseResponseBody | null>(null);
  const [isPending, startTransition] = useTransition();

  // Matrix Heatmap state
  const [metric, setMetric] = useState<MetricType>('survival');
  const [selectedCell, setSelectedCell] = useState<{ k: string; h: number } | null>(null);
  const [flashCell, setFlashCell] = useState<{ k: string; h: number } | null>(null);
  const [lastUpdatedSec, setLastUpdatedSec] = useState(0);

  // Venue Table Sorting state
  const [sortKey, setSortKey] = useState<keyof typeof VENUES[0]>('surv');
  const [sortDir, setSortDir] = useState<-1 | 1>(-1);

  // Dynamic Live Ticking effect
  useEffect(() => {
    const tickInterval = setInterval(() => {
      const liveChains = CHAINS.filter(c => c.isCovered);
      const randomChain = liveChains[Math.floor(Math.random() * liveChains.length)];
      const randomHour = Math.floor(Math.random() * 24);

      if (MATRIX_DATA[randomChain.key]?.[metric]?.[randomHour] != null) {
        const cur = MATRIX_DATA[randomChain.key][metric][randomHour] as number;
        MATRIX_DATA[randomChain.key][metric][randomHour] = cur * (1 + (Math.random() - 0.5) * 0.05);
      }

      setFlashCell({ k: randomChain.key, h: randomHour });
      setLastUpdatedSec(0);
      setTimeout(() => setFlashCell(null), 600);
    }, 5200);

    const timer = setInterval(() => {
      setLastUpdatedSec(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(tickInterval);
      clearInterval(timer);
    };
  }, [metric]);

  // Compute Range for matrix
  const getRange = (m: MetricType): [number, number] => {
    let lo = Infinity;
    let hi = -Infinity;
    CHAINS.forEach(c => {
      const arr = MATRIX_DATA[c.key]?.[m];
      if (!arr) return;
      arr.forEach(v => {
        if (v == null) return;
        lo = Math.min(lo, v);
        hi = Math.max(hi, v);
      });
    });
    return [lo === Infinity ? 0 : lo, hi === -Infinity ? 100 : hi];
  };

  const [lo, hi] = getRange(metric);

  // Handle Scout Analysis
  const handleScout = (overrideText?: string) => {
    const textToScout = overrideText !== undefined ? overrideText : description;
    if (!textToScout.trim()) return;

    startTransition(async () => {
      try {
        const res = await fetch('/v1/analyse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: textToScout })
        });
        const data: AnalyseResponseBody = await res.json();
        setReport(data);
      } catch (err) {
        console.error('Failed to analyze:', err);
      }
    });
  };

  // Sorted venues
  const sortedVenues = [...VENUES].sort((a, b) => {
    const x = a[sortKey];
    const y = b[sortKey];
    if (typeof x === 'string' && typeof y === 'string') {
      return x.localeCompare(y) * sortDir;
    }
    return ((x as number) - (y as number)) * sortDir;
  });

  const maxSurv = Math.max(...VENUES.map(v => v.surv));

  // Cell info computation
  const selectedChainData: ChainData | undefined = selectedCell
    ? CHAINS.find(c => c.key === selectedCell.k)
    : undefined;

  const selectedVal: number | null = (selectedCell && selectedChainData && MATRIX_DATA[selectedCell.k]?.[metric])
    ? MATRIX_DATA[selectedCell.k][metric][selectedCell.h]
    : null;

  let cellReadout = "";
  if (selectedCell) {
    if (selectedVal == null) {
      cellReadout = "No collector is running for this chain, so the cell is empty rather than estimated.";
    } else if (selectedChainData?.conf === "low") {
      cellReadout = "The sample here is too small to read. Treat it as unknown, not as good news.";
    } else if (metric === "survival" && selectedVal > hi * 0.85) {
      cellReadout = "Among the strongest hours on this chain. The cluster differs by chain, so do not carry it across rows.";
    } else if (metric === "launches") {
      cellReadout = "Congestion rather than quality. More launches means more competition for the same attention.";
    } else if (metric === "extraction") {
      cellReadout = "Share of first minute volume taken by wallets that sell within thirty minutes and hold nothing after.";
    } else {
      cellReadout = "Readable sample, though survival still varies by venue inside the chain.";
    }
  }

  return (
    <div className="wrap">
      {/* Hero Section */}
      <section className="hero">
        <div className="livebar">
          <span className="dot"></span>
          <span id="collectors">4 collectors running, 1 not started</span>
          <span>·</span>
          <span>
            updated <b>{lastUpdatedSec < 5 ? 'just now' : `${lastUpdatedSec}s ago`}</b>
          </span>
          <span className="pill">v1.0 live engine</span>
        </div>
        <h1>
          Too many chains.<br />
          Too many launchpads.<br />
          <em>One honest answer.</em>
        </h1>
        <p className="lede">
          Describe what you built. Waggle scores it against where surviving launches actually happen, then tells you the chain, the venue, and the hour window that fit its shape. It will not tell you whether it will work, because nothing in this data can.
        </p>

        <div className="submit">
          <label htmlFor="desc">What are you launching</label>
          <div className="field">
            <textarea
              id="desc"
              placeholder="An autonomous trading agent that rebalances onchain positions, aimed at DeFi users. No audience yet, small treasury."
              value={description}
              onChange={e => setDescription(e.target.value)}
              onKeyDown={e => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleScout();
              }}
            />
            <button className="go" onClick={() => handleScout()} disabled={isPending}>
              {isPending ? 'Scouting...' : 'Scout it'}
            </button>
          </div>

          <div className="chips">
            {Object.entries(EXAMPLES).map(([key, promptText]) => (
              <button
                key={key}
                className="chip"
                onClick={() => {
                  setDescription(promptText);
                  handleScout(promptText);
                }}
              >
                {key === 'agent' && 'AI agent tooling'}
                {key === 'game' && 'Game token'}
                {key === 'defi' && 'DeFi protocol'}
                {key === 'meme' && 'Community memecoin'}
                {key === 'rwa' && 'Tokenised asset'}
              </button>
            ))}
          </div>

          {report && (
            <div className="report on">
              <div className="verdict">
                <span
                  className="big"
                  style={{
                    color: shade(
                      hexrgb(CHAINS.find(c => c.name === report.verdict.chain_name)?.hue || '#7b45d8'),
                      0.72
                    )
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
                {report.verdict.venue_name} is the venue there whose mechanics suit this shape. The current meta is{' '}
                {report.meta_reading}.
              </p>

              <div className="dims">
                <div className="dim">
                  <span className="nm">chain fit</span>
                  <span className="track">
                    <span
                      className="fill fill-chain"
                      style={{ width: `${report.dimensions.chain_fit}%` }}
                    ></span>
                  </span>
                  <span className="vl">
                    <b>{report.dimensions.chain_fit}%</b> <small>({(report.dimensions.chain_fit * 0.35).toFixed(1)}/35 pts)</small>
                  </span>
                </div>

                <div className="dim">
                  <span className="nm">venue fit</span>
                  <span className="track">
                    <span
                      className="fill fill-venue"
                      style={{ width: `${report.dimensions.venue_fit}%` }}
                    ></span>
                  </span>
                  <span className="vl">
                    <b>{report.dimensions.venue_fit}%</b> <small>({(report.dimensions.venue_fit * 0.30).toFixed(1)}/30 pts)</small>
                  </span>
                </div>

                <div className="dim">
                  <span className="nm">meta heat</span>
                  <span className="track">
                    <span
                      className="fill fill-meta"
                      style={{ width: `${report.dimensions.meta_heat}%` }}
                    ></span>
                  </span>
                  <span className="vl">
                    <b>{report.dimensions.meta_heat}%</b> <small>({(report.dimensions.meta_heat * 0.20).toFixed(1)}/20 pts)</small>
                  </span>
                </div>

                <div className="dim">
                  <span className="nm">hour window</span>
                  <span className="track">
                    <span
                      className="fill fill-hour"
                      style={{ width: `${report.dimensions.hour_window}%` }}
                    ></span>
                  </span>
                  <span className="vl">
                    <b>{report.dimensions.hour_window}%</b> <small>({(report.dimensions.hour_window * 0.15).toFixed(1)}/15 pts)</small>
                  </span>
                </div>
              </div>

              <p className="caveat">
                {report.confidence_caveat} {report.disclaimer}
              </p>

              <div className="alts">
                <span>Next best:</span>
                {report.alternatives.map((alt) => (
                  <span key={alt.chain_name} className="alt-chip">
                    <b>{alt.chain_name}</b> {alt.composite_score}
                  </span>
                ))}
                <span className="alt-chip" style={{ background: 'rgba(123, 69, 216, 0.08)', color: '#7b45d8' }}>
                  classified as <b>{report.classified_category}</b>
                  {report.is_weak_signal && ' (weak signal)'}
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Matrix Section */}
      <section id="hours">
        <div className="eyebrow">chain by hour</div>
        <h2>The good hours are not the same on every chain</h2>
        <p className="lede">
          Rows are chains, columns are launch hours in UTC. A finding from one chain does not transfer to the next, which is why this is a matrix rather than a single number.
        </p>

        <div className="tabs" role="group" aria-label="Metric">
          <button
            data-m="survival"
            aria-pressed={metric === 'survival'}
            onClick={() => setMetric('survival')}
          >
            still alive<br />after 7 days
          </button>
          <button
            data-m="launches"
            aria-pressed={metric === 'launches'}
            onClick={() => setMetric('launches')}
          >
            launches<br />started
          </button>
          <button
            data-m="extraction"
            aria-pressed={metric === 'extraction'}
            onClick={() => setMetric('extraction')}
          >
            first minute<br />extraction
          </button>
        </div>

        <div className="scroller">
          <div className="matrix">
            {CHAINS.map(c => (
              <div className="mrow" key={c.key}>
                <div className="rlab">
                  <i className="ychip" style={{ background: c.hue }}></i>
                  <span>{c.name}</span>
                </div>
                {Array.from({ length: 24 }, (_, h) => {
                  const val = MATRIX_DATA[c.key]?.[metric]?.[h] ?? null;
                  const isSel = selectedCell?.k === c.key && selectedCell?.h === h;
                  const isFlash = flashCell?.k === c.key && flashCell?.h === h;

                  let bgStyle: string | undefined;
                  if (val != null) {
                    let norm = (val - lo) / (hi - lo || 1);
                    if (METRICS[metric].dir === 'low') norm = 1 - norm;
                    bgStyle = ramp(norm);
                  }

                  return (
                    <button
                      key={h}
                      className={`cell ${val == null ? 'nan' : ''} ${isSel ? 'sel' : ''} ${
                        isFlash ? 'flash' : ''
                      }`}
                      style={{ background: bgStyle }}
                      aria-label={`${c.name}, ${String(h).padStart(2, '0')}:00 UTC, ${
                        val == null ? 'no data' : METRICS[metric].fmt(val)
                      }`}
                      onClick={() => setSelectedCell({ k: c.key, h })}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          <div className="xaxis">
            <span></span>
            {Array.from({ length: 24 }, (_, h) => (
              <span key={h}>{h % 3 === 0 ? String(h).padStart(2, '0') : ''}</span>
            ))}
          </div>
        </div>

        <div className="xtitle">launch hour, UTC</div>

        <div className="cbar">
          <span>{METRICS[metric].dir === 'low' ? METRICS[metric].fmt(hi) : METRICS[metric].fmt(lo)}</span>
          <div
            className="cramp"
            style={{
              background: `linear-gradient(to right, ${Array.from({ length: 12 }, (_, i) =>
                ramp(i / 11)
              ).join(',')})`
            }}
          ></div>
          <span>{METRICS[metric].dir === 'low' ? METRICS[metric].fmt(lo) : METRICS[metric].fmt(hi)}</span>
        </div>

        <p className="note">
          Warm reads as favourable on every metric, so on extraction the scale is reversed and lower sits at the warm end. Launches started is intensity only, since congestion is a fact rather than a verdict.{' '}
          <i className="nankey"></i> means no collector is running for that chain, so the cell is empty rather than estimated.
        </p>

        <div className="cellinfo">
          {!selectedCell ? (
            <b>Pick a cell. Every figure carries its sample size, its confidence, and its source.</b>
          ) : (
            <>
              <b>
                {selectedChainData?.name} at {String(selectedCell.h).padStart(2, '0')}:00 UTC
              </b>{' '}
              — {METRICS[metric].label}
              <div className="kv">
                <div>value</div>
                <div>{selectedVal == null ? 'no data' : METRICS[metric].fmt(selectedVal)}</div>
                <div>range on this chart</div>
                <div>
                  {METRICS[metric].fmt(lo)} to {METRICS[metric].fmt(hi)}
                </div>
                <div>sample size</div>
                <div>{selectedChainData?.n ? selectedChainData.n.toLocaleString() : '0'}</div>
                <div>confidence</div>
                <div>
                  <span className={`conf c-${selectedChainData?.conf}`}>{selectedChainData?.conf}</span>
                </div>
                <div>source</div>
                <div>{selectedChainData?.src}</div>
              </div>
              <p style={{ marginTop: 10, color: 'var(--dim)' }}>{cellReadout}</p>
            </>
          )}
        </div>
      </section>

      {/* Venues Table Section */}
      <section id="venues">
        <div className="eyebrow">launchpads</div>
        <h2>The comparison that does not exist in public</h2>
        <p className="lede">
          Every venue on one scale, with the number that matters most last: how many of its launches are still trading a week later. Tap a column heading to sort.
        </p>
        <p className="note" style={{ marginTop: 0 }}>
          Scroll sideways for the full table.
        </p>

        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th
                  onClick={() => {
                    if (sortKey === 'name') setSortDir(prev => (prev === 1 ? -1 : 1));
                    else {
                      setSortKey('name');
                      setSortDir(1);
                    }
                  }}
                  aria-sort={sortKey === 'name' ? (sortDir === -1 ? 'descending' : 'ascending') : undefined}
                >
                  venue
                </th>
                <th
                  onClick={() => {
                    if (sortKey === 'chain') setSortDir(prev => (prev === 1 ? -1 : 1));
                    else {
                      setSortKey('chain');
                      setSortDir(1);
                    }
                  }}
                  aria-sort={sortKey === 'chain' ? (sortDir === -1 ? 'descending' : 'ascending') : undefined}
                >
                  chain
                </th>
                <th
                  onClick={() => {
                    if (sortKey === 'perday') setSortDir(prev => (prev === 1 ? -1 : 1));
                    else {
                      setSortKey('perday');
                      setSortDir(-1);
                    }
                  }}
                  aria-sort={sortKey === 'perday' ? (sortDir === -1 ? 'descending' : 'ascending') : undefined}
                >
                  launches per day
                </th>
                <th
                  onClick={() => {
                    if (sortKey === 'liq') setSortDir(prev => (prev === 1 ? -1 : 1));
                    else {
                      setSortKey('liq');
                      setSortDir(-1);
                    }
                  }}
                  aria-sort={sortKey === 'liq' ? (sortDir === -1 ? 'descending' : 'ascending') : undefined}
                >
                  median launch liquidity
                </th>
                <th
                  onClick={() => {
                    if (sortKey === 'extract') setSortDir(prev => (prev === 1 ? -1 : 1));
                    else {
                      setSortKey('extract');
                      setSortDir(-1);
                    }
                  }}
                  aria-sort={sortKey === 'extract' ? (sortDir === -1 ? 'descending' : 'ascending') : undefined}
                >
                  first minute extraction
                </th>
                <th
                  onClick={() => {
                    if (sortKey === 'surv') setSortDir(prev => (prev === 1 ? -1 : 1));
                    else {
                      setSortKey('surv');
                      setSortDir(-1);
                    }
                  }}
                  aria-sort={sortKey === 'surv' ? (sortDir === -1 ? 'descending' : 'ascending') : undefined}
                >
                  alive after 7 days
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedVenues.map(v => {
                const chainData = CHAINS.find(c => c.key === v.chain);
                return (
                  <tr key={v.name}>
                    <td>
                      <span className="vname">
                        <i className="vchip" style={{ background: chainData?.hue }}></i>
                        {v.name}
                      </span>
                    </td>
                    <td style={{ color: 'var(--dim)' }}>{chainData?.name}</td>
                    <td>{v.perday.toLocaleString()}</td>
                    <td>${v.liq.toLocaleString()}</td>
                    <td style={{ color: shade(ramp(1 - (v.extract - 35) / 45), 0.62) }}>
                      {v.extract}%
                    </td>
                    <td>
                      <span className="minibar">
                        <span className="t">
                          <span
                            className="f"
                            style={{
                              width: `${(v.surv / maxSurv) * 100}%`,
                              background: ramp((v.surv / maxSurv) * 0.75)
                            }}
                          ></span>
                        </span>
                        {v.surv.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="note">
          Extraction is the share of first minute volume taken by wallets that sell within thirty minutes and hold nothing after. Lower is healthier.
        </p>
      </section>

      {/* Method Section */}
      <section id="method">
        <div className="eyebrow">method</div>
        <h2>Everything above is checkable</h2>
        <p className="lede">
          A recommendation engine nobody can inspect is indistinguishable from an advertisement for whichever venue it favours. So the weights, the definitions and the queries are public, and they change in public.
        </p>

        <div className="cards">
          <div className="card">
            <h3>Surviving</h3>
            <p>Still meeting the liquidity and trade thresholds seven days after launch. One definition, frozen, versioned when it changes.</p>
          </div>
          <div className="card">
            <h3>Adjusted volume</h3>
            <p>Raw volume minus flow matching wash patterns. Raw is always shown beside it so you can see what was removed.</p>
          </div>
          <div className="card">
            <h3>Confidence</h3>
            <p>Every figure carries its sample size. Below the floor it reads low and is never quietly averaged into a score.</p>
          </div>
          <div className="card">
            <h3>Coverage</h3>
            <p>A chain without a collector shows empty, not estimated. Gaps are stated rather than filled in.</p>
          </div>
        </div>

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
          <p style={{ color: 'var(--dimmer)', fontSize: 11, marginTop: 4 }}>
            Starting weights, treated as a hypothesis. Any change is evaluated against held out launches before it ships.
          </p>
        </div>

        <div className="never">
          <h3>What Waggle will never do</h3>
          <ul>
            <li>Predict that a launch will succeed. It describes structural fit, nothing more.</li>
            <li>Take payment from a launchpad for placement or for a score.</li>
            <li>Hold a position in any venue it scores.</li>
            <li>Show a figure without its sample size and confidence.</li>
            <li>Use a submitted project in any public output. Submissions stay private.</li>
          </ul>
        </div>
      </section>

      {/* Footer */}
      <footer>
        Live figures wired to the metrics engine snapshot shape.<br />
        This describes structural fit from historical data. It is not advice and not a prediction.<br />
        A project of Modus Research Lab.
      </footer>
    </div>
  );
}
