import Link from "next/link";

const FEATURES = [
  { icon: "📦", title: "Smart Inventory", desc: "Real-time stock across all branches. Auto-alerts before you run out." },
  { icon: "💳", title: "Point of Sale", desc: "Fast checkout with EVC Plus, Zaad, Sahal & cash support." },
  { icon: "⏰", title: "Expiry Tracking", desc: "30/15/7 day alerts. Never sell expired medicine again." },
  { icon: "📊", title: "Analytics", desc: "Revenue trends, top medicines, branch performance live." },
  { icon: "🏪", title: "Multi-Branch", desc: "One account, unlimited branches. Unified stock & reporting." },
  { icon: "🤝", title: "Supplier Management", desc: "POs, ratings, delivery tracking. Full procurement cycle." },
  { icon: "🛡️", title: "Roles & Permissions", desc: "26 granular permissions. Define what each employee can do." },
  { icon: "🤖", title: "AI Forecasting", desc: "Predict demand. Detect shortages before they hit." },
];

export default function HomePage() {
  return (
    <div style={{ background: "#F4F2FF", minHeight: "100vh", fontFamily: "inherit" }}>

      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(244,242,255,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E8E4FF" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#2D1B8E,#4A8FE5)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 16 }}>D</div>
            <span style={{ fontWeight: 800, fontSize: 18, color: "#180D62" }}>Dawo<span style={{ color: "#00C897" }}>Link</span></span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <div style={{ display: "flex", gap: 24, fontSize: 14, fontWeight: 500 }}>
              <Link href="/features" style={{ color: "#6B6B9A", textDecoration: "none" }}>Features</Link>
              <Link href="/pricing" style={{ color: "#6B6B9A", textDecoration: "none" }}>Pricing</Link>
              <Link href="/about" style={{ color: "#6B6B9A", textDecoration: "none" }}>About</Link>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Link href="/login" style={{ padding: "8px 16px", borderRadius: 10, fontSize: 14, fontWeight: 500, color: "#2D1B8E", textDecoration: "none" }}>Sign In</Link>
              <Link href="/login" style={{ padding: "8px 18px", borderRadius: 10, fontSize: 14, fontWeight: 600, color: "white", background: "linear-gradient(90deg,#2D1B8E,#3D2AAD)", textDecoration: "none" }}>Get Started</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: "80px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 60, left: "20%", width: 400, height: 400, borderRadius: "50%", background: "#2D1B8E", opacity: 0.06, filter: "blur(80px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 0, right: "15%", width: 320, height: 320, borderRadius: "50%", background: "#00C897", opacity: 0.07, filter: "blur(80px)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 780, margin: "0 auto", position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#E8E4FF", borderRadius: 999, padding: "6px 16px", fontSize: 13, fontWeight: 600, color: "#2D1B8E", marginBottom: 24 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#00C897", display: "inline-block" }} />
            Built for Somalia. Designed for Africa.
          </div>
          <h1 style={{ fontSize: "clamp(36px,5vw,58px)", fontWeight: 800, color: "#180D62", lineHeight: 1.15, marginBottom: 20, margin: "0 0 20px 0" }}>
            The Connected Operating Network<br />
            <span style={{ color: "#00C897" }}>for Modern Pharmacies</span>
          </h1>
          <p style={{ fontSize: 18, color: "#6B6B9A", marginBottom: 40, maxWidth: 560, margin: "0 auto 40px" }}>
            Manage inventory, process sales, track expiry, and grow your pharmacy business — all in one platform.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/login" style={{ padding: "14px 32px", borderRadius: 12, fontWeight: 700, color: "white", background: "linear-gradient(90deg,#2D1B8E,#3D2AAD)", fontSize: 16, textDecoration: "none" }}>
              Start Free Trial
            </Link>
            <Link href="/features" style={{ padding: "14px 32px", borderRadius: 12, fontWeight: 700, fontSize: 16, color: "#2D1B8E", border: "2px solid #2D1B8E", textDecoration: "none" }}>
              View Features →
            </Link>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", justifyContent: "center", gap: 60, marginTop: 60 }}>
            {[["120+", "Pharmacies"], ["50K+", "Medicines Tracked"], ["2M+", "Transactions"]].map(([v, l]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: "#2D1B8E" }}>{v}</div>
                <div style={{ fontSize: 13, color: "#9B9BC0", marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "64px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: "#180D62", margin: "0 0 8px" }}>Everything Your Pharmacy Needs</h2>
            <p style={{ color: "#6B6B9A", fontSize: 17 }}>From daily operations to national-scale intelligence</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 20 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ background: "white", borderRadius: 20, padding: "24px", border: "1px solid #E8E4FF" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontWeight: 700, color: "#180D62", marginBottom: 6, fontSize: 15 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: "#6B6B9A", lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section style={{ padding: "64px 24px", background: "white" }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: "#180D62", margin: "0 0 8px" }}>Simple, Transparent Pricing</h2>
            <p style={{ color: "#6B6B9A", fontSize: 17 }}>Start free. Scale as you grow.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {[
              { name: "Starter", price: "$29", period: "/mo", features: ["1 branch", "5 staff", "Inventory + POS", "Basic analytics"], highlight: false },
              { name: "Professional", price: "$79", period: "/mo", features: ["5 branches", "Unlimited staff", "All features", "Priority support"], highlight: true },
              { name: "Enterprise", price: "Custom", period: "", features: ["Unlimited branches", "API access", "Custom domain", "SLA guarantee"], highlight: false },
            ].map(p => (
              <div key={p.name} style={{ borderRadius: 20, padding: "28px", position: "relative", background: p.highlight ? "linear-gradient(135deg,#2D1B8E,#3D2AAD)" : "#F4F2FF", border: p.highlight ? "none" : "1px solid #E8E4FF" }}>
                {p.highlight && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#00C897", color: "white", fontSize: 11, fontWeight: 700, padding: "4px 14px", borderRadius: 999 }}>Most Popular</div>}
                <h3 style={{ fontWeight: 700, fontSize: 18, color: p.highlight ? "white" : "#180D62", marginBottom: 4 }}>{p.name}</h3>
                <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginBottom: 20 }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: p.highlight ? "white" : "#180D62" }}>{p.price}</span>
                  <span style={{ fontSize: 13, color: p.highlight ? "rgba(255,255,255,0.6)" : "#9B9BC0" }}>{p.period}</span>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 8 }}>
                  {p.features.map(f => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: p.highlight ? "rgba(255,255,255,0.85)" : "#374151" }}>
                      <span style={{ color: "#00C897", fontWeight: 700 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/login" style={{ display: "block", textAlign: "center", padding: "11px", borderRadius: 12, fontWeight: 600, fontSize: 14, color: "white", background: p.highlight ? "#00C897" : "#2D1B8E", textDecoration: "none" }}>
                  {p.price === "Custom" ? "Contact Sales" : "Start Free Trial"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 24px", background: "linear-gradient(135deg,#180D62 0%,#2D1B8E 60%,#1A3A6E 100%)", textAlign: "center" }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, color: "white", margin: "0 0 12px" }}>Ready to Transform Your Pharmacy?</h2>
        <p style={{ fontSize: 18, color: "rgba(255,255,255,0.7)", marginBottom: 32 }}>Join 120+ pharmacies already using DawoLink</p>
        <Link href="/login" style={{ display: "inline-block", padding: "16px 40px", borderRadius: 14, fontWeight: 700, color: "white", fontSize: 17, background: "linear-gradient(90deg,#00C897,#009E78)", textDecoration: "none" }}>
          Get Started Free
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ padding: "32px 24px", background: "white", borderTop: "1px solid #E8E4FF" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#2D1B8E,#4A8FE5)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 13 }}>D</div>
            <span style={{ fontWeight: 700, color: "#180D62" }}>Dawo<span style={{ color: "#00C897" }}>Link</span></span>
          </div>
          <div style={{ display: "flex", gap: 24, fontSize: 13 }}>
            {[["Features","/features"],["Pricing","/pricing"],["About","/about"],["Login","/login"]].map(([l,h]) => (
              <Link key={l} href={h} style={{ color: "#9B9BC0", textDecoration: "none" }}>{l}</Link>
            ))}
          </div>
          <p style={{ fontSize: 13, color: "#C4BBFF", margin: 0 }}>© 2026 DawoLink. Built for Somalia.</p>
        </div>
      </footer>
    </div>
  );
}
