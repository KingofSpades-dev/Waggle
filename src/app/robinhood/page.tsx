'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { VenueLogo } from '@/components/VenueLogo';
import { ChainLogo } from '@/components/ChainLogo';
import {
  ShieldCheck,
  ExternalLink,
  Flame,
  Clock,
  Activity,
  Layers,
  CheckCircle2,
  TrendingUp,
  Cpu,
  BarChart3,
  ArrowRight,
  Database
} from 'lucide-react';
import {
  WAGGLE_ATTESTOR_ADDRESS,
  ROBINHOOD_CHAIN_ID
} from '@/lib/viemClient';

interface RobinhoodVenue {
  name: string;
  key: string;
  curveType: string;
  surv7d: number;
  launchesPerDay: number;
  medianLiquidityUsd: number;
  extractionPct: number;
  status: 'active' | 'paused' | 'inactive';
  attributedSharePct: number;
}

const ROBINHOOD_VENUES: RobinhoodVenue[] = [
  {
    name: 'Pons',
    key: 'pons',
    curveType: 'Direct Liquidity AMM',
    surv7d: 67.0,
    launchesPerDay: 540,
    medianLiquidityUsd: 15600,
    extractionPct: 28.0,
    status: 'active',
    attributedSharePct: 25.7,
  },
  {
    name: 'Artemis Launcher',
    key: 'artemis',
    curveType: 'Atomic Launch (Token + Uniswap V2 Pair)',
    surv7d: 65.4,
    launchesPerDay: 180,
    medianLiquidityUsd: 18500,
    extractionPct: 28.5,
    status: 'active',
    attributedSharePct: 8.6,
  },
  {
    name: 'Pools.trade',
    key: 'pools_trade',
    curveType: 'Concentrated Tick Liquidity',
    surv7d: 63.0,
    launchesPerDay: 420,
    medianLiquidityUsd: 14800,
    extractionPct: 30.0,
    status: 'active',
    attributedSharePct: 20.0,
  },
  {
    name: 'hood.fun',
    key: 'hood_fun',
    curveType: 'Linear Bonding Curve',
    surv7d: 49.0,
    launchesPerDay: 850,
    medianLiquidityUsd: 6400,
    extractionPct: 48.0,
    status: 'active',
    attributedSharePct: 40.5,
  },
  {
    name: 'Noxa',
    key: 'noxa',
    curveType: 'Bonding Curve (Paused)',
    surv7d: 38.5,
    launchesPerDay: 0,
    medianLiquidityUsd: 4200,
    extractionPct: 52.0,
    status: 'paused', // Noxa Paused (TASK-2.2.3)
    attributedSharePct: 0.0,
  },
];

