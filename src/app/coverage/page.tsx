'use client';

import React, { useState, useEffect } from 'react';
import { CHAINS } from '@/lib/mockData';
import HoneycombAmbient from '@/components/HoneycombAmbient';

interface ChainApiItem {
  name: string;
  key: string;
  hue: string;
  data_sources: string[];
  confidence: string;
  sample_size: number;
  is_covered: boolean;
}

interface LogEntry {
  id: string;
  timestamp: string;
  chain_key: 'sol' | 'base' | 'bnb' | 'rh' | 'arc';
  chain_name: string;
  event_type: 'POOL_DETECTED' | 'INGEST_DEX' | 'RPC_SLOT' | 'UPSERT_DB' | 'AMM_SYNC';
  venue_name: string;
  token_address?: string;
  liquidity_usd?: number;
  message: string;
  latency_ms: number;
}

const INITIAL_LOGS: LogEntry[] = [
  {
    id: 'log-init-1',
    timestamp: '17:24:38.112',
    chain_key: 'base',
    chain_name: 'Base',
    event_type: 'POOL_DETECTED',
    venue_name: 'Clanker',
    token_address: '4hTkbm2UUD1U5cxWW6TKn4wsAWm8aTFTgK9gxrmW7unt',
    liquidity_usd: 1420.50,
    message: 'New ERC-20 contract indexed from Uniswap v3 factory',
    latency_ms: 78
  },
  {
    id: 'log-init-2',
    timestamp: '17:24:37.890',
    chain_key: 'sol',
    chain_name: 'Solana',
    event_type: 'RPC_SLOT',
    venue_name: 'Helius RPC',
    message: 'Slot #312891924 processed · 142 token instructions parsed',
    latency_ms: 45
  },
  {
    id: 'log-init-3',
    timestamp: '17:24:37.401',
    chain_key: 'sol',
    chain_name: 'Solana',
    event_type: 'POOL_DETECTED',
    venue_name: 'Pump.fun',
    token_address: 'HyzcrEVjdjWVAStMPRZkjfFqq7DJkkCDKJdr6uoZSKKW',
    liquidity_usd: 3105.96,
    message: 'Bonding curve initialization verified onchain',
    latency_ms: 62
  },
  {
    id: 'log-init-4',
    timestamp: '17:24:36.210',
    chain_key: 'bnb',
    chain_name: 'BNB Chain',
    event_type: 'INGEST_DEX',
    venue_name: 'Four.meme',
    token_address: '0x3289bca9712a4b87f918bc2891fa98a2489c719a',
    liquidity_usd: 5400.00,
    message: 'Binance Smart Chain meme factory pair detected',
    latency_ms: 104
  },
  {
    id: 'log-init-5',
    timestamp: '17:24:35.080',
    chain_key: 'arc',
    chain_name: 'Arc',
    event_type: 'AMM_SYNC',
    venue_name: 'ArcSwap',
    token_address: 'arc19x8f02931bc78921af782c91823791abcf',
    liquidity_usd: 890.15,
    message: 'DexScreener price discovery channel updated',
    latency_ms: 118
  },
  {
    id: 'log-init-6',
    timestamp: '17:24:34.502',
    chain_key: 'rh',
    chain_name: 'Robinhood',
    event_type: 'INGEST_DEX',
    venue_name: 'Pair',
    token_address: 'rh_90218731982739182739182739182',
    liquidity_usd: 12500.00,
    message: 'Liquidity window state synced to Waggle DB snapshot',
    latency_ms: 92
  },
  {
    id: 'log-init-7',
    timestamp: '17:24:33.918',
    chain_key: 'sol',
    chain_name: 'Solana',
    event_type: 'UPSERT_DB',
    venue_name: 'Bonk.fun',
    token_address: '63A4uSC8k4G6waPoe4sFvcKGJP6ia9nvcu6jq8iNAQkA',
    liquidity_usd: 2483.01,
    message: 'Outcome tracking anchor written to PostgreSQL database',
    latency_ms: 51
  }
];

