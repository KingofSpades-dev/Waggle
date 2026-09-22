'use client';

import React, { useState, useMemo } from 'react';
import { ChainLogo } from '@/components/ChainLogo';
import { VenueLogo } from '@/components/VenueLogo';
import { VENUES } from '@/lib/mockData';

interface DataPoint {
  date: string;
  verified: number;
  dead: number;
}

const CHAIN_OPTIONS = [
  { key: 'all', name: 'All Chains' },
  { key: 'sol', name: 'Solana' },
  { key: 'base', name: 'Base' },
  { key: 'bnb', name: 'BNB Chain' },
  { key: 'rh', name: 'Robinhood' },
  { key: 'arc', name: 'Arc' }
];

export const TokenSurvivalChartCard: React.FC = () => {
  const [selectedChain, setSelectedChain] = useState<string>('all');
  const [selectedVenue, setSelectedVenue] = useState<string>('all');
  const [selectedDays, setSelectedDays] = useState<number>(14);
  const [hoveredPoint, setHoveredPoint] = useState<{ point: DataPoint; index: number; x: number; yVer: number; yDead: number } | null>(null);

  // Available venues filtered by selected chain
  const availableVenues = useMemo(() => {
    if (selectedChain === 'all') return VENUES;
    return VENUES.filter(v => v.chain === selectedChain);
  }, [selectedChain]);

  // Generate synthetic timeline data based on selected filters
  const chartData = useMemo(() => {
    const points: DataPoint[] = [];
    const now = new Date();
    
    // Seed multiplier based on filters
    let baseVol = 1000;
    if (selectedChain !== 'all') baseVol *= 0.35;
    if (selectedVenue !== 'all') baseVol *= 0.25;

    for (let i = selectedDays; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Realistic trajectory curve simulation
      const dayFactor = (selectedDays - i) / selectedDays;
      const noise1 = Math.sin(i * 1.5) * 120 + Math.cos(i * 0.8) * 80;
      const noise2 = Math.cos(i * 1.2) * 150 + Math.sin(i * 0.5) * 90;

      const verified = Math.max(120, Math.round(baseVol * (0.35 + dayFactor * 0.45) + noise1));
      const dead = Math.max(250, Math.round(baseVol * (0.85 + dayFactor * 0.65) + noise2));

      points.push({
        date: dateStr,
        verified,
        dead
      });
    }

    return points;
  }, [selectedChain, selectedVenue, selectedDays]);

  // Summary Metrics
  const totalVerified = useMemo(() => chartData.reduce((acc, p) => acc + p.verified, 0), [chartData]);
  const totalDead = useMemo(() => chartData.reduce((acc, p) => acc + p.dead, 0), [chartData]);
  const survivalRatePct = useMemo(() => {
    const tot = totalVerified + totalDead;
    if (tot === 0) return 0;
    return ((totalVerified / tot) * 100).toFixed(1);
  }, [totalVerified, totalDead]);

  // SVG dimensions
  const svgWidth = 620;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 30;

  // Min and max values for scaling
  const maxVal = useMemo(() => {
    const max = Math.max(...chartData.map(d => Math.max(d.verified, d.dead)));
    return Math.ceil(max / 100) * 100 || 500;
  }, [chartData]);

  // Generate SVG path for Verified and Dead lines
  const pointsCoords = useMemo(() => {
    const numPoints = chartData.length;
    const stepX = (svgWidth - paddingX * 2) / (numPoints - 1);

    return chartData.map((d, i) => {
      const x = paddingX + i * stepX;
      const yVer = svgHeight - paddingY - (d.verified / maxVal) * (svgHeight - paddingY * 2);
      const yDead = svgHeight - paddingY - (d.dead / maxVal) * (svgHeight - paddingY * 2);
      return { x, yVer, yDead, point: d, index: i };
    });
  }, [chartData, maxVal, svgWidth, svgHeight, paddingX, paddingY]);

  const pathVer = useMemo(() => {
    if (pointsCoords.length === 0) return '';
    return pointsCoords.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yVer.toFixed(1)}`, '');
  }, [pointsCoords]);

  const pathDead = useMemo(() => {
    if (pointsCoords.length === 0) return '';
    return pointsCoords.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yDead.toFixed(1)}`, '');
  }, [pointsCoords]);

  const areaVer = useMemo(() => {
    if (pointsCoords.length === 0) return '';
    const first = pointsCoords[0];
    const last = pointsCoords[pointsCoords.length - 1];
    return `${pathVer} L ${last.x.toFixed(1)} ${svgHeight - paddingY} L ${first.x.toFixed(1)} ${svgHeight - paddingY} Z`;
  }, [pathVer, pointsCoords, svgHeight, paddingY]);

  return (
    <div style={{ margin: '32px 0' }}>
      {/* Outer Grid Container matching user screenshot layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }} className="analytics-grid-wrap">
        
        {/* Left Card: Main Chart & Filters */}
        <div style={{
          background: 'var(--white)',
          border: '1px solid rgba(39, 56, 105, 0.12)',
          borderRadius: 20,
          padding: '24px',
          boxShadow: '0 12px 36px -8px rgba(39, 56, 105, 0.07)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          {/* Card Topbar: Header & Filter Controls */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#10b981' }}>
                  Live Data Ingestion & Token Survival Tracking
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy-900)', margin: '2px 0 0' }}>
                  Token Ingestion Analytics
                </h3>
              </div>

              {/* Timeframe Range Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f8fafc', padding: 4, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                {[7, 14, 30].map(days => (
                  <button
                    key={days}
                    onClick={() => setSelectedDays(days)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      background: selectedDays === days ? 'var(--white)' : 'transparent',
                      color: selectedDays === days ? 'var(--navy-900)' : '#64748b',
                      boxShadow: selectedDays === days ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {days} Days
                  </button>
                ))}
              </div>
            </div>

            {/* Chain & Launchpad Filter Pills Row */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
              {/* Chain Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#475569' }}>
                <span>Chain:</span>
                <select
                  value={selectedChain}
                  onChange={e => {
                    setSelectedChain(e.target.value);
                    setSelectedVenue('all');
                  }}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--navy-900)',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  {CHAIN_OPTIONS.map(c => (
                    <option key={c.key} value={c.key}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Venue / Launchpad Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#475569' }}>
                <span>Launchpad:</span>
                <select
                  value={selectedVenue}
                  onChange={e => setSelectedVenue(e.target.value)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--navy-900)',
                    cursor: 'pointer',
                    outline: 'none',
                    maxWidth: 180
                  }}
                >
                  <option value="all">All Venues & Protocols</option>
                  {availableVenues.map(v => (
                    <option key={v.name} value={v.name}>{v.name}</option>
                  ))}
                </select>
              </div>

              {/* Active Selection Badge */}
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                {selectedChain !== 'all' && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 6, background: '#f1f5f9', fontSize: 11, fontWeight: 700, color: 'var(--navy-900)' }}>
                    <ChainLogo chainKey={selectedChain} size={14} />
                    {selectedChain.toUpperCase()}
                  </span>
                )}
                {selectedVenue !== 'all' && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 6, background: '#f1f5f9', fontSize: 11, fontWeight: 700, color: 'var(--navy-900)' }}>
                    <VenueLogo venueName={selectedVenue} size={14} />
                    {selectedVenue}
                  </span>
                )}
              </div>
            </div>

            {/* Chart Legend & Live Total Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
              <div>
                <span style={{ fontSize: 24, fontWeight: 900, color: 'var(--navy-900)', fontVariantNumeric: 'tabular-nums' }}>
                  {totalVerified.toLocaleString()}
                </span>
                <span style={{ fontSize: 13, color: '#64748b', marginLeft: 8, fontWeight: 600 }}>
                  Verified Active Tokens
                </span>
              </div>

              {/* Chart Legend Items */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, fontWeight: 700 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 14, height: 3, background: '#10b981', borderRadius: 2 }}></span>
                  <span style={{ color: '#10b981' }}>Verified Active</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 14, height: 3, background: '#ef4444', borderRadius: 2, borderStyle: 'dashed' }}></span>
                  <span style={{ color: '#ef4444' }}>Dead / Zero-Volume</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive SVG Chart Canvas */}
          <div style={{ position: 'relative', marginTop: 12 }}>
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              style={{ width: '100%', height: 'auto', overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="gradVer" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
                <pattern id="gridDots" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1" fill="#e2e8f0" />
                </pattern>
              </defs>

              {/* Background Dot Grid Pattern matching user screenshot */}
              <rect width={svgWidth} height={svgHeight} fill="url(#gridDots)" opacity="0.7" />

              {/* Y-Axis Horizontal Reference Lines */}
              {[0, 0.33, 0.66, 1].map((ratio, idx) => {
                const y = svgHeight - paddingY - ratio * (svgHeight - paddingY * 2);
                const val = Math.round(ratio * maxVal);
                return (
                  <g key={idx}>
                    <line x1={paddingX} y1={y} x2={svgWidth - paddingX} y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                    <text x={paddingX - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8" fontFamily="sans-serif">
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* X-Axis Dates */}
              {pointsCoords.map((pt, idx) => {
                // Show subset of labels to prevent crowding
                const step = Math.ceil(pointsCoords.length / 5);
                if (idx % step !== 0 && idx !== pointsCoords.length - 1) return null;
                return (
                  <text key={idx} x={pt.x} y={svgHeight - 8} textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="sans-serif">
                    {pt.point.date}
                  </text>
                );
              })}

              {/* Verified Tokens Area Gradient Fill */}
              <path d={areaVer} fill="url(#gradVer)" />

              {/* Dead / Zero-Volume Tokens Dashed Line */}
              <path
                d={pathDead}
                fill="none"
                stroke="#ef4444"
                strokeWidth="2.2"
                strokeDasharray="5 4"
              />

              {/* Verified Active Tokens Solid Line */}
              <path
                d={pathVer}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Hover Circles & Interactivity */}
              {pointsCoords.map((pt, idx) => (
                <g key={idx} style={{ cursor: 'pointer' }} onMouseEnter={() => setHoveredPoint(pt)} onMouseLeave={() => setHoveredPoint(null)}>
                  {/* Hover Target Column */}
                  <rect x={pt.x - 12} y="0" width="24" height={svgHeight} fill="transparent" />

                  {/* Circle Points */}
                  <circle cx={pt.x} cy={pt.yVer} r={hoveredPoint?.index === idx ? '5' : '3.5'} fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                  <circle cx={pt.x} cy={pt.yDead} r={hoveredPoint?.index === idx ? '5' : '3.5'} fill="#ef4444" stroke="#ffffff" strokeWidth="2" />

                  {/* Vertical Hover Line */}
                  {hoveredPoint?.index === idx && (
                    <line x1={pt.x} y1={paddingY} x2={pt.x} y2={svgHeight - paddingY} stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" />
                  )}
                </g>
              ))}
            </svg>

            {/* Interactive Tooltip Card */}
            {hoveredPoint && (
              <div style={{
                position: 'absolute',
                top: Math.min(hoveredPoint.yVer, hoveredPoint.yDead) - 60,
                left: Math.min(Math.max(hoveredPoint.x - 70, 10), svgWidth - 160),
                background: 'var(--navy-900)',
                color: '#ffffff',
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: 11,
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                pointerEvents: 'none',
                zIndex: 10
              }}>
                <div style={{ fontWeight: 800, marginBottom: 4, color: '#94a3b8' }}>{hoveredPoint.point.date}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#34d399' }}>
                  <span>✓ Verified Active:</span>
                  <strong>{hoveredPoint.point.verified.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f87171' }}>
                  <span>✕ Dead / No-Volume:</span>
                  <strong>{hoveredPoint.point.dead.toLocaleString()}</strong>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Dynamic Filtered Scope Breakdown */}
        <div style={{
          background: 'var(--white)',
          border: '1px solid rgba(39, 56, 105, 0.12)',
          borderRadius: 20,
          padding: '24px',
          boxShadow: '0 12px 36px -8px rgba(39, 56, 105, 0.07)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0284c7' }}>
                FILTERED SCOPE SUMMARY
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--navy-900)', background: '#f1f5f9', padding: '2px 9px', borderRadius: 9999, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                {selectedChain !== 'all' && <ChainLogo chainKey={selectedChain} size={13} />}
                {selectedChain === 'all' ? 'All Chains' : selectedChain.toUpperCase()}
              </span>
            </div>

            {/* Total Filtered Volume Counter */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--navy-900)', fontVariantNumeric: 'tabular-nums' }}>
                {totalVerified + totalDead > 0 ? (totalVerified + totalDead).toLocaleString() : '0'}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginTop: 2 }}>
                Total Tokens Ingested ({selectedDays}-Day Window)
              </div>
            </div>

            {/* Dynamic Filtered Metrics List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Item 1: Verified Active Tokens */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700, color: 'var(--navy-900)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></span>
                    Verified Active Tokens
                  </span>
                  <span style={{ color: '#10b981' }}>{survivalRatePct}%</span>
                </div>
                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Active Count: <strong>{totalVerified.toLocaleString()}</strong></span>
                  <span>in {selectedDays}d scope</span>
                </div>
                {/* Progress bar */}
                <div style={{ width: '100%', height: 5, background: '#e2e8f0', borderRadius: 3, marginTop: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, Math.max(0, Number(survivalRatePct) || 0))}%`, height: '100%', background: '#10b981', borderRadius: 3, transition: 'width 0.4s ease' }}></div>
                </div>
              </div>

              {/* Item 2: Dead / Zero-Volume Tokens */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700, color: 'var(--navy-900)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }}></span>
                    Dead / Zero-Volume Tokens
                  </span>
                  <span style={{ color: '#ef4444' }}>{(100 - (Number(survivalRatePct) || 0)).toFixed(1)}%</span>
                </div>
                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Dead Count: <strong>{totalDead.toLocaleString()}</strong></span>
                  <span>0 transaction</span>
                </div>
                {/* Progress bar */}
                <div style={{ width: '100%', height: 5, background: '#e2e8f0', borderRadius: 3, marginTop: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, Math.max(0, 100 - (Number(survivalRatePct) || 0)))}%`, height: '100%', background: '#ef4444', borderRadius: 3, transition: 'width 0.4s ease' }}></div>
                </div>
              </div>

              {/* Item 3: Daily Ingestion Velocity */}
              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 10, border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: 'var(--navy-900)' }}>
                  <span>Filtered Daily Rate</span>
                  <span style={{ color: '#0284c7' }}>~{Math.round((totalVerified + totalDead) / selectedDays).toLocaleString()} / day</span>
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                  Estimated daily token launches for current filter
                </div>
              </div>
            </div>
          </div>

          {/* Footer Info Pill */}
          <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid #f1f5f9', fontSize: 11.5, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Active Venue:</span>
            <strong style={{ color: 'var(--navy-900)', background: '#f1f5f9', padding: '2px 8px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              {selectedVenue !== 'all' && <VenueLogo venueName={selectedVenue} size={13} />}
              {selectedVenue === 'all' ? 'All Venues' : selectedVenue}
            </strong>
          </div>
        </div>

      </div>
    </div>
  );
};
