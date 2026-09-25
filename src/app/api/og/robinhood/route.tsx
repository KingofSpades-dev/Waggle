import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: '#0a0d14',
            padding: '60px 80px',
            fontFamily: 'sans-serif',
            backgroundImage: 'radial-gradient(circle at 25px 25px, #1a2233 2%, transparent 0%)',
            backgroundSize: '50px 50px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: '#00C805',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  fontWeight: 900,
                  color: '#000',
                }}
              >
                W
              </div>
              <span style={{ fontSize: '32px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                Waggle
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 20px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(0, 200, 5, 0.15)',
                border: '1px solid rgba(0, 200, 5, 0.3)',
              }}
            >
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#00C805' }} />
              <span style={{ color: '#00C805', fontSize: '18px', fontWeight: 700 }}>
                ROBINHOOD CHAIN · ID: 4663
              </span>
            </div>
          </div>

          {/* Main Title & Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '56px', fontWeight: 900, color: '#ffffff', lineHeight: 1.1 }}>
              Robinhood Launchpad Leaderboard
            </div>
            <div style={{ fontSize: '24px', color: '#94a3b8' }}>
              Empirical 7-Day Survival Rates · ArbSys L2 Telemetry · Zero Sponsor Bias
            </div>
          </div>

          {/* Top 3 Venues Showcase */}
          <div style={{ display: 'flex', gap: '24px' }}>
            {/* Rank 1: Pons */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(0, 200, 5, 0.4)',
                borderRadius: '16px',
                padding: '24px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff' }}>1. Pons</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#000', backgroundColor: '#00C805', padding: '4px 10px', borderRadius: '6px' }}>
                  #1 RETENTION
                </span>
              </div>
              <div style={{ fontSize: '42px', fontWeight: 900, color: '#00C805', marginTop: '12px' }}>
                67.0%
              </div>
              <div style={{ fontSize: '15px', color: '#94a3b8' }}>7D Survival · $15.6k Liq</div>
            </div>

            {/* Rank 2: Pools.trade */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '24px',
              }}
            >
              <span style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff' }}>2. Pools.trade</span>
              <div style={{ fontSize: '42px', fontWeight: 900, color: '#38bdf8', marginTop: '12px' }}>
                63.0%
              </div>
              <div style={{ fontSize: '15px', color: '#94a3b8' }}>7D Survival · $14.8k Liq</div>
            </div>

            {/* Rank 3: hood.fun */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '24px',
              }}
            >
              <span style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff' }}>3. hood.fun</span>
              <div style={{ fontSize: '42px', fontWeight: 900, color: '#f59e0b', marginTop: '12px' }}>
                49.0%
              </div>
              <div style={{ fontSize: '15px', color: '#94a3b8' }}>7D Survival · 850/day</div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '20px' }}>
            <span style={{ fontSize: '16px', color: '#64748b' }}>
              waggle.io/robinhood · Live Ponder Indexer
            </span>
            <span style={{ fontSize: '16px', color: '#64748b' }}>
              Modus Research Lab
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    return new Response(`Failed to generate image: ${e.message}`, { status: 500 });
  }
}