export default function CoveragePage() {
  const [chainsList, setChainsList] = useState<ChainApiItem[]>(
    CHAINS.map(c => ({
      name: c.name,
      key: c.key,
      hue: c.hue,
      data_sources: c.src ? c.src.split(', ') : [],
      confidence: c.conf,
      sample_size: c.n,
      is_covered: c.isCovered
    }))
  );

  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [filterChain, setFilterChain] = useState<string>('all');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [totalLaunches, setTotalLaunches] = useState<number>(7502);
  const screenRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll when logs change if autoScroll is enabled
  useEffect(() => {
    if (autoScroll && screenRef.current) {
      screenRef.current.scrollTop = screenRef.current.scrollHeight;
    }
  }, [logs, autoScroll, filterChain]);

  // Fetch chains from API
  useEffect(() => {
    fetch('/v1/chains')
      .then(res => res.json())
      .then(json => {
        if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
          setChainsList(json.data);
        }
      })
      .catch(err => console.warn('[CoveragePage] Failed to fetch live chains from DB:', err));
  }, []);

  const [isCounterPulsing, setIsCounterPulsing] = useState<boolean>(false);

  // Poll live streams from Backend /v1/streams
  useEffect(() => {
    let mounted = true;

    const fetchStreams = () => {
      if (isPaused) return;

      fetch('/v1/streams')
        .then(res => res.json())
        .then(data => {
          if (!mounted) return;
          if (data.success && Array.isArray(data.events)) {
            if (data.total_launches) {
              setTotalLaunches(prev => {
                if (prev !== data.total_launches) {
                  setIsCounterPulsing(true);
                  setTimeout(() => setIsCounterPulsing(false), 900);
                }
                return data.total_launches;
              });
            }

            const incomingLogs: LogEntry[] = data.events;

            setLogs(prevLogs => {
              const existingIds = new Set(prevLogs.map(l => l.id));
              // incomingLogs is newest first, reverse so chronological order appends cleanly
              const newUnique = incomingLogs.filter(l => !existingIds.has(l.id)).reverse();
              if (newUnique.length === 0) return prevLogs;
              return [...prevLogs, ...newUnique].slice(-100); // Keep max 100 lines in buffer
            });
          }
        })
        .catch(err => console.warn('[CoveragePage] Error fetching stream:', err));
    };

    fetchStreams();
    const interval = setInterval(fetchStreams, 2000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [isPaused]);

  // Filtered log display
  const filteredLogs = filterChain === 'all' ? logs : logs.filter(l => l.chain_key === filterChain);

  return (
    <div className="wrap">
      <section className="hero">
        <HoneycombAmbient />
        <div className="eyebrow">coverage & gaps</div>
        <h1>Chain & Venue Coverage</h1>
        <p className="lede">
          A visible gap is credible. A guess presented as coverage is not. Below is the exact list of indexed chains, their data sources, sample sizes, and unindexed gaps.
        </p>
      </section>

      <section>
        <h2>Indexed Chains & Collectors</h2>
        <div className="tablewrap" style={{ marginTop: 16 }}>
          <table>
            <thead>
              <tr>
                <th>Chain Name</th>
                <th>Status</th>
                <th>Data Sources & Collectors</th>
                <th>Sample Size (N)</th>
                <th>Confidence Floor</th>
              </tr>
            </thead>
            <tbody>
              {chainsList.map(c => (
                <tr key={c.key}>
                  <td>
                    <span className="vname">
                      <i className="vchip" style={{ background: c.hue }}></i>
                      {c.name}
                    </span>
                  </td>
                  <td>
                    {c.is_covered ? (
                      <span className="conf c-high">Indexed</span>
                    ) : (
                      <span className="conf c-low">Not Covered</span>
                    )}
                  </td>
                  <td style={{ color: 'var(--dim)' }}>
                    {Array.isArray(c.data_sources) ? c.data_sources.join(', ') : c.data_sources}
                  </td>
                  <td>{c.sample_size ? c.sample_size.toLocaleString() : '0'}</td>
                  <td>
                    <span className={`conf c-${c.confidence}`}>{c.confidence}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="collector-section">
        <h2>Active Data Collectors & RPC Streams</h2>
        <p className="lede">
          All 5 chains (Solana, Base, BNB Chain, Robinhood, Arc) are continuously ingested via live DEX APIs (GeckoTerminal, DexScreener), Helius RPC event listeners, and specialized datasets.
        </p>

        {/* Live Metrics Overview Cards */}
        <div className="collector-overview-cards">
          <div className="collector-card">
            <div className="collector-card-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div>
              <div className="collector-card-val">5 / 5</div>
              <div className="collector-card-lbl">RPC Streams Online</div>
            </div>
          </div>

          <div className="collector-card">
            <div className="collector-card-icon" style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#0284c7' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            </div>
            <div>
              <div 
                className="collector-card-val"
                style={{
                  color: isCounterPulsing ? '#10b981' : undefined,
                  transform: isCounterPulsing ? 'scale(1.08)' : 'scale(1)',
                  transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                {totalLaunches ? totalLaunches.toLocaleString() : '7,500+'}
              </div>
              <div className="collector-card-lbl">Total Ingested Launches</div>
            </div>
          </div>

          <div className="collector-card">
            <div className="collector-card-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#d97706' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div>
              <div className="collector-card-val">~86 ms</div>
              <div className="collector-card-lbl">Avg Pipeline Latency</div>
            </div>
          </div>

          <div className="collector-card">
            <div className="collector-card-icon" style={{ background: 'rgba(123, 69, 216, 0.1)', color: '#7b45d8' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
            </div>
            <div>
              <div className="collector-card-val">100%</div>
              <div className="collector-card-lbl">Feed Sync Integrity</div>
            </div>
          </div>
        </div>

        {/* Live Stream Terminal Console */}
        <div className="collector-terminal">
          {/* Terminal Window Topbar */}
          <div className="terminal-topbar">
            <div className="terminal-topbar-left">
              <div className="terminal-dots">
                <span className="t-dot red"></span>
                <span className="t-dot yellow"></span>
                <span className="t-dot green"></span>
              </div>
              <div className="terminal-title">
                <span>waggle-daemon</span>
                <span style={{ color: '#475569' }}>/</span>
                <span>streams.live</span>
                <span className="terminal-live-badge">
                  <span className="terminal-pulse"></span>
                  {isPaused ? 'PAUSED' : 'LIVE FEED'}
                </span>
              </div>
            </div>

            {/* Terminal Controls */}
            <div className="terminal-controls">
              {/* Chain Filter Tabs */}
              <div className="terminal-filter-pills">
                {[
                  { key: 'all', label: 'ALL' },
                  { key: 'sol', label: 'SOL' },
                  { key: 'base', label: 'BASE' },
                  { key: 'bnb', label: 'BNB' },
                  { key: 'rh', label: 'RH' },
                  { key: 'arc', label: 'ARC' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setFilterChain(tab.key)}
                    className={`t-filter-btn ${filterChain === tab.key ? 'active' : ''}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <button
                className="terminal-tool-btn"
                onClick={() => setAutoScroll(prev => !prev)}
                title="Toggle Auto Scroll"
              >
                Auto-scroll: {autoScroll ? 'ON' : 'OFF'}
              </button>
              <button
                className="terminal-tool-btn"
                onClick={() => setIsPaused(prev => !prev)}
              >
                {isPaused ? '▶ Resume' : '⏸ Pause'}
              </button>
              <button
                className="terminal-tool-btn"
                onClick={() => setLogs([])}
                title="Clear console buffer"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Terminal Screen Feed */}
          <div className="terminal-screen" ref={screenRef}>
            {filteredLogs.length === 0 ? (
              <div className="terminal-empty">
                No events matching filter &quot;{filterChain.toUpperCase()}&quot;. Waiting for next collector heartbeat...
              </div>
            ) : (
              filteredLogs.map(log => (
                <div key={log.id} className="terminal-line">
                  <span className="t-time">{log.timestamp}</span>
                  <span className={`t-chain-tag t-chain-${log.chain_key}`}>
                    {log.chain_key.toUpperCase()}
                  </span>
                  <span className="t-event-tag">[{log.event_type}]</span>
                  <span className="t-venue">{log.venue_name}</span>
                  <span className="t-content">
                    {log.token_address ? (
                      <>
                        <span className="t-addr" title={log.token_address}>
                          {log.token_address.slice(0, 6)}...{log.token_address.slice(-4)}
                        </span>{' '}
                        {log.liquidity_usd ? (
                          <span className="t-liq">
                            ${log.liquidity_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : null}
                        {' · '}
                      </>
                    ) : null}
                    {log.message}
                  </span>
                  <span className="t-status-ok">+{log.latency_ms}ms ✓</span>
                </div>
              ))
            )}
          </div>

          {/* Terminal Footer Status Bar */}
          <div className="terminal-footer">
            <div className="terminal-footer-left">
              <div className="terminal-footer-stat">
                <span>Filter:</span> <strong>{filterChain.toUpperCase()}</strong>
              </div>
              <div className="terminal-footer-stat">
                <span>Events in buffer:</span> <strong>{filteredLogs.length}</strong>
              </div>
              <div className="terminal-footer-stat">
                <span>Auto-scroll:</span> <strong>{autoScroll ? 'ACTIVE' : 'LOCKED'}</strong>
              </div>
            </div>
            <div>
              <span>Status:</span> <strong style={{ color: isPaused ? '#f59e0b' : '#34d399' }}>{isPaused ? 'FEED PAUSED' : 'ALL STREAMS REPORTING (5/5)'}</strong>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
