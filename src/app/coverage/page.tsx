'use client';

import React, { useState, useEffect } from 'react';
import { CHAINS } from '@/lib/mockData';

interface ChainApiItem {
  name: string;
  key: string;
  hue: string;
  data_sources: string[];
  confidence: string;
  sample_size: number;
  is_covered: boolean;
}

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

      <section>
        <h2>Active Data Collectors & RPC Streams</h2>
        <p className="lede">
          All 5 chains (Solana, Base, BNB Chain, Robinhood, Arc) are continuously ingested via live DEX APIs (GeckoTerminal, DexScreener), Helius RPC event listeners, and specialized datasets.
        </p>
      </section>
    </div>
  );
}
