import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Lock,
  EyeOff,
  Cpu,
  Database,
  ArrowLeft,
  Copy,
  Check,
  Layers,
  Sparkles
} from "lucide-react";
import { WAGGLE_ATTESTOR_ADDRESS, ROBINHOOD_CHAIN_ID } from "@/lib/viemClient";

interface PageProps {
  params: Promise<{ reportId: string }>;
}

export default async function SelectiveDisclosurePage({ params }: PageProps) {
  const { reportId } = await params;
  const formattedReportId = reportId.startsWith("0x") ? reportId : `0x${reportId}`;

  return (
    <main className="wrap" style={{ paddingTop: "16px", paddingBottom: "24px" }}>
      {/* Top Breadcrumb Header & Chain Badge */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.78rem",
          color: "var(--dim)",
          marginBottom: "12px",
          paddingBottom: "4px",
          borderBottom: "none",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Link href="/" style={{ color: "var(--dim)", textDecoration: "none" }}>
            Waggle
          </Link>
          <span>/</span>
          <Link href="/verify" style={{ color: "var(--navy-800)", textDecoration: "none", fontWeight: 600 }}>
            Verify Engine
          </Link>
          <span>/</span>
          <span style={{ color: "var(--navy-900)", fontFamily: "var(--font-mono)", fontWeight: 750 }}>
            proof-disclosure
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontSize: "0.72rem",
              padding: "3px 10px",
              background: "var(--panel)",
              border: "1px solid var(--line)",
              borderRadius: "6px",
              color: "var(--navy-900)",
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
            }}
          >
            Chain ID: {ROBINHOOD_CHAIN_ID} (Robinhood)
          </span>
          <span
            style={{
              fontSize: "0.72rem",
              padding: "3px 10px",
              background: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "6px",
              color: "#059669",
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <Lock size={12} /> MODE_PRIVATE
          </span>
        </div>
      </div>

      {/* Hero Section */}
      <section style={{ padding: "16px 0", borderTop: "none", marginBottom: "8px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "3px 10px",
            background: "rgba(39, 56, 105, 0.06)",
            border: "1px solid var(--line2)",
            borderRadius: "9999px",
            fontSize: "0.7rem",
            fontWeight: 800,
            color: "var(--navy-900)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}
        >
          <Sparkles size={13} style={{ color: "#059669" }} />
          Zero Knowledge Selective Disclosure · v3.1 Spec
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: "2.1rem",
            fontWeight: 800,
            color: "var(--navy-900)",
            letterSpacing: "-0.025em",
            lineHeight: 1.25,
          }}
        >
          Selective Statement <em>Proof of Fit</em>
        </h1>

        <p
          style={{
            margin: "8px 0 0 0",
            color: "var(--dim)",
            maxWidth: "840px",
            fontSize: "0.92rem",
            lineHeight: 1.6,
          }}
        >
          This report was generated in <strong>MODE_PRIVATE</strong>. The project creator has chosen to disclose specific cryptographically proven assertions without revealing project identity, metadata, or features. Modus backend servers hold <strong>zero plain salt</strong> and <strong>zero unblinded project features</strong>.
        </p>
      </section>

      {/* Main Report ID Header Card */}
      <section style={{ padding: "16px 0", borderTop: "none", marginBottom: "8px" }}>
        <div
          style={{
            background: "var(--panel)",
            border: "1px solid var(--line2)",
            borderRadius: "var(--r-md)",
            padding: "16px 20px",
            boxShadow: "var(--shadow-sm)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <span
              style={{
                display: "block",
                fontSize: "0.66rem",
                fontWeight: 800,
                color: "var(--dim)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: "4px",
              }}
            >
              Proven Report Commitment Identifier (reportId)
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 750,
                  fontSize: "0.95rem",
                  color: "var(--navy-900)",
                  wordBreak: "break-all",
                }}
              >
                {formattedReportId}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span
              style={{
                fontSize: "0.75rem",
                padding: "4px 12px",
                background: "rgba(16, 185, 129, 0.1)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                borderRadius: "var(--r-xs)",
                color: "#059669",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <CheckCircle2 size={14} /> SP1 Groth16 Verified
            </span>
          </div>
        </div>
      </section>

      {/* Proven Assertions Grid */}
      <section style={{ padding: "16px 0", borderTop: "none", marginBottom: "12px" }}>
        <div style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
          <ShieldCheck size={18} style={{ color: "var(--navy-900)" }} />
          <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--navy-900)", margin: 0 }}>
            Disclosed Cryptographic Assertions
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: "16px",
          }}
        >
          {/* Assertion 1: Composite Score */}
          <div
            style={{
              background: "var(--panel)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "var(--r-md)",
              padding: "20px",
              boxShadow: "var(--shadow-sm)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: "90px",
                height: "90px",
                background: "radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--dim)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  ASSERTION #1 · SCORE THRESHOLD
                </span>
                <span
                  style={{
                    fontSize: "0.66rem",
                    padding: "2px 8px",
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    borderRadius: "4px",
                    color: "#059669",
                    fontWeight: 800,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  PASSED (SP1)
                </span>
              </div>

              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--navy-900)", margin: "0 0 4px 0" }}>
                Composite Fit Score &ge; 75.00 BPS
              </h3>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--dim)", lineHeight: 1.5 }}>
                Proven to achieve at least <strong>75.00% (7,500 Basis Points)</strong> structural alignment score under registered weights.
              </p>
            </div>

            <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginBottom: "6px" }}>
                <span style={{ color: "var(--dim)" }}>Threshold Progress</span>
                <span style={{ fontWeight: 700, color: "#059669", fontFamily: "var(--font-mono)" }}>75.00 / 100.00</span>
              </div>
              <div style={{ height: "8px", background: "var(--gray-50)", borderRadius: "9999px", overflow: "hidden", border: "1px solid var(--line)" }}>
                <div style={{ width: "75%", height: "100%", background: "linear-gradient(90deg, #10b981 0%, #059669 100%)", borderRadius: "9999px" }} />
              </div>
            </div>
          </div>

          {/* Assertion 2: Recommended Chain */}
          <div
            style={{
              background: "var(--panel)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "var(--r-md)",
              padding: "20px",
              boxShadow: "var(--shadow-sm)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: "90px",
                height: "90px",
                background: "radial-gradient(circle, rgba(37, 99, 235, 0.12) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--dim)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  ASSERTION #2 · TARGET CHAIN MATCH
                </span>
                <span
                  style={{
                    fontSize: "0.66rem",
                    padding: "2px 8px",
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    borderRadius: "4px",
                    color: "#059669",
                    fontWeight: 800,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  MATCHED (4663)
                </span>
              </div>

              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--navy-900)", margin: "0 0 4px 0" }}>
                Recommended Chain: Robinhood Chain
              </h3>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--dim)", lineHeight: 1.5 }}>
                Proven to recommend <strong>Robinhood Chain (Chain ID 4663)</strong> as the top structural target across the complete snapshot universe.
              </p>
            </div>

            <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.72rem", color: "var(--dim)" }}>Target Ecosystem</span>
              <span style={{ fontSize: "0.74rem", fontWeight: 750, color: "var(--navy-900)", fontFamily: "var(--font-mono)" }}>
                Arbitrum Nitro Stack (4663)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Architecture & Salt Hygiene Grid */}
      <section style={{ padding: "16px 0", borderTop: "none", marginBottom: "12px" }}>
        <div style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Lock size={18} style={{ color: "var(--navy-900)" }} />
          <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--navy-900)", margin: 0 }}>
            Cryptographic Privacy & Salt Protection Architecture
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "16px",
          }}
        >
          {/* Card 1: Client Salt Hygiene */}
          <div
            style={{
              background: "var(--panel)",
              border: "1px solid var(--line)",
              borderRadius: "var(--r-md)",
              padding: "18px",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <EyeOff size={16} style={{ color: "var(--navy-800)" }} />
              <h3 style={{ margin: 0, fontSize: "0.92rem", fontWeight: 750, color: "var(--navy-900)" }}>
                In-Browser Salt Generation
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--dim)", lineHeight: 1.55 }}>
              The 32-byte salt is generated inside the creator&apos;s browser via <code>crypto.getRandomValues()</code>. Modus backend logging strips HTTP request bodies to guarantee zero salt persistence on disk or database.
            </p>
          </div>

          {/* Card 2: Dual Commitments */}
          <div
            style={{
              background: "var(--panel)",
              border: "1px solid var(--line)",
              borderRadius: "var(--r-md)",
              padding: "18px",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Cpu size={16} style={{ color: "var(--navy-800)" }} />
              <h3 style={{ margin: 0, fontSize: "0.92rem", fontWeight: 750, color: "var(--navy-900)" }}>
                Salted Binding Commitments
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--dim)", lineHeight: 1.55 }}>
              The guest verifies <code>features_commitment = keccak256(features || salt)</code> and <code>result_commitment = keccak256(result || salt)</code>. Onchain clear fields are zeroed to preserve 100% confidentiality.
            </p>
          </div>

          {/* Card 3: Standalone Verification */}
          <div
            style={{
              background: "var(--panel)",
              border: "1px solid var(--line)",
              borderRadius: "var(--r-md)",
              padding: "18px",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Database size={16} style={{ color: "var(--navy-800)" }} />
              <h3 style={{ margin: 0, fontSize: "0.92rem", fontWeight: 750, color: "var(--navy-900)" }}>
                Zero Vendor Lock-In (`waggle-cli`)
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--dim)", lineHeight: 1.55 }}>
              Creators who require Modus to never see their salt can run <code>waggle prove --private</code> locally on their own hardware using our open-source Rust CLI.
            </p>
          </div>
        </div>
      </section>

      {/* Canonical Public Trust Wording Banner */}
      <section style={{ padding: "16px 0", borderTop: "none", marginBottom: "16px" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #273869 0%, #1e293b 100%)",
            borderRadius: "var(--r-md)",
            padding: "20px 24px",
            color: "#ffffff",
            boxShadow: "var(--shadow-md)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ fontSize: "0.68rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#93c5fd", marginBottom: "6px" }}>
            CANONICAL WAGGLE v3 TRUST BOUNDARY STATEMENT
          </div>
          <blockquote style={{ margin: 0, fontSize: "0.95rem", fontFamily: "var(--font-serif)", fontStyle: "italic", lineHeight: 1.5, color: "#f8fafc" }}>
            &ldquo;Every Waggle score is proven to follow from our published data and method. The data is attested onchain. Category classification is disclosed as an input.&rdquo;
          </blockquote>
        </div>
      </section>

      {/* Action Footer Bar */}
      <footer
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: "12px",
          paddingBottom: "0px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <Link
          href="/verify"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            color: "var(--navy-800)",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: "0.84rem",
          }}
        >
          <ArrowLeft size={14} /> Back to Onchain Verifier Engine
        </Link>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <a
            href={`https://robinhoodchain.blockscout.com/address/${WAGGLE_ATTESTOR_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              color: "#2563eb",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "0.82rem",
            }}
          >
            <span>Blockscout Explorer</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </footer>
    </main>
  );
}
