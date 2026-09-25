'use client';

import React, { useState } from 'react';

const N_OPTS = [3, 5, 7, 9, 15, 25, 51];
const P_OPTS = [0.45, 0.55, 0.6, 0.7, 0.8];
const CURVE = [1, 3, 5, 9, 15, 25, 51];

// Binomial probability that a majority of n independent scouts with accuracy p is correct
function majorityProbability(n: number, p: number): number {
  const m = Math.floor(n / 2) + 1;
  let total = 0;
  let c = 1;
  for (let k = 0; k <= n; k++) {
    if (k > 0) {
      c = (c * (n - k + 1)) / k;
    }
    if (k >= m) {
      total += c * Math.pow(p, k) * Math.pow(1 - p, n - k);
    }
  }
  return total;
}

function formatPct(x: number): string {
  const v = x * 100;
  if (v > 99.9 && v < 100) return '>99.9%';
  if (v > 0 && v < 0.1) return '<0.1%';
  return v.toFixed(1) + '%';
}

export default function CondorcetCalculator() {
  const [n, setN] = useState<number>(9);
  const [p, setP] = useState<number>(0.6);

  const majProb = majorityProbability(n, p);
  const mNeeded = Math.floor(n / 2) + 1;
  const deltaPts = ((majProb - p) * 100).toFixed(1);

  return (
    <div className="condorcet-calc-wrapper">
      <div className="condorcet-calc-grid">
        {/* Left Side: Controls */}
        <div className="condorcet-controls">
          <div className="condorcet-group">
            <label className="condorcet-label">
              Number of independent scouts, <i>n</i>
            </label>
            <div className="condorcet-pills">
              {N_OPTS.map((val) => (
                <button
                  key={val}
                  type="button"
                  className={`condorcet-pill ${n === val ? 'active' : ''}`}
                  onClick={() => setN(val)}
                  aria-pressed={n === val}
                >
                  n = {val}
                </button>
              ))}
            </div>
          </div>

          <div className="condorcet-group">
            <label className="condorcet-label">
              Accuracy of each scout, <i>p</i>
            </label>
            <div className="condorcet-pills">
              {P_OPTS.map((val) => (
                <button
                  key={val}
                  type="button"
                  className={`condorcet-pill ${p === val ? 'active' : ''}`}
                  onClick={() => setP(val)}
                  aria-pressed={p === val}
                >
                  {Math.round(val * 100)}%
                </button>
              ))}
            </div>
          </div>

          <div className="condorcet-need-badge">
            <span>Majority threshold required:</span>
            <b>{mNeeded} of {n} scouts</b>
          </div>
        </div>

        {/* Right Side: Dynamic Results Display */}
        <div className="condorcet-result-card">
          <div className="condorcet-big-stat">
            <div className="condorcet-stat-num">{formatPct(majProb)}</div>
            <div className="condorcet-stat-caption">
              chance that the majority of <b>{n} scouts</b> delivers the correct verdict
            </div>
          </div>

          {/* Progress Comparison Bars */}
          <div className="condorcet-bars">
            <div className="condorcet-bar-row">
              <span className="condorcet-bar-lbl">Single Scout</span>
              <div className="condorcet-bar-track">
                <div
                  className="condorcet-bar-fill fill-single"
                  style={{ width: `${p * 100}%` }}
                ></div>
              </div>
              <span className="condorcet-bar-val">{formatPct(p)}</span>
            </div>

            <div className="condorcet-bar-row">
              <span className="condorcet-bar-lbl">Majority Verdict</span>
              <div className="condorcet-bar-track">
                <div
                  className="condorcet-bar-fill fill-majority"
                  style={{ width: `${majProb * 100}%` }}
                ></div>
              </div>
              <span className="condorcet-bar-val highlight">{formatPct(majProb)}</span>
            </div>
          </div>

          {/* Dynamic Verdict Text */}
          <p className="condorcet-verdict-note">
            {p < 0.5 ? (
              <span className="verdict-warning">
                ⚠️ Each scout is wrong more often than right (p &lt; 50%), so the crowd amplifies error: the majority does worse than a single scout and deteriorates as n grows.
              </span>
            ) : (
              <span>
                With <b>{n} independent scouts</b> at <b>{Math.round(p * 100)}%</b> accuracy each, the majority is right <b>+{deltaPts}%</b> more often than any single scout alone.
              </span>
            )}
          </p>

          {/* Scale Curve Chart across n */}
          <div className="condorcet-curve-section">
            <div className="condorcet-curve-title">
              Majority Accuracy Scaling across n (at p = {Math.round(p * 100)}%)
            </div>
            <div className="condorcet-curve-cols">
              {CURVE.map((colN) => {
                const colProb = majorityProbability(colN, p);
                const isCurrent = colN === n;
                const barHeight = Math.max(6, Math.round(colProb * 64));
                return (
                  <div
                    key={colN}
                    className={`condorcet-col ${isCurrent ? 'active' : ''}`}
                    onClick={() => setN(colN)}
                    title={`n=${colN}: ${formatPct(colProb)}`}
                  >
                    <span className="col-pct">{Math.round(colProb * 100)}%</span>
                    <div className="col-bar-wrap">
                      <div
                        className={`col-bar ${isCurrent ? 'bar-active' : ''}`}
                        style={{ height: `${barHeight}px` }}
                      ></div>
                    </div>
                    <span className="col-n">n={colN}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
