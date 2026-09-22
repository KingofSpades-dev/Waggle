'use client';

import React, { useState, useEffect } from 'react';

// Custom Hexagon (Segi-6) SVG Icon Badges
const HexIcon: React.FC<{ type: 'search' | 'matrix' | 'ai' | 'sparkle'; color: string }> = ({ type, color }) => {
  return (
    <div style={{
      width: '32px',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      flexShrink: 0
    }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Outer Segi-6 Hexagon Border */}
        <polygon
          points="12,2 21,7.2 21,16.8 12,22 3,16.8 3,7.2"
          fill={`${color}18`}
          stroke={color}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />

        {type === 'search' && (
          <>
            <circle cx="10.5" cy="10.5" r="3.5" stroke={color} strokeWidth="1.6" />
            <line x1="13.2" y1="13.2" x2="16.5" y2="16.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
          </>
        )}

        {type === 'matrix' && (
          <>
            <rect x="7" y="12" width="2" height="5" rx="1" fill={color} />
            <rect x="11" y="8" width="2" height="9" rx="1" fill={color} />
            <rect x="15" y="10" width="2" height="7" rx="1" fill={color} />
          </>
        )}

        {type === 'ai' && (
          <>
            <rect x="8" y="8" width="8" height="8" rx="2" stroke={color} strokeWidth="1.5" />
            <circle cx="12" cy="12" r="1.8" fill={color} />
            <line x1="12" y1="5" x2="12" y2="8" stroke={color} strokeWidth="1.4" />
            <line x1="12" y1="16" x2="12" y2="19" stroke={color} strokeWidth="1.4" />
            <line x1="5" y1="12" x2="8" y2="12" stroke={color} strokeWidth="1.4" />
            <line x1="16" y1="12" x2="19" y2="12" stroke={color} strokeWidth="1.4" />
          </>
        )}

        {type === 'sparkle' && (
          <>
            <path d="M12 6L13.5 10.5L18 12L13.5 13.5L12 18L10.5 13.5L6 12L10.5 10.5L12 6Z" fill={color} />
          </>
        )}
      </svg>
    </div>
  );
};

const SCOUT_STEPS = [
  { iconType: 'search' as const, color: '#38bdf8', title: 'Analyzing Token Architecture', desc: 'Evaluating category, audience size, and treasury constraints...' },
  { iconType: 'matrix' as const, color: '#10b981', title: 'Querying PostgreSQL Database', desc: 'Processing 25,600+ indexed launches & 7-day survival curves...' },
  { iconType: 'ai' as const, color: '#f59e0b', title: 'Running Deep AI Evaluation', desc: 'Scoring 4 dimensions: Chain Fit, Venue Mechanics, Meta Heat & Hour Window...' },
  { iconType: 'sparkle' as const, color: '#a78bfa', title: 'Synthesizing Bespoke Report', desc: 'Formulating tailored structural match and launchpad recommendations...' }
];

export const ScoutLoadingCard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);

  // Balanced step cycling aligned with Mimo AI generation window (~25s)
  useEffect(() => {
    const stepTimer = setInterval(() => {
      setCurrentStep(prev => (prev < SCOUT_STEPS.length - 1 ? prev + 1 : prev));
    }, 6000); // 6s per step (completes 4 steps seamlessly across ~24s alongside Mimo AI)

    const secTimer = setInterval(() => {
      setElapsedSec(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(stepTimer);
      clearInterval(secTimer);
    };
  }, []);

  const progressPct = Math.min(96, ((currentStep + 1) / SCOUT_STEPS.length) * 100);

  return (
    <div style={{
      marginTop: '20px',
      padding: '24px 26px',
      background: 'linear-gradient(135deg, #070a14 0%, #0f172a 100%)',
      borderRadius: '20px',
      border: '1px solid rgba(56, 189, 248, 0.25)',
      boxShadow: '0 20px 40px -12px rgba(7, 10, 20, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
      color: '#f8fafc',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Animated Hex Glow */}
      <div style={{
        position: 'absolute',
        top: '-40px',
        right: '-40px',
        width: '180px',
        height: '180px',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(56, 189, 248, 0.05) 50%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
        animation: 'pulseGlow 3s ease-in-out infinite'
      }} />

      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Main Animated Hexagon Logo */}
          <div style={{
            width: '40px',
            height: '40px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ animation: 'spinLinear 4s linear infinite' }}>
              <polygon points="12,2 21,7.2 21,16.8 12,22 3,16.8 3,7.2" stroke="#38bdf8" strokeWidth="1.8" strokeDasharray="14 6" fill="rgba(56, 189, 248, 0.1)" />
            </svg>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ position: 'absolute' }}>
              <polygon points="12,4 19,8 19,16 12,20 5,16 5,8" fill="#38bdf8" opacity="0.8" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
              Waggle AI Scouting in Progress...
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
              Evaluating live database metrics & historical survival curves
            </div>
          </div>
        </div>

        {/* Elapsed Timer Pill */}
        <div style={{
          fontSize: '12px',
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          padding: '4px 12px',
          borderRadius: '9999px',
          background: 'rgba(56, 189, 248, 0.1)',
          color: '#38bdf8',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <polygon points="12,2 21,7.2 21,16.8 12,22 3,16.8 3,7.2" stroke="currentColor" strokeWidth="2" />
          </svg>
          <span>{elapsedSec}s elapsed</span>
        </div>
      </div>

      {/* Shimmering Progress Bar */}
      <div style={{
        width: '100%',
        height: '6px',
        background: 'rgba(255, 255, 255, 0.08)',
        borderRadius: '3px',
        overflow: 'hidden',
        marginBottom: '18px',
        position: 'relative'
      }}>
        <div style={{
          width: `${progressPct}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #38bdf8 0%, #10b981 50%, #7b45d8 100%)',
          borderRadius: '3px',
          transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '0 0 12px rgba(56, 189, 248, 0.6)'
        }} />
      </div>

      {/* Segi-6 Hexagon Step Checklist Items */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
        {SCOUT_STEPS.map((step, idx) => {
          const isDone = idx < currentStep;
          const isCurrent = idx === currentStep;
          return (
            <div
              key={idx}
              style={{
                padding: '12px 14px',
                borderRadius: '14px',
                background: isCurrent ? 'rgba(56, 189, 248, 0.08)' : (isDone ? 'rgba(16, 185, 129, 0.06)' : 'rgba(255, 255, 255, 0.03)'),
                border: isCurrent ? `1px solid ${step.color}60` : (isDone ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(255, 255, 255, 0.06)'),
                transition: 'all 0.25s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              {/* Segi-6 Custom Hexagon Icon */}
              <HexIcon type={step.iconType} color={isDone ? '#10b981' : step.color} />

              <div style={{ flexGrow: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: isCurrent || isDone ? '#ffffff' : '#64748b' }}>
                    {step.title}
                  </span>
                  {isDone ? (
                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#10b981' }}>✓ DONE</span>
                  ) : isCurrent ? (
                    <span style={{ fontSize: '10px', fontWeight: 800, color: step.color, animation: 'pulseText 1.2s infinite' }}>RUNNING</span>
                  ) : (
                    <span style={{ fontSize: '10px', color: '#475569' }}>WAITING</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
