import Link from "next/link";

const PLANS = [
  {
    name: "Starter", price: "$29", period: "/month",
    desc: "For independent single-location pharmacies",
    features: ["1 branch", "Up to 5 staff accounts", "Full POS system", "Inventory management", "Expiry tracking", "Basic analytics", "Email support"],
    notIncluded: ["Multi-branch transfers", "Advanced analytics", "API access"],
    highlight: false,
  },
  {
    name: "Professional", price: "$79", period: "/month",
    desc: "For growing multi-branch pharmacies",
    features: ["Up to 5 branches", "Unlimited staff accounts", "All Starter features", "Multi-branch stock transfers", "Branch analytics", "Supplier module", "Custom roles & permissions", "Priority support"],
    notIncluded: ["Unlimited branches", "API access"],
    highlight: true,
  },
  {
    name: "Enterprise", price: "Custom", period: "",
    desc: "Hospital networks & pharmacy chains",
    features: ["Unlimited branches", "Unlimited staff", "All Professional features", "REST API access", "Custom integrations", "Dedicated account manager", "Custom domain", "99.9% SLA uptime"],
    notIncluded: [],
    highlight: false,
  },
];

const FAQ = [
  { q: "Is there a free trial?", a: "Yes. Starter and Professional plans include a 14-day free trial. No credit card required." },
  { q: "Can I switch plans later?", a: "Absolutely. Upgrade or downgrade at any time from your account settings." },
  { q: "Do you support Somali Shilling?", a: "Yes. You can configure your currency, and the POS supports EVC Plus, Zaad, Sahal, and cash." },
  { q: "Is my data private?", a: "Yes. Each pharmacy has completely isolated data. No pharmacy can see another's information." },
  { q: "Can I add more branches later?", a: "Yes. Add branches anytime. If you exceed your plan limit, we will prompt you to upgrade." },
];

export default function PricingPage() {
  return (
    <div style={{ background: "#F4F2FF", minHeight: "100vh" }}>

      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(244,242,255,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E8E4FF" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#2D1B8E,#4A8FE5)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 16 }}>D</div>
            <span style={{ fontWeight: 800, fontSize: 18, color: "#180D62" }}>Dawo<span style={{ color: "#00C897" }}>Link</span></span>
          </Link>
          <div style={{ display: "flex", gap: 20 }}>
            <Link href="/features" style={{ fontSize: 14, color: "#6B6B9A", textDecoration: "none" }}>Features</Link>
            <Link href="/about" style={{ fontSize: 14, color: "#6B6B9A", textDecoration: "none" }}>About</Link>
            <Link href="/login" style={{ fontSize: 14, fontWeight: 600, padding: "7px 18px", borderRadius: 10, color: "white", background: "linear-gradient(90deg,#2D1B8E,#3D2AAD)", textDecoration: "none" }}>Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "64px 24px 0" }}>
        <h1 style={{ fontSize: 42, fontWeight: 800, color: "#180D62", margin: "0 0 12px" }}>Simple, Transparent Pricing</h1>
        <p style={{ fontSize: 18, color: "#6B6B9A", margin: "0 0 48px" }}>Start free. No credit card required. Cancel anytime.</p>
      </div>

      {/* Plans */}
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "0 24px 64px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
        {PLANS.map(plan => (
          <div key={plan.name} style={{
            borderRadius: 22,
            padding: "32px 28px",
            position: "relative",
            background: plan.highlight ? "linear-gradient(150deg,#2D1B8E,#3D2AAD)" : "white",
            border: plan.highlight ? "none" : "1px solid #E8E4FF",
            boxShadow: plan.highlight ? "0 20px 60px rgba(45,27,142,0.3)" : "0 2px 12px rgba(0,0,0,0.04)",
          }}>
            {plan.highlight && (
              <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: "#00C897", color: "white", fontSize: 11, fontWeight: 700, padding: "4px 16px", borderRadius: 999, whiteSpace: "nowrap" }}>
                Most Popular
              </div>
            )}

            <div style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: plan.highlight ? "rgba(255,255,255,0.55)" : "#9B9BC0" }}>{plan.desc}</span>
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: plan.highlight ? "white" : "#180D62", margin: "0 0 4px" }}>{plan.name}</h3>

            <div style={{ display: "flex", alignItems: "baseline", gap: 3, margin: "16px 0 24px" }}>
              <span style={{ fontSize: 44, fontWeight: 800, color: plan.highlight ? "white" : "#180D62" }}>{plan.price}</span>
              <span style={{ fontSize: 14, color: plan.highlight ? "rgba(255,255,255,0.55)" : "#9B9BC0" }}>{plan.period}</span>
            </div>

            <Link href="/login" style={{
              display: "block", textAlign: "center", padding: "13px",
              borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: "none",
              color: "white",
              background: plan.highlight ? "#00C897" : "linear-gradient(90deg,#2D1B8E,#3D2AAD)",
              marginBottom: 24,
            }}>
              {plan.price === "Custom" ? "Contact Sales" : "Start Free — 14 days"}
            </Link>

            <div style={{ borderTop: `1px solid ${plan.highlight ? "rgba(255,255,255,0.12)" : "#E8E4FF"}`, paddingTop: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: plan.highlight ? "rgba(255,255,255,0.4)" : "#9B9BC0", marginBottom: 12 }}>What&apos;s included</p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 9 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 13, color: plan.highlight ? "rgba(255,255,255,0.88)" : "#374151" }}>
                    <span style={{ color: "#00C897", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                    {f}
                  </li>
                ))}
                {plan.notIncluded.map(f => (
                  <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 13, opacity: 0.35, color: plan.highlight ? "white" : "#374151" }}>
                    <span style={{ flexShrink: 0, marginTop: 1 }}>✕</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 24px 80px" }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: "#180D62", textAlign: "center", marginBottom: 32 }}>Frequently Asked Questions</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {FAQ.map(item => (
            <div key={item.q} style={{ background: "white", borderRadius: 16, padding: "20px 24px", border: "1px solid #E8E4FF" }}>
              <h4 style={{ fontWeight: 700, color: "#180D62", marginBottom: 8, fontSize: 15 }}>{item.q}</h4>
              <p style={{ fontSize: 14, color: "#6B6B9A", margin: 0, lineHeight: 1.6 }}>{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ padding: "28px 24px", background: "white", borderTop: "1px solid #E8E4FF" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontWeight: 700, color: "#180D62", fontSize: 15 }}>Dawo<span style={{ color: "#00C897" }}>Link</span></span>
          <div style={{ display: "flex", gap: 20, fontSize: 13 }}>
            {[["Features","/features"],["About","/about"],["Login","/login"]].map(([l,h]) => (
              <Link key={l} href={h} style={{ color: "#9B9BC0", textDecoration: "none" }}>{l}</Link>
            ))}
          </div>
          <p style={{ fontSize: 13, color: "#C4BBFF", margin: 0 }}>© 2026 DawoLink</p>
        </div>
      </footer>
    </div>
  );
}