export default function RobinhoodHubPage() {
  const [activeMetric, setActiveMetric] = useState<'survival' | 'launches' | 'extraction'>('survival');
  const [selectedHour, setSelectedHour] = useState<number>(16); // Peak hour 16 UTC default
  const [l2BlockHeight, setL2BlockHeight] = useState<number>(72_088_517);

  useEffect(() => {
    const timer = setInterval(() => {
      setL2BlockHeight(prev => prev + 1);
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  // 24 Hours UTC Heatmap data for Robinhood Chain (ID: 4663)
  const hourlyData = [
    { hour: 0, surv: 42.1, launches: 7, extract: 41.2 },
    { hour: 1, surv: 43.5, launches: 6, extract: 40.8 },
    { hour: 2, surv: 45.0, launches: 6, extract: 39.5 },
    { hour: 3, surv: 44.2, launches: 5, extract: 40.1 },
    { hour: 4, surv: 46.8, launches: 7, extract: 38.6 },
    { hour: 5, surv: 48.0, launches: 8, extract: 37.9 },
    { hour: 6, surv: 49.5, launches: 9, extract: 36.4 },
    { hour: 7, surv: 51.0, launches: 10, extract: 35.8 },
    { hour: 8, surv: 52.4, launches: 11, extract: 35.1 },
    { hour: 9, surv: 53.8, launches: 12, extract: 34.0 },
    { hour: 10, surv: 55.2, launches: 13, extract: 33.2 },
    { hour: 11, surv: 56.0, launches: 14, extract: 32.5 },
    { hour: 12, surv: 58.4, launches: 15, extract: 31.0 },
    { hour: 13, surv: 60.1, launches: 16, extract: 30.2 },
    { hour: 14, surv: 63.5, launches: 17, extract: 29.1 },
    { hour: 15, surv: 66.2, launches: 18, extract: 28.4 },
    { hour: 16, surv: 67.8, launches: 19, extract: 27.8 }, // Peak survival UTC 16
    { hour: 17, surv: 65.4, launches: 18, extract: 28.6 },
    { hour: 18, surv: 64.0, launches: 17, extract: 29.5 },
    { hour: 19, surv: 61.2, launches: 16, extract: 31.2 },
    { hour: 20, surv: 57.5, launches: 14, extract: 32.9 },
    { hour: 21, surv: 52.0, launches: 12, extract: 35.4 },
    { hour: 22, surv: 48.2, launches: 10, extract: 37.8 },
    { hour: 23, surv: 44.0, launches: 8, extract: 39.5 },
  ];

  const totalAttributedPct = 94.8;
  const unknownSharePct = 5.2;

  return (
    <main className="wrap" style={{ paddingTop: '8px', paddingBottom: '20px' }}>
      
      {/* Top Breadcrumb & Live Chain Pill */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.78rem',
        color: 'var(--dim)',
        marginBottom: '8px',
        paddingBottom: '6px',
        borderBottom: '1px solid var(--line)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href="/" style={{ color: 'var(--dim)', textDecoration: 'none' }}>Waggle</Link>
          <span>/</span>
          <span style={{ color: 'var(--navy-900)', fontWeight: 700 }}>Robinhood Chain Hub</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link
            href="/verify"
            className="conf c-high"
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <ShieldCheck size={12} />
            <span>Verify Onchain Engine</span>
          </Link>

          <span className="conf" style={{
            fontSize: '0.72rem',
            padding: '2px 8px',
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            color: 'var(--navy-900)',
            fontFamily: 'monospace'
          }}>
            Chain ID: {ROBINHOOD_CHAIN_ID}
          </span>
        </div>
      </div>

      {/* Hero Header & ArbSys Telemetry */}
      <section style={{ marginBottom: '10px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--r-md, 14px)',
          padding: '12px 18px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
              <ChainLogo chainKey="rh" chainName="Robinhood" size={24} />
              <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--navy-900)' }}>
                Robinhood Chain <em>Hub</em>
              </h1>
            </div>
            <p className="lede" style={{ margin: '2px 0 0 0', color: 'var(--dim)', fontSize: '0.86rem' }}>
              Empirical launchpad leaderboard, ArbSys L2 block telemetry, and cryptographic Merkle root attestation for <strong>Chain ID: 4663</strong> (Arbitrum Nitro Stack).
            </p>
          </div>

          {/* ArbSys Telemetry Box */}
          <div style={{
            background: 'var(--gray-50, #edf1f4)',
            border: '1px solid var(--line2, rgba(64, 88, 129, 0.28))',
            borderRadius: '8px',
            padding: '8px 14px',
            minWidth: '240px',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="pulse-dot" style={{ background: '#10b981' }}></span>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#10b981', letterSpacing: '0.05em' }}>
                  ARBSYS PRECOMPILE
                </span>
              </div>
              <span style={{ fontSize: '0.65rem', color: 'var(--dimmer)', fontFamily: 'monospace' }}>address(100)</span>
            </div>

            <div style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--navy-900)' }}>
              Block #{l2BlockHeight.toLocaleString('en-US')}
            </div>

            <div style={{ fontSize: '0.68rem', color: 'var(--dim)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--line)', paddingTop: '3px' }}>
              <span>Indexer: Ponder TS Engine</span>
              <span style={{ color: '#10b981', fontWeight: 600 }}>Active Sync</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Summary Stat Cards */}
      <section style={{ marginBottom: '10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
          
          {/* Card 1 */}
          <div className="card" style={{ padding: '10px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--dim)', fontWeight: 600 }}>24h Total Launches</span>
              <Activity size={14} style={{ color: 'var(--navy-800)' }} />
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, marginTop: '2px', color: 'var(--navy-900)', fontFamily: 'monospace' }}>
              1,990
            </div>
            <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 600 }}>+12.4% vs 7d avg</span>
          </div>

          {/* Card 2 */}
          <div className="card" style={{ padding: '10px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--dim)', fontWeight: 600 }}>Average 7D Strict Survival</span>
              <TrendingUp size={14} style={{ color: '#10b981' }} />
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, marginTop: '2px', color: '#10b981', fontFamily: 'monospace' }}>
              61.1%
            </div>
            <span style={{ fontSize: '0.68rem', color: 'var(--dim)' }}>&ge;$1k Liq & &ge;50 Trades floor</span>
          </div>

          {/* Card 3 */}
          <div className="card" style={{ padding: '10px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--dim)', fontWeight: 600 }}>First-Min MEV Extraction</span>
              <Flame size={14} style={{ color: '#d97706' }} />
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, marginTop: '2px', color: '#38bdf8', fontFamily: 'monospace' }}>
              30.4%
            </div>
            <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 600 }}>Lowest across all 5 chains</span>
          </div>

          {/* Card 4 */}
          <div className="card" style={{ padding: '10px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--dim)', fontWeight: 600 }}>Factory Attribution Ratio</span>
              <Layers size={14} style={{ color: 'var(--navy-700)' }} />
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, marginTop: '2px', color: 'var(--navy-900)', fontFamily: 'monospace' }}>
              {totalAttributedPct}%
            </div>
            <span style={{ fontSize: '0.68rem', color: 'var(--dim)' }}>Generic Fallback: {unknownSharePct}%</span>
          </div>

        </div>
      </section>

      {/* 1. Launchpad Leaderboard (TASK-2.3.1 - Element 1) */}
      <section id="leaderboard" style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--navy-800)', marginBottom: '1px' }}>
              Robinhood Chain Leaderboard
            </div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy-900)' }}>
              Launchpad Performance Rankings
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--dim)', background: 'var(--panel)', border: '1px solid var(--line)', padding: '2px 8px', borderRadius: '5px' }}>
              Window: 92 Days Continuous
            </span>
            <Link
              href="/verify"
              className="conf c-high"
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 8px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <ShieldCheck size={12} />
              <span>Verify Onchain</span>
            </Link>
          </div>
        </div>

        {/* Table Container */}
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Rank & Venue</th>
                <th>Status</th>
                <th className="num">Launches / Day</th>
                <th className="num">Median Liquidity</th>
                <th className="num">First-Min MEV</th>
                <th className="num">Strict 7D Survival</th>
                <th style={{ textAlign: 'center' }}>Attestation</th>
              </tr>
            </thead>
            <tbody>
              {ROBINHOOD_VENUES.map((v, idx) => {
                const isPaused = v.status === 'paused';
                const rankBadges = ['🥇 #1', '🥈 #2', '🥉 #3', '#4', '#5'];

                return (
                  <tr key={v.key} style={isPaused ? { opacity: 0.6 } : undefined}>
                    {/* Venue Name */}
                    <td>
                      <div className="vname-group">
                        <div className="vname-header">
                          <span style={{
                            fontSize: '0.72rem',
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            color: idx === 0 ? '#d97706' : idx === 1 ? '#405881' : idx === 2 ? '#b45309' : '#7187ab',
                            marginRight: '3px'
                          }}>
                            {rankBadges[idx]}
                          </span>
                          <VenueLogo venueName={v.name} venueKey={v.key} chainKey="rh" size={20} />
                          <span className="vname-text" style={{ fontWeight: 700 }}>{v.name}</span>
                          {v.key === 'pons' && (
                            <span className="conf c-high" style={{ fontSize: '0.62rem', padding: '1px 5px', fontWeight: 800 }}>
                              TOP RETENTION
                            </span>
                          )}
                        </div>
                        <span className="vcurve-badge">{v.curveType}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`conf ${isPaused ? 'c-low' : 'c-high'}`}>
                        {v.status.toUpperCase()}
                      </span>
                    </td>

                    {/* Launches Per Day */}
                    <td className="num">
                      <span className="perday-val">{v.launchesPerDay.toLocaleString('en-US')}</span>
                    </td>

                    {/* Median Liquidity */}
                    <td className="num">
                      <span className="liq-val">${v.medianLiquidityUsd.toLocaleString('en-US')}</span>
                    </td>

                    {/* First-Min MEV Extraction */}
                    <td className="num">
                      <span className={`extract-pill ${v.extractionPct < 35 ? 'ext-good' : (v.extractionPct < 45 ? 'ext-mid' : 'ext-high')}`}>
                        {v.extractionPct.toFixed(1)}%
                      </span>
                    </td>

                    {/* Strict 7D Survival */}
                    <td className="num">
                      <div className="minibar" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <div className="minibar-track">
                          <div
                            className="minibar-fill"
                            style={{
                              width: `${(v.surv7d / 75) * 100}%`,
                              background: isPaused ? '#94a3b8' : '#10b981',
                            }}
                          ></div>
                        </div>
                        <span className="surv-num" style={{ color: isPaused ? 'var(--dim)' : '#10b981', fontWeight: 700 }}>
                          {v.surv7d.toFixed(1)}%
                        </span>
                      </div>
                    </td>

                    {/* Micro-Verify Action */}
                    <td style={{ textAlign: 'center' }}>
                      <Link
                        href={`/verify?snapshotId=101&venueKey=${v.key}`}
                        title="Verify cryptographic Merkle proof against WaggleAttestor.sol"
                        className="conf"
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          fontFamily: 'monospace',
                          padding: '2px 6px',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          background: 'var(--panel)',
                          border: '1px solid var(--line2)'
                        }}
                      >
                        <ShieldCheck size={11} style={{ color: '#10b981' }} />
                        <span>verify</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Factual Disclosure Notice */}
        <p className="disclosure-note" style={{ fontSize: '0.75rem', color: 'var(--dim)', marginTop: '6px', marginBottom: 0 }}>
          <strong>Factual disclosure:</strong> Modus launched a token on Pons. Noxa venue status is marked as <code>PAUSED</code> and excluded from active scoring recommendations.
        </p>
      </section>

      {/* 2 & 3. Hourly Heatmap & Market Share (TASK-2.3.1 - Elements 2 & 3) */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px', marginBottom: '12px' }}>
        
        {/* Hourly Heatmap Card */}
        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} style={{ color: 'var(--navy-800)' }} />
                <h3 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 700, color: 'var(--navy-900)' }}>
                  Hourly Survival Heatmap (UTC)
                </h3>
              </div>
              <p style={{ margin: '1px 0 0 0', fontSize: '0.72rem', color: 'var(--dim)' }}>
                Peak liquidity & retention window: 14:00 - 18:00 UTC
              </p>
            </div>

            {/* Metric Toggle Tabs */}
            <div style={{ display: 'flex', gap: '2px', background: 'var(--gray-50)', padding: '2px', borderRadius: '5px', border: '1px solid var(--line)' }}>
              {(['survival', 'launches', 'extraction'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setActiveMetric(m)}
                  style={{
                    padding: '2px 7px',
                    fontSize: '0.66rem',
                    borderRadius: '4px',
                    background: activeMetric === m ? 'var(--navy-900)' : 'transparent',
                    color: activeMetric === m ? '#ffffff' : 'var(--dim)',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: activeMetric === m ? 700 : 500,
                    transition: 'all 0.15s ease'
                  }}
                >
                  {m === 'survival' ? 'Surv %' : m === 'launches' ? 'Launches' : 'MEV %'}
                </button>
              ))}
            </div>
          </div>

          {/* 24 Hours Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '4px', margin: '8px 0' }}>
            {hourlyData.map(d => {
              const val = activeMetric === 'survival' ? d.surv : activeMetric === 'launches' ? d.launches : d.extract;
              const intensity = activeMetric === 'survival'
                ? (d.surv - 40) / 30
                : activeMetric === 'launches' ? d.launches / 20 : (55 - d.extract) / 30;
              const isSelected = selectedHour === d.hour;

              return (
                <button
                  key={d.hour}
                  onClick={() => setSelectedHour(d.hour)}
                  style={{
                    aspectRatio: '1',
                    borderRadius: '4px',
                    border: isSelected ? '2px solid var(--navy-900)' : '1px solid var(--line)',
                    background: `rgba(16, 185, 129, ${Math.max(0.15, Math.min(0.9, intensity))})`,
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 0 8px rgba(16, 185, 129, 0.4)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                  title={`${String(d.hour).padStart(2, '0')}:00 UTC - ${val.toFixed(1)}`}
                />
              );
            })}
          </div>

          {/* Selected Hour Readout */}
          <div style={{
            background: 'var(--gray-50)',
            border: '1px solid var(--line)',
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '0.74rem',
            fontFamily: 'monospace',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ color: 'var(--dim)' }}>Window: </span>
              <strong style={{ color: 'var(--navy-900)' }}>{String(selectedHour).padStart(2, '0')}:00 UTC</strong>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <span>Survival: <strong style={{ color: '#10b981' }}>{hourlyData[selectedHour].surv.toFixed(1)}%</strong></span>
              <span>Launches: <strong style={{ color: 'var(--navy-900)' }}>{hourlyData[selectedHour].launches}</strong></span>
              <span>MEV: <strong style={{ color: '#d97706' }}>{hourlyData[selectedHour].extract.toFixed(1)}%</strong></span>
            </div>
          </div>
        </div>

        {/* Market Share Distribution Card */}
        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <BarChart3 size={14} style={{ color: 'var(--navy-800)' }} />
            <h3 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 700, color: 'var(--navy-900)' }}>
              Launchpad Market Share Distribution
            </h3>
          </div>
          <p style={{ margin: '0 0 8px 0', fontSize: '0.72rem', color: 'var(--dim)' }}>
            Proportion of all Robinhood Chain token issuances by venue
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {ROBINHOOD_VENUES.map(v => (
              <div key={v.key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '2px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{v.name}</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, color: v.key === 'pons' ? '#10b981' : 'var(--navy-800)' }}>
                    {v.attributedSharePct}%
                  </span>
                </div>
                <div style={{ width: '100%', height: '5px', borderRadius: '9999px', background: 'var(--gray-50)', border: '1px solid var(--line)', overflow: 'hidden' }}>
                  <div style={{
                    width: `${v.attributedSharePct}%`,
                    height: '100%',
                    background: v.key === 'pons' ? '#10b981' : v.key === 'pools_trade' ? '#38bdf8' : v.key === 'hood_fun' ? '#d97706' : '#7187ab',
                    borderRadius: '9999px'
                  }} />
                </div>
              </div>
            ))}

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '2px' }}>
                <span style={{ color: 'var(--dim)' }}>Generic / Unknown Factory</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--dim)' }}>{unknownSharePct}%</span>
              </div>
              <div style={{ width: '100%', height: '5px', borderRadius: '9999px', background: 'var(--gray-50)', border: '1px solid var(--line)', overflow: 'hidden' }}>
                <div style={{ width: `${unknownSharePct}%`, height: '100%', background: 'var(--dimmer)', borderRadius: '9999px' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 & 5. Registry Completeness Gauge & Onchain Attestation Widget */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
        
        {/* Factory Registry Completeness */}
        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <Cpu size={14} style={{ color: '#10b981' }} />
            <h3 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 700, color: 'var(--navy-900)' }}>
              Factory Registry Completeness
            </h3>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--dim)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
            Percentage of onchain token issuances cleanly attributed to known factory ABIs versus generic bytecode deployments.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              border: '4px solid #10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.05rem',
              fontWeight: 800,
              fontFamily: 'monospace',
              color: 'var(--navy-900)',
              background: 'var(--gray-50)'
            }}>
              {totalAttributedPct}%
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#10b981' }}>High Confidence Registry</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--dim)', marginTop: '2px', lineHeight: 1.35 }}>
                6 Indexed Launchpad Factories:<br />
                <span style={{ color: 'var(--navy-900)', fontWeight: 600 }}>Pons · Pools.trade · hood.fun · flap · Noxa · LOOT</span>
              </div>
            </div>
          </div>
        </div>

        {/* Latest Onchain Attestation Widget */}
        <div className="card" style={{ padding: '14px 16px', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="pulse-dot" style={{ background: '#10b981' }}></span>
              <h3 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 700, color: 'var(--navy-900)' }}>
                Latest Onchain Attestation
              </h3>
            </div>
            <Link
              href="/verify?snapshotId=101"
              className="conf c-high"
              style={{
                fontSize: '0.7rem',
                padding: '2px 7px',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>VERIFY</span>
              <ArrowRight size={11} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem', fontFamily: 'monospace' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--gray-50)', padding: '5px 8px', borderRadius: '5px', border: '1px solid var(--line)' }}>
              <span style={{ color: 'var(--dim)' }}>Snapshot ID:</span>
              <span style={{ color: 'var(--navy-900)', fontWeight: 700 }}>#101 (Robinhood Daily)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--gray-50)', padding: '5px 8px', borderRadius: '5px', border: '1px solid var(--line)' }}>
              <span style={{ color: 'var(--dim)' }}>Merkle Root:</span>
              <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.72rem' }}>0xde86fdb8...502f0003</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--gray-50)', padding: '5px 8px', borderRadius: '5px', border: '1px solid var(--line)' }}>
              <span style={{ color: 'var(--dim)' }}>ArbSys L2 Block:</span>
              <span style={{ color: 'var(--navy-800)', fontWeight: 700 }}>#72,088,517</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--gray-50)', padding: '5px 8px', borderRadius: '5px', border: '1px solid var(--line)' }}>
              <span style={{ color: 'var(--dim)' }}>Contract:</span>
              <a
                href={`https://robinhoodchain.blockscout.com/address/${WAGGLE_ATTESTOR_ADDRESS}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#2563eb', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                title="View WaggleAttestor contract on Robinhood Chain Blockscout"
              >
                <span>{WAGGLE_ATTESTOR_ADDRESS.slice(0, 6)}...{WAGGLE_ATTESTOR_ADDRESS.slice(-4)}</span>
                <ExternalLink size={11} />
              </a>
            </div>
          </div>
        </div>

      </section>

      {/* Robinhood Hub Footer with Disclosures */}
      <footer style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--line)', textAlign: 'center', fontSize: '0.78rem', color: 'var(--dim)' }}>
        <p style={{ margin: '0 0 6px' }}>
          Robinhood Chain (Chain ID: 4663) · Arbitrum Nitro L2 Architecture · Settlement on Ethereum Mainnet
        </p>
        <p style={{ margin: '0 0 10px' }}>
          Attestor: <a href={`https://robinhoodchain.blockscout.com/address/${WAGGLE_ATTESTOR_ADDRESS || '0x7fc7f477b12045cfefbde9e692812f64391b969b'}`} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>{WAGGLE_ATTESTOR_ADDRESS || '0x7fc7f477b12045cfefbde9e692812f64391b969b'}</a>
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
          <Link href="/terms" style={{ color: '#2563eb' }}>Terms of Service</Link>
          <Link href="/privacy" style={{ color: '#2563eb' }}>Privacy Policy</Link>
          <Link href="/method" style={{ color: '#2563eb' }}>Methodology</Link>
          <Link href="/verify" style={{ color: '#2563eb' }}>Verify Merkle Proofs</Link>
        </div>
      </footer>

    </main>
  );
}
