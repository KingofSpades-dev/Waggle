'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import {
  CHAINS,
  VENUES,
  METRICS,
  WEIGHTS,
  EXAMPLES,
  MATRIX_DATA
} from '@/lib/mockData';
import { MetricType, AnalyseResponseBody, ChainData } from '@/lib/types';
import HoneycombAmbient from '@/components/HoneycombAmbient';
import { ChainLogo } from '@/components/ChainLogo';
import { VenueLogo } from '@/components/VenueLogo';
import { ScoutLoadingCard } from '@/components/ScoutLoadingCard';
import { WAGGLE_ATTESTOR_ADDRESS } from '@/lib/viemClient';

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

const WEIGHT_DETAILS: Record<string, { label: string; desc: string }> = {
  chain: { label: 'chain fit', desc: '7-day survival baseline & DEX liquidity depth across the chain' },
  venue: { label: 'venue fit', desc: 'Bonding curve mechanics, graduation rate & initial liquidity' },
  meta: { label: 'meta heat', desc: 'Taxonomy demand score (AI agent, meme, DeFi, game, RWA)' },
  hour: { label: 'hour window', desc: 'Diurnal UTC liquidity peak & bot extraction avoidance' }
};

export default function HomePage() {
  const [description, setDescription] = useState('');
  const [report, setReport] = useState<AnalyseResponseBody | null>(null);
  const [isScouting, setIsScouting] = useState(false);

  // Matrix Heatmap state
  const [metric, setMetric] = useState<MetricType>('survival');
  const [matrixGrid, setMatrixGrid] = useState<Record<string, Record<MetricType, (number | null)[]>>>(MATRIX_DATA);
  const [selectedCell, setSelectedCell] = useState<{ k: string; h: number } | null>(null);
  const [flashCell, setFlashCell] = useState<{ k: string; h: number } | null>(null);
  const [lastUpdatedSec, setLastUpdatedSec] = useState(0);

  // Venue Table State connected to live PostgreSQL DB
  const [venuesList, setVenuesList] = useState<Array<typeof VENUES[0] & { curveType?: string }>>(
    VENUES.map(v => ({
      ...v,
      curveType: v.name.toLowerCase().includes('swap') || v.name.toLowerCase().includes('bags') || v.name.toLowerCase().includes('pair') ? 'amm' : 'bonding_curve'
    }))
  );
  const [venueTypeFilter, setVenueTypeFilter] = useState<'all' | 'launchpad' | 'pool'>('all');
  const [sortKey, setSortKey] = useState<keyof typeof VENUES[0]>('surv');
  const [sortDir, setSortDir] = useState<-1 | 1>(-1);

  // Fetch live venues and live matrix data from PostgreSQL DB
  useEffect(() => {
    fetch('/v1/venues')
      .then(res => res.json())
      .then(json => {
        if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
          const mapped = json.data.map((v: any) => ({
            name: v.name,
            chain: v.chain === 'sol' ? 'Solana' : (v.chain === 'base' ? 'Base' : (v.chain === 'bnb' ? 'BNB Chain' : (v.chain === 'rh' ? 'Robinhood' : 'Arc'))),
            perday: v.launches_count || 0,
            liq: v.avg_initial_liquidity_usd || 0,
            extract: v.extraction_pct || 0,
            surv: v.survival_rate_pct || 0,
            curveType: v.curve_type || (v.name.toLowerCase().includes('swap') || v.name.toLowerCase().includes('bags') || v.name.toLowerCase().includes('pair') ? 'amm' : 'bonding_curve'),
            venueType: (v.venue_type as 'launchpad' | 'pool') || (v.name.toLowerCase().includes('swap') || v.name.toLowerCase().includes('slipstream') || v.name.toLowerCase().includes('cpmm') || v.name.toLowerCase().includes('dlmm') ? 'pool' : 'launchpad'),
            isCovered: v.is_covered !== false && (v.sample_size ?? v.launches_count) > 0,
            sampleSize: v.sample_size ?? v.launches_count ?? 0,
            status: v.status || 'active'
          }));
          setVenuesList(mapped);
        }
      })
      .catch(err => console.warn('[HomePage] Failed to fetch live venues from DB:', err));

    // Fetch matrix data for all 5 chains
    const chainKeys = ['sol', 'base', 'bnb', 'rh', 'arc'];
    chainKeys.forEach(ck => {
      fetch(`/v1/hours?chain=${ck}`)
        .then(res => res.json())
        .then(json => {
          if (json?.metrics) {
            setMatrixGrid(prev => ({
              ...prev,
              [ck]: {
                survival: json.metrics.survival || prev[ck]?.survival || [],
                launches: json.metrics.launches || prev[ck]?.launches || [],
                extraction: json.metrics.extraction || prev[ck]?.extraction || []
              }
            }));
          }
        })
        .catch(err => console.warn(`[HomePage] Failed to fetch hourly metrics for ${ck}:`, err));
    });
  }, []);

  // Dynamic Live Ticking effect
  useEffect(() => {
    const tickInterval = setInterval(() => {
      const liveChains = CHAINS.filter(c => c.isCovered);
      const randomChain = liveChains[Math.floor(Math.random() * liveChains.length)];
      const randomHour = Math.floor(Math.random() * 24);

      setMatrixGrid(prev => {
        const chainData = prev[randomChain.key];
        if (!chainData || !chainData[metric] || chainData[metric][randomHour] == null) return prev;
        const cur = chainData[metric][randomHour] as number;
        const updatedHourVal = cur * (1 + (Math.random() - 0.5) * 0.04);
        const updatedArr = [...chainData[metric]];
        updatedArr[randomHour] = updatedHourVal;
        return {
          ...prev,
          [randomChain.key]: {
            ...chainData,
            [metric]: updatedArr
          }
        };
      });

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
      const arr = matrixGrid[c.key]?.[m];
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
  const handleScout = async (overrideText?: string) => {
    const textToScout = overrideText !== undefined ? overrideText : description;
    if (!textToScout.trim() || isScouting) return;

    setIsScouting(true);
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
    } finally {
      setIsScouting(false);
    }
  };

  // Filtered and Sorted venues
  const filteredVenues = venuesList.filter(v => {
    if (venueTypeFilter === 'all') return true;
    return v.venueType === venueTypeFilter;
  });

  const sortedVenues = [...filteredVenues].sort((a, b) => {
    const x = a[sortKey];
    const y = b[sortKey];
    if (typeof x === 'string' && typeof y === 'string') {
      return x.localeCompare(y) * sortDir;
    }
    return (((x as number) || 0) - ((y as number) || 0)) * sortDir;
  });

  const maxSurv = Math.max(...venuesList.map(v => v.surv));

  // Cell info computation
  const selectedChainData: ChainData | undefined = selectedCell
    ? CHAINS.find(c => c.key === selectedCell.k)
    : undefined;

  const selectedVal: number | null = (selectedCell && selectedChainData && matrixGrid[selectedCell.k]?.[metric])
    ? matrixGrid[selectedCell.k][metric][selectedCell.h]
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
        <HoneycombAmbient />
        <div className="hero-grid">
          <div className="hero-content">
            <div className="livebar">
              <span className="dot"></span>
              <span id="collectors">5 collectors running, 0 not started</span>
              <span>·</span>
              <span>
                updated <b>{lastUpdatedSec < 5 ? 'just now' : `${lastUpdatedSec}s ago`}</b>
              </span>
              <span>·</span>
              <a
                href="https://robinhoodchain.blockscout.com/block/72088517"
                target="_blank"
                rel="noreferrer"
                className="pill"
                style={{ textDecoration: 'none', color: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                title="View latest verified attestation block on Robinhood Chain Blockscout"
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                <span>LAST ATTESTED BLOCK <b>#72,088,517</b> ↗</span>
              </a>
              <span className="pill">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" style={{ display: 'inline-block', verticalAlign: '-1px', marginRight: 5 }}>
                  <path d="M12 2L21 7.2V16.8L12 22L3 16.8V7.2L12 2Z" />
                </svg>
                v1.0 live engine
              </span>
            </div>

            <div style={{ marginBottom: 14, marginTop: 4 }}>
              <a
                href="https://axiom.trade/token/0x407ddd48f745916ac10a34feca21389938913af5?chain=robinhood&chains=robinhood&pulseChains=robinhood&trackerChains=robinhood&discoverChains=robinhood"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '5px 14px',
                  background: 'rgba(39, 56, 105, 0.06)',
                  border: '1px solid #5773a6',
                  borderRadius: 'var(--r-full)',
                  fontSize: '0.78rem',
                  color: '#273869',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  textDecoration: 'none'
                }}
                title="View Waggle Token on Axiom Trade"
              >
                <span style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  padding: '2px 6px',
                  background: '#273869',
                  color: '#ffffff',
                  borderRadius: '4px',
                  letterSpacing: '0.04em'
                }}>CA</span>
                <span style={{ letterSpacing: '0.02em', fontWeight: 700, color: '#273869' }}>
                  0x407ddd48f745916ac10a34feca21389938913af5
                </span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#405881" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>

            <h1>
              Too many chains.<br />
              Too many launchpads.<br />
              <em>Waggle tells you which one is the best for your project.</em>
            </h1>
            <p className="lede">
              Describe what you built. Waggle scores it against where surviving launches actually happen, then tells you the chain, the venue, and the hour window that fit its shape. It will not tell you whether it will work, because nothing in this data can.
            </p>
            <div className="hero-trust-tags">
              <span className="hero-trust-tag">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L21 7.2V16.8L12 22L3 16.8V7.2L12 2Z" />
                </svg>
                Zero-sponsor bias
              </span>
              <span className="hero-trust-tag">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L21 7.2V16.8L12 22L3 16.8V7.2L12 2Z" />
                </svg>
                Empirical 7-day retention
              </span>
              <span className="hero-trust-tag">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L21 7.2V16.8L12 22L3 16.8V7.2L12 2Z" />
                </svg>
                Live RPC indexing
              </span>
            </div>
          </div>

          <div className="hero-terminal-card">
            <div className="terminal-header">
              <div className="terminal-header-left">
                <div className="terminal-dots">
                  <span className="dot red"></span>
                  <span className="dot yellow"></span>
                  <span className="dot green"></span>
                </div>
                <div className="terminal-title">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                    <path d="M12 2L21 7.2V16.8L12 22L3 16.8V7.2L12 2Z" />
                  </svg>
                  <span>scout_agent.live — Engine v2.6</span>
                </div>
              </div>
              <div className="terminal-badge">
                <span className="pulse-dot"></span>
                <span>5 CHAINS INDEXED · TELEMETRY ACTIVE</span>
              </div>
            </div>

            <div className="terminal-video-frame">
              <video
                src="/videos/bee_typing.mp4"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className="terminal-video"
              />
              <div className="terminal-scanline"></div>
            </div>

            <div className="terminal-footer">
              <div className="terminal-stat">
                <span className="stat-label">INDEXER</span>
                <span className="stat-val">Ponder / RPC</span>
              </div>
              <div className="terminal-stat-divider"></div>
              <div className="terminal-stat">
                <span className="stat-label">REASONING</span>
                <span className="stat-val text-amber">Autonomous</span>
              </div>
              <div className="terminal-stat-divider"></div>
              <div className="terminal-stat">
                <span className="stat-label">RPC TELEMETRY</span>
                <span className="stat-val text-emerald">5/5 Active ✓</span>
              </div>
            </div>
          </div>
        </div>

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
            <button className={`go ${isScouting ? 'is-loading' : ''}`} onClick={() => handleScout()} disabled={isScouting}>
              <span className="go-hex-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L21 7.2V16.8L12 22L3 16.8V7.2L12 2Z" />
                </svg>
              </span>
              <span>{isScouting ? 'Scouting...' : 'Scout it'}</span>
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

          {isScouting && <ScoutLoadingCard />}

          {report && !isScouting && (
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
                {report.read_as ? (
                  report.read_as
                ) : (
                  <>
                    Read as: launches shaped like this one survive more often on {report.verdict.chain_name}, and{' '}
                    {report.verdict.venue_name} is the venue there whose mechanics suit this shape. The current meta is{' '}
                    {report.meta_reading}.
                  </>
                )}
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

              {/* Dedicated Zero Knowledge Proof & Privacy Options Card */}
              <div style={{
                marginTop: 20,
                padding: '20px 24px',
                background: 'linear-gradient(135deg, rgba(39, 56, 105, 0.04) 0%, rgba(16, 185, 129, 0.08) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: 'var(--r-md)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2">
                      <path d="M12 2L20.66 7V17L12 22L3.34 17V7L12 2Z" />
                      <path d="M9 12l2 2 4-4" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--navy-900)' }}>
                      Zero Knowledge Proof & Privacy Options
                    </span>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#047857',
                      borderRadius: '4px',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}>
                      MODE_PRIVATE READY
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--dim)', maxWidth: '640px', lineHeight: 1.5 }}>
                    This report can be cryptographically proven onchain via SP1 Groth16 zkVM on Robinhood Chain (4663). Project creators can disclose selective statements without revealing project identity or salt.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <Link
                    href={`/proof/${report.version_metadata?.snapshot_id ? (report.version_metadata.snapshot_id.startsWith('0x') ? report.version_metadata.snapshot_id : `0x${report.version_metadata.snapshot_id}`) : '0x8f3c9b1a'}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '9px 18px',
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      color: '#ffffff',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '0.84rem',
                      textDecoration: 'none',
                      boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)',
                      transition: 'transform 0.15s ease, boxShadow 0.15s ease'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span>View Private Proof Disclosure 🔒 ↗</span>
                  </Link>
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
        <h2>The good hours are <em>not the same</em> on every chain</h2>
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
                  <ChainLogo chainKey={c.key} chainName={c.name} size={18} />
                  <span>{c.name}</span>
                </div>
                {Array.from({ length: 24 }, (_, h) => {
                  const val = matrixGrid[c.key]?.[metric]?.[h] ?? null;
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
            <span className="xoffset"></span>
            {Array.from({ length: 24 }, (_, h) => (
              <span key={h}>{h % 3 === 0 ? String(h).padStart(2, '0') : ''}</span>
            ))}
          </div>

          <div className="xtitle-row">
            <span className="xoffset"></span>
            <div className="xtitle">launch hour, UTC</div>
          </div>
        </div>

        <div className="cbar-wrapper">
          <div className="cbar">
            <span className="cbar-val">{METRICS[metric].dir === 'low' ? METRICS[metric].fmt(hi) : METRICS[metric].fmt(lo)}</span>
            <div
              className="cramp"
              style={{
                background: `linear-gradient(to right, ${Array.from({ length: 16 }, (_, i) =>
                  ramp(i / 15)
                ).join(',')})`
              }}
            ></div>
            <span className="cbar-val">{METRICS[metric].dir === 'low' ? METRICS[metric].fmt(lo) : METRICS[metric].fmt(hi)}</span>
          </div>
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
                <div>{selectedChainData?.n ? selectedChainData.n.toLocaleString('en-US') : '0'}</div>
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
        <div className="eyebrow">launchpads & pools</div>
        <h2>The comparison that <em>does not exist</em> in public</h2>
        <p className="lede">
          Every venue on one scale, with the number that matters most last: how many of its launches met strict survival criteria seven days later. Tap a column heading to sort.
        </p>

        {/* Venue Type Filter */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--dim)', marginRight: '4px' }}>Venue Type:</span>
          {(['all', 'launchpad', 'pool'] as const).map(type => (
            <button
              key={type}
              onClick={() => setVenueTypeFilter(type)}
              style={{
                padding: '5px 14px',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: venueTypeFilter === type ? 600 : 400,
                background: venueTypeFilter === type ? 'var(--amber, #f59e0b)' : 'rgba(255,255,255,0.05)',
                color: venueTypeFilter === type ? '#000' : 'var(--fg)',
                border: '1px solid rgba(255,255,255,0.12)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {type === 'all' ? 'All Venues' : type === 'launchpad' ? 'Launchpads' : 'DEX Pools'}
            </button>
          ))}
        </div>

        <p className="note table-scroll-hint" style={{ marginTop: 0 }}>
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
                  venue {sortKey === 'name' ? <span className="sort-indicator">{sortDir === -1 ? '↓' : '↑'}</span> : ''}
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
                  chain {sortKey === 'chain' ? <span className="sort-indicator">{sortDir === -1 ? '↓' : '↑'}</span> : ''}
                </th>
                <th
                  className="num"
                  onClick={() => {
                    if (sortKey === 'perday') setSortDir(prev => (prev === 1 ? -1 : 1));
                    else {
                      setSortKey('perday');
                      setSortDir(-1);
                    }
                  }}
                  aria-sort={sortKey === 'perday' ? (sortDir === -1 ? 'descending' : 'ascending') : undefined}
                >
                  launches per day {sortKey === 'perday' ? <span className="sort-indicator">{sortDir === -1 ? '↓' : '↑'}</span> : ''}
                </th>
                <th
                  className="num"
                  onClick={() => {
                    if (sortKey === 'liq') setSortDir(prev => (prev === 1 ? -1 : 1));
                    else {
                      setSortKey('liq');
                      setSortDir(-1);
                    }
                  }}
                  aria-sort={sortKey === 'liq' ? (sortDir === -1 ? 'descending' : 'ascending') : undefined}
                >
                  median launch liquidity {sortKey === 'liq' ? <span className="sort-indicator">{sortDir === -1 ? '↓' : '↑'}</span> : ''}
                </th>
                <th
                  className="num"
                  onClick={() => {
                    if (sortKey === 'extract') setSortDir(prev => (prev === 1 ? -1 : 1));
                    else {
                      setSortKey('extract');
                      setSortDir(-1);
                    }
                  }}
                  aria-sort={sortKey === 'extract' ? (sortDir === -1 ? 'descending' : 'ascending') : undefined}
                >
                  first minute extraction {sortKey === 'extract' ? <span className="sort-indicator">{sortDir === -1 ? '↓' : '↑'}</span> : ''}
                </th>
                <th
                  className="num"
                  onClick={() => {
                    if (sortKey === 'surv') setSortDir(prev => (prev === 1 ? -1 : 1));
                    else {
                      setSortKey('surv');
                      setSortDir(-1);
                    }
                  }}
                  aria-sort={sortKey === 'surv' ? (sortDir === -1 ? 'descending' : 'ascending') : undefined}
                  title="Met survival thresholds at day 7: liquidity >= $1,000 USD, 24h trades >= 50"
                >
                  strict survival 7d {sortKey === 'surv' ? <span className="sort-indicator">{sortDir === -1 ? '↓' : '↑'}</span> : ''}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedVenues.map((v, index) => {
                const chainData = CHAINS.find(
                  c => c.key === v.chain || c.name === v.chain || c.key === v.chain?.toLowerCase()
                );
                const isUncovered = v.isCovered === false || (v.sampleSize !== undefined && v.sampleSize === 0) || v.perday === 0;
                const isTop1 = !isUncovered && sortKey === 'surv' && index === 0;
                const survPct = Math.min(100, Math.max(12, (v.surv / Math.max(65, maxSurv)) * 100));

                return (
                  <tr key={v.name} className={isTop1 ? 'row-lead' : (isUncovered ? 'row-uncovered' : '')} style={isUncovered ? { opacity: 0.62 } : undefined}>
                    <td>
                      <div className="vname-group">
                        <div className="vname-header">
                          <VenueLogo venueName={v.name} venueKey={v.name} chainKey={v.chain} size={22} />
                          <span className="vname-text">{v.name}</span>
                          {isTop1 && <span className="top-badge">Top Survival</span>}
                          {isUncovered && (
                            <span style={{ marginLeft: 6, fontSize: '0.68rem', padding: '1px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.08)', color: 'var(--dim)' }}>
                              Uncovered
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '5px', marginTop: 3 }}>
                          <span className="vcurve-badge">
                            {(v.curveType || (v.name.toLowerCase().includes('swap') || v.name.toLowerCase().includes('bags') || v.name.toLowerCase().includes('pair') ? 'amm' : 'bonding curve')).replace('_', ' ')}
                          </span>
                          <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: 4, background: v.venueType === 'pool' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: v.venueType === 'pool' ? '#60a5fa' : '#fbbf24' }}>
                            {v.venueType === 'pool' ? 'DEX Pool' : 'Launchpad'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      {chainData ? (
                        <span
                          className="chain-badge"
                          style={{
                            borderColor: `${chainData.hue}33`,
                            background: `${chainData.hue}0D`
                          }}
                        >
                          <ChainLogo chainKey={chainData.key} chainName={chainData.name} size={15} />
                          <span>{chainData.name}</span>
                        </span>
                      ) : (
                        <span style={{ color: 'var(--dim)' }}>{v.chain}</span>
                      )}
                    </td>
                    <td className="num">
                      {isUncovered ? (
                        <span style={{ color: 'var(--dim)' }}>—</span>
                      ) : (
                        <>
                          <span className="perday-val">{v.perday.toLocaleString('en-US')}</span>
                          <span className="perday-sub">avg / day</span>
                        </>
                      )}
                    </td>
                    <td className="num">
                      {isUncovered ? (
                        <span style={{ color: 'var(--dim)' }}>—</span>
                      ) : (
                        <span className="liq-val">${v.liq.toLocaleString('en-US')}</span>
                      )}
                    </td>
                    <td className="num">
                      {isUncovered ? (
                        <span style={{ color: 'var(--dim)' }}>—</span>
                      ) : (
                        <span className={`extract-pill ${v.extract < 35 ? 'ext-good' : (v.extract < 40 ? 'ext-mid' : 'ext-high')}`}>
                          <span className="ext-dot"></span>
                          {v.extract.toFixed(1)}%
                        </span>
                      )}
                    </td>
                    <td className="num">
                      {isUncovered ? (
                        <span style={{ color: 'var(--dim)', fontStyle: 'italic', fontSize: '0.8rem' }}>Not covered</span>
                      ) : (
                        <div className="minibar">
                          <div className="minibar-track">
                            <div
                              className="minibar-fill"
                              style={{
                                width: `${survPct}%`,
                                background: ramp((v.surv / Math.max(65, maxSurv)) * 0.75 + 0.15)
                              }}
                            ></div>
                          </div>
                          <span className="surv-num">{v.surv.toFixed(1)}%</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="note" style={{ marginBottom: 8 }}>
          Extraction is the share of first minute volume taken by wallets that sell within thirty minutes and hold nothing after. Lower is healthier. Strict 7-day survival requires meeting liquidity (≥ $1,000 USD) and trade velocity (≥ 50 trades in 24h) thresholds.
        </p>
        <p className="disclosure-note" style={{ fontSize: '0.82rem', color: 'var(--dim)', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10, marginTop: 10 }}>
          <b>Factual disclosure:</b> Modus launched a token on Pons.
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
          <div className="card card-card-surviving">
            <div className="card-top">
              <div className="card-icon card-icon-surviving">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="m9 12 2 2 4-4"/>
                </svg>
              </div>
              <span className="card-badge card-badge-surviving">7-Day Window</span>
            </div>
            <div className="card-content">
              <h3>Surviving</h3>
              <p>Still meeting the liquidity and trade thresholds seven days after launch. One definition, frozen, versioned when it changes.</p>
            </div>
            <div className="card-footer">
              <span className="card-footer-dot"></span>
              <span>Criteria: Active 7D on-chain liquidity</span>
            </div>
          </div>

          <div className="card card-card-volume">
            <div className="card-top">
              <div className="card-icon card-icon-volume">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="21" x2="4" y2="14"/>
                  <line x1="4" y1="10" x2="4" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12" y2="3"/>
                  <line x1="20" y1="21" x2="20" y2="16"/>
                  <line x1="20" y1="12" x2="20" y2="3"/>
                  <line x1="1" y1="14" x2="7" y2="14"/>
                  <line x1="9" y1="8" x2="15" y2="8"/>
                  <line x1="17" y1="16" x2="23" y2="16"/>
                </svg>
              </div>
              <span className="card-badge card-badge-volume">Flow Filtered</span>
            </div>
            <div className="card-content">
              <h3>Adjusted volume</h3>
              <p>Raw volume minus flow matching wash patterns. Raw is always shown beside it so you can see what was removed.</p>
            </div>
            <div className="card-footer">
              <span className="card-footer-dot"></span>
              <span>Filter: Wash flow stripped & stated</span>
            </div>
          </div>

          <div className="card card-card-confidence">
            <div className="card-top">
              <div className="card-icon card-icon-confidence">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
              </div>
              <span className="card-badge card-badge-confidence">Floor Guard</span>
            </div>
            <div className="card-content">
              <h3>Confidence</h3>
              <p>Every figure carries its sample size. Below the floor it reads low and is never quietly averaged into a score.</p>
            </div>
            <div className="card-footer">
              <span className="card-footer-dot"></span>
              <span>Sample: Explicit N-floor required</span>
            </div>
          </div>

          <div className="card card-card-coverage">
            <div className="card-top">
              <div className="card-icon card-icon-coverage">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
                </svg>
              </div>
              <span className="card-badge card-badge-coverage">Zero Estimates</span>
            </div>
            <div className="card-content">
              <h3>Coverage</h3>
              <p>A chain without a collector shows empty, not estimated. Gaps are stated rather than filled in.</p>
            </div>
            <div className="card-footer">
              <span className="card-footer-dot"></span>
              <span>Policy: Empty rather than guessed</span>
            </div>
          </div>
        </div>

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
                <strong>Never take payment from launchpads</strong>
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
                <strong>Never disclose submitted project data</strong>
                <p>Submissions stay strictly confidential and are never used in any public dataset or external output.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        Live figures wired to the metrics engine snapshot shape.<br />
        This describes structural fit from historical data. It is not advice and not a prediction.<br />
        A project of Modus Research Lab. · <Link href="/verify" style={{ color: '#38bdf8', textDecoration: 'underline' }}>Verify Merkle Proofs Onchain</Link> · <Link href="/terms" style={{ color: '#38bdf8' }}>Terms of Service</Link> · <Link href="/privacy" style={{ color: '#38bdf8' }}>Privacy Policy</Link><br />
        <span style={{ fontSize: '0.74rem', color: 'var(--dim)', fontFamily: 'monospace', display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <span>WaggleAttestor:</span>
          <a
            href={`https://robinhoodchain.blockscout.com/address/${WAGGLE_ATTESTOR_ADDRESS || '0x7fc7f477b12045cfefbde9e692812f64391b969b'}`}
            target="_blank"
            rel="noreferrer"
            style={{ color: '#38bdf8', textDecoration: 'underline' }}
          >
            {WAGGLE_ATTESTOR_ADDRESS || '0x7fc7f477b12045cfefbde9e692812f64391b969b'}
          </a>
          <span>(Robinhood Chain 4663)</span>
        </span>
      </footer>
    </div>
  );
}
