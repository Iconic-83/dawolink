import Link from "next/link";

const FEATURES = [
  { icon: "📦", text: "Real-time inventory across all branches" },
  { icon: "💳", text: "POS with EVC Plus, Zaad & Sahal payments" },
  { icon: "⏰", text: "AI-powered expiry intelligence" },
  { icon: "📊", text: "Live analytics & business insights" },
  { icon: "🏪", text: "Multi-branch management from one dashboard" },
  { icon: "🤖", text: "AI forecasting & smart automation" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "inherit" }}>

      {/* Left — Branding Panel */}
      <div
        style={{
          width: "44%",
          flexShrink: 0,
          background: "linear-gradient(160deg, #0d0825 0%, #180D62 50%, #1a2a5e 100%)",
          display: "flex",
          flexDirection: "column",
          padding: "48px 48px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow blobs */}
        <div style={{ position: "absolute", top: -80, right: -80, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,200,151,0.1) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -100, left: -60, width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle,rgba(74,143,229,0.08) 0%,transparent 70%)", pointerEvents: "none" }} />

        {/* Logo */}
        <div style={{ position: "relative", zIndex: 1, marginBottom: "auto" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 12, textDecoration: "none", marginBottom: 56 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg,#00C897,#4A8FE5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ width: 22, height: 22 }}>
                <path d="M12 2v20M6 8h12M6 16h12" strokeLinecap="round" />
              </svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: 22, color: "white" }}>
              Dawo<span style={{ color: "#00C897" }}>Link</span>
            </span>
          </Link>

          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: "white", lineHeight: 1.2, margin: "0 0 14px" }}>
              Smart Pharmacy Operations{" "}
              <span style={{ background: "linear-gradient(135deg,#00C897,#4A8FE5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Start Here
              </span>
            </h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, margin: 0, maxWidth: 340 }}>
              Join 150+ pharmacies using DawoLink to manage inventory, sales, and operations across Somalia.
            </p>
          </div>

          {/* Feature list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 48 }}>
            {FEATURES.map(f => (
              <div key={f.text} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(0,200,151,0.12)", border: "1px solid rgba(0,200,151,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                  {f.icon}
                </div>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.4 }}>{f.text}</span>
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 28, padding: "20px 24px", background: "rgba(255,255,255,0.04)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)" }}>
            {[["150+", "Pharmacies"], ["10K+", "Medicines"], ["99.9%", "Uptime"]].map(([v, l]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "white" }}>{v}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment badges */}
        <div style={{ position: "relative", zIndex: 1, marginTop: 40 }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Accepted Payments</p>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { name: "EVC Plus", color: "#E31837" },
              { name: "Zaad", color: "#009A44" },
              { name: "Sahal", color: "#0066CC" },
              { name: "Cash", color: "#6B7280" },
            ].map(p => (
              <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: p.color, display: "inline-block", flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>{p.name}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", marginTop: 24 }}>© 2026 DawoLink. Built for Somalia.</p>
        </div>
      </div>

      {/* Right — Form Panel */}
      <div style={{ flex: 1, background: "#F4F2FF", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 48px", overflowY: "auto" }}>
        <div style={{ width: "100%", maxWidth: 440 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
