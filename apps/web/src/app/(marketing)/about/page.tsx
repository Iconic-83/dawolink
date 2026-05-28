import Link from "next/link";

export default function AboutPage() {
  return (
    <div style={{ background: "#F4F2FF", minHeight: "100vh" }}>
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(244,242,255,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E8E4FF" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 60, display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#2D1B8E,#4A8FE5)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 16 }}>D</div>
            <span style={{ fontWeight: 800, fontSize: 18, color: "#180D62" }}>Dawo<span style={{ color: "#00C897" }}>Link</span></span>
          </Link>
          <div style={{ display: "flex", gap: 32, fontSize: 14, fontWeight: 500 }}>
            <Link href="/features" style={{ color: "#6B6B9A", textDecoration: "none" }}>Features</Link>
            <Link href="/pricing" style={{ color: "#6B6B9A", textDecoration: "none" }}>Pricing</Link>
            <Link href="/about" style={{ color: "#2D1B8E", textDecoration: "none", fontWeight: 700 }}>About</Link>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Link href="/login" style={{ fontSize: 14, fontWeight: 600, padding: "7px 18px", borderRadius: 10, color: "white", background: "linear-gradient(90deg,#2D1B8E,#3D2AAD)", textDecoration: "none" }}>Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg,#180D62 0%,#2D1B8E 100%)", padding: "72px 24px", textAlign: "center" }}>
        <h1 style={{ fontSize: 46, fontWeight: 800, color: "white", margin: "0 0 16px" }}>Our Mission</h1>
        <p style={{ fontSize: 18, color: "rgba(255,255,255,0.72)", maxWidth: 580, margin: "0 auto", lineHeight: 1.65 }}>
          To connect Somalia&apos;s medicine ecosystem — making every pharmacy more efficient, every patient safer, and every medicine more traceable.
        </p>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "60px 24px 80px" }}>

        {/* Story */}
        <div style={{ background: "white", borderRadius: 20, padding: "36px", border: "1px solid #E8E4FF", marginBottom: 28 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#180D62", marginBottom: 20 }}>The Story</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, fontSize: 15, color: "#374151", lineHeight: 1.75 }}>
            <p style={{ margin: 0 }}>Somalia has thousands of pharmacies serving millions of patients — but most operate with paper records, no expiry tracking, and no way to know what medicine is available where.</p>
            <p style={{ margin: 0 }}>DawoLink was built to change that. We started with a simple question: <em>what if every pharmacy in Somalia had the same technology as a modern hospital?</em></p>
            <p style={{ margin: 0 }}>Today, DawoLink is a full platform: POS, inventory, analytics, supplier management, multi-branch control — all built specifically for the Somali healthcare context, with native support for EVC Plus, Zaad, and Sahal payments.</p>
          </div>
        </div>

        {/* Vision cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 28 }}>
          {[
            { icon: "🏥", title: "Connected Pharmacies", desc: "Every pharmacy on one network — sharing intelligence, not data." },
            { icon: "🌍", title: "National Medicine DB", desc: "A single source of truth for medicines available in Somalia." },
            { icon: "🤖", title: "AI-Powered Insights", desc: "Predict shortages before they happen. Route medicines where needed." },
          ].map(v => (
            <div key={v.title} style={{ background: "white", borderRadius: 18, padding: "28px 22px", textAlign: "center", border: "1px solid #E8E4FF" }}>
              <div style={{ fontSize: 38, marginBottom: 14 }}>{v.icon}</div>
              <h3 style={{ fontWeight: 700, color: "#180D62", marginBottom: 8, fontSize: 15 }}>{v.title}</h3>
              <p style={{ fontSize: 13, color: "#6B6B9A", margin: 0, lineHeight: 1.6 }}>{v.desc}</p>
            </div>
          ))}
        </div>

        {/* Values */}
        <div style={{ background: "white", borderRadius: 20, padding: "36px", border: "1px solid #E8E4FF", marginBottom: 48 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#180D62", marginBottom: 24 }}>What We Believe</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {[
              { title: "Data belongs to you", desc: "Your pharmacy data is yours. We never share, sell, or use it for anything beyond running your software." },
              { title: "Affordable by default", desc: "World-class software should not be reserved for large corporations. Our pricing is built for Somali pharmacies." },
              { title: "Security is non-negotiable", desc: "Patient privacy and medicine security are critical. Every action is audited. Every access is controlled." },
              { title: "Built in Africa, for Africa", desc: "We understand local payment systems, supply chains, regulations, and culture — this is not a generic SaaS with a new logo." },
            ].map(v => (
              <div key={v.title} style={{ display: "flex", gap: 14 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#00C897", flexShrink: 0, marginTop: 6 }} />
                <div>
                  <h4 style={{ fontWeight: 700, color: "#180D62", marginBottom: 6, fontSize: 15 }}>{v.title}</h4>
                  <p style={{ fontSize: 13, color: "#6B6B9A", margin: 0, lineHeight: 1.65 }}>{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <Link href="/login" style={{ display: "inline-block", padding: "16px 40px", borderRadius: 14, fontWeight: 700, color: "white", fontSize: 17, background: "linear-gradient(90deg,#2D1B8E,#3D2AAD)", textDecoration: "none" }}>
            Join DawoLink Today
          </Link>
        </div>
      </div>

      <footer style={{ padding: "28px 24px", background: "white", borderTop: "1px solid #E8E4FF" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontWeight: 700, color: "#180D62", fontSize: 15 }}>Dawo<span style={{ color: "#00C897" }}>Link</span></span>
          <div style={{ display: "flex", gap: 20, fontSize: 13 }}>
            {[["Features","/features"],["Pricing","/pricing"],["Login","/login"]].map(([l,h]) => (
              <Link key={l} href={h} style={{ color: "#9B9BC0", textDecoration: "none" }}>{l}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
