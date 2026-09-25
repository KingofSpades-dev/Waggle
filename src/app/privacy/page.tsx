import React from 'react';
import Link from 'next/link';
import { Lock, EyeOff, ShieldCheck, Database, KeyRound, Server } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy — Waggle',
  description: 'Confidentiality guarantees, AES-256 encryption, 7-day TTL, and private receipts privacy policy.'
};

export default function PrivacyPage() {
  return (
    <div className="wrap">
      <section className="hero">
        <div className="eyebrow">privacy & cryptographic protection</div>
        <h1>Privacy Policy</h1>
        <p className="lede">
          Waggle was engineered from the ground up to protect unlaunched projects, unpublished code concepts, and pre-launch token strategies.
        </p>
      </section>

      <section style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* Core Guarantee */}
        <div className="card" style={{ padding: 24, borderLeft: '4px solid #059669' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <EyeOff size={22} style={{ color: '#059669' }} />
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#059669' }}>
              The Confidentiality Guarantee: Zero Disclosure of Unlaunched Projects
            </h2>
          </div>
          <p style={{ margin: 0, color: 'var(--navy-900)', fontWeight: 500, lineHeight: 1.6, fontSize: '0.92rem' }}>
            When you submit a project description, whitepaper link, or launch parameter to the Scout engine:
          </p>
          <ul style={{ margin: '12px 0 0', paddingLeft: 20, color: 'var(--dim)', fontSize: '0.88rem', lineHeight: 1.6 }}>
            <li>Your input is <b>never published</b> to public dashboards, analytics feeds, or community leaderboards.</li>
            <li>Your input is <b>never sold, licensed, or shared</b> with any third-party market makers, sniper bots, or venture funds.</li>
            <li>Submissions stay strictly confidential between the client and the quantitative evaluator.</li>
          </ul>
        </div>

        {/* Private Report Receipts */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <KeyRound size={20} style={{ color: '#2563eb' }} />
            <h2 style={{ margin: 0, fontSize: '1.15rem' }}>1. Private Report Receipts & Client Salts</h2>
          </div>
          <p style={{ margin: 0, color: 'var(--dim)', lineHeight: 1.6, fontSize: '0.9rem' }}>
            To enable cryptographic proof of an analysis report without revealing its sensitive content publicly onchain, Waggle issues a <b>Private Report Receipt</b>:
          </p>
          <div style={{ margin: '12px 0', padding: 14, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', fontFamily: 'monospace', fontSize: '0.78rem', color: '#1e293b', overflowX: 'auto' }}>
            SubmissionHash = keccak256(abi.encode(projectText, clientSalt))<br />
            ReportHash = keccak256(abi.encode(submissionHash, keccak256(canonicalize(verdict)), evaluatedSnapshotId))
          </div>
          <p style={{ margin: 0, color: 'var(--dim)', lineHeight: 1.6, fontSize: '0.88rem' }}>
            The 32-byte <code>clientSalt</code> is generated locally and provided to you. Only someone holding both the salt and the exact submission text can prove authorship against the onchain Merkle root. No observer can reverse-engineer your submission from the root.
          </p>
        </div>

        {/* AES-256 Server Cache & TTL */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Server size={20} style={{ color: '#7c3aed' }} />
            <h2 style={{ margin: 0, fontSize: '1.15rem' }}>2. Encrypted Cache & Automatic 7-Day TTL Expiration</h2>
          </div>
          <p style={{ margin: 0, color: 'var(--dim)', lineHeight: 1.6, fontSize: '0.9rem' }}>
            For x402 idempotency recovery and client redelivery:
          </p>
          <ul style={{ margin: '12px 0 0', paddingLeft: 20, color: 'var(--dim)', fontSize: '0.88rem', lineHeight: 1.6 }}>
            <li>Report payloads are encrypted using <b>AES-256-GCM</b> before storage in the idempotency cache.</li>
            <li>All cached records carry a strict <b>7-day Time-To-Live (TTL)</b>. Upon expiration, records are automatically purged from volatile storage.</li>
            <li>Plaintext unlaunched project text is never retained in permanent relational tables.</li>
          </ul>
        </div>

        {/* Onchain Transparency */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Database size={20} style={{ color: '#0284c7' }} />
            <h2 style={{ margin: 0, fontSize: '1.15rem' }}>3. What Is Stored Publicly Onchain</h2>
          </div>
          <p style={{ margin: 0, color: 'var(--dim)', lineHeight: 1.6, fontSize: '0.9rem' }}>
            The only data committed to Robinhood Chain (ID: 4663) via <code>WaggleAttestor</code> is:
          </p>
          <ul style={{ margin: '12px 0 0', paddingLeft: 20, color: 'var(--dim)', fontSize: '0.88rem', lineHeight: 1.6 }}>
            <li>Hourly aggregate snapshot Merkle Roots (32-byte hash).</li>
            <li>L2 Block checkpoint numbers.</li>
            <li>EIP-3009 transfer authorization settlement transaction hashes.</li>
          </ul>
          <p style={{ marginTop: 10, color: 'var(--dim)', fontSize: '0.88rem' }}>
            Zero personally identifiable information (PII), zero wallet IPs, and zero unhashed project text are ever written to the blockchain.
          </p>
        </div>
      </section>

      <footer style={{ marginTop: 60, textAlign: 'center', fontSize: '0.8rem', color: 'var(--dim)' }}>
        <p>Last updated: September 2026 · Waggle Protocol v2</p>
        <p>
          <Link href="/terms" style={{ color: '#2563eb', marginRight: 14 }}>Terms of Service</Link>
          <Link href="/method" style={{ color: '#2563eb', marginRight: 14 }}>Methodology</Link>
          <Link href="/verify" style={{ color: '#2563eb' }}>Verify Onchain</Link>
        </p>
      </footer>
    </div>
  );
}
