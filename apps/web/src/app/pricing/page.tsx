import Link from "next/link";

const NAV = [["Features", "/features"], ["Pricing", "/pricing"], ["About", "/about"]];

const PLANS = [
  {
    name: "Starter",
    price: "$29",
    period: "/month",
    desc: "Single-location pharmacies",
    features: [
      "1 branch",
      "Up to 5 staff accounts",
      "Full POS system",
      "Inventory management",
      "Expiry tracking",
      "Basic analytics",
      "EVC, Zaad, Sahal payments",
      "Email support",
    ],
    notIncluded: ["Multi-branch transfers", "AI forecasting", "API access"],
    cta: "Start Free Trial",
    highlight: false,
  },
  {
    name: "Professional",
    price: "$99",
    period: "/month",
    desc: "Growing multi-branch pharmacies",
    features: [
      "Up to 5 branches",
      "Up to 50 staff accounts",
      "All Starter features",
      "Multi-branch stock transfers",
      "AI demand forecasting",
      "Advanced analytics",
      "Supplier management",
      "Custom roles & permissions",
      "Delivery module",
      "Customer history",
      "Priority support",
    ],
    notIncluded: ["Unlimited branches", "API access"],
    cta: "Upgrade to Professional",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "Chains & hospital networks",
    features: [
      "Unlimited branches",
      "Unlimited staff",
      "All Professional features",
      "REST API access",
      "Custom integrations",
      "Advanced AI tools",
      "Enterprise analytics",
      "Custom onboarding",
      "Dedicated account manager",
      "Priority infrastructure",
      "99.9% SLA uptime",
    ],
    notIncluded: [],
    cta: "Contact Sales",
    highlight: false,
  },
];

const COMPARISON = [
  { feature: "Inventory Management", starter: true, pro: true, enterprise: true },
  { feature: "Point of Sale (POS)", starter: true, pro: true, enterprise: true },
  { feature: "Expiry Tracking", starter: true, pro: true, enterprise: true },
  { feature: "Mobile Money Payments", starter: true, pro: true, enterprise: true },
  { feature: "Basic Analytics", starter: true, pro: true, enterprise: true },
  { feature: "Employee Management", starter: true, pro: true, enterprise: true },
  { feature: "Multi-Branch Management", starter: false, pro: true, enterprise: true },
  { feature: "AI Demand Forecasting", starter: false, pro: true, enterprise: true },
  { feature: "Advanced Analytics", starter: false, pro: true, enterprise: true },
  { feature: "Supplier Management", starter: false, pro: true, enterprise: true },
  { feature: "Stock Transfers", starter: false, pro: true, enterprise: true },
  { feature: "Delivery Module", starter: false, pro: true, enterprise: true },
  { feature: "Custom Roles & Permissions", starter: false, pro: true, enterprise: true },
  { feature: "API Access", starter: false, pro: false, enterprise: true },
  { feature: "Custom Integrations", starter: false, pro: false, enterprise: true },
  { feature: "Dedicated Account Manager", starter: false, pro: false, enterprise: true },
  { feature: "Custom Onboarding", starter: false, pro: false, enterprise: true },
  { feature: "Priority Infrastructure", starter: false, pro: false, enterprise: true },
];

const ADDONS = [
  { icon: "💬", title: "SMS Notifications", desc: "Medicine reminders, alerts, OTP confirmations, and stock notifications via SMS.", price: "$9/mo" },
  { icon: "🤖", title: "AI Premium Tools", desc: "Advanced forecasting, prescription OCR scanning, and deep analytics insights.", price: "$19/mo" },
  { icon: "🖨️", title: "Hardware Setup", desc: "Barcode scanners, receipt printers, tablets, and full hardware configuration support.", price: "From $199" },
  { icon: "🎓", title: "Training Package", desc: "Live onboarding sessions, staff training, and ongoing coaching for your team.", price: "$49 one-time" },
  { icon: "🚚", title: "Delivery Module", desc: "Full driver management, route tracking, delivery verification, and customer notifications.", price: "$29/mo" },
];

const FAQ = [
  { q: "Can I manage multiple branches on one account?", a: "Yes. Professional and Enterprise plans support multi-branch management with unified inventory, reporting, and access control from a single dashboard." },
  { q: "Does DawoLink work offline?", a: "Yes. DawoLink is built offline-first. The POS, inventory, and core operations continue functioning during internet interruptions. Data syncs automatically when connection is restored." },
  { q: "Can I create custom employee roles?", a: "Yes. Professional and Enterprise plans include custom role creation with 26 granular permissions across 9 modules. Assign exactly the right access to each employee." },
  { q: "Is mobile money supported?", a: "Yes. All plans include full support for EVC Plus, Zaad, Sahal, Premier Wallet, and cash payments. This is built into the core POS system." },
  { q: "Can I upgrade or downgrade my plan later?", a: "Absolutely. You can upgrade or downgrade at any time from your account settings. Changes take effect immediately." },
  { q: "Is training included?", a: "Professional and Enterprise plans include onboarding assistance and live training sessions. Starter plan includes access to our documentation and email support." },
  { q: "Do you support Somali Shilling pricing?", a: "The platform supports local currency configuration. Mobile money billing and flexible local pricing options are available for Somali pharmacies." },
  { q: "Is my pharmacy data private?", a: "Yes. Each pharmacy has completely isolated data storage. No pharmacy can access another's information. All data is encrypted and backed up daily." },
];

function Check({ val }: { val: boolean }) {
  return val
    ? <span style={{ color: "#00C897", fontWeight: 800, fontSize: 15 }}>✓</span>
    : <span style={{ color: "#D1D5DB", fontSize: 14 }}>—</span>;
}

export default function PricingPage() {
  return (
    <div style={{ background: "#F4F2FF", minHeight: "100vh" }}>

      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(244,242,255,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(45,27,142,0.08)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px", height: 64, display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <img src="/logo.png" alt="DawoLink" style={{ width: 36, height: 36, borderRadius: 10, objectFit: "contain" }} />
            <span style={{ fontWeight: 800, fontSize: 19, color: "#180D62" }}>Dawo<span style={{ color: "#00C897" }}>Link</span></span>
          </Link>
          <div style={{ display: "flex", gap: 36, fontSize: 14, fontWeight: 500 }}>
            {NAV.map(([label, href]) => (
              <Link key={href} href={href} style={{ color: href === "/pricing" ? "#2D1B8E" : "#6B6B9A", textDecoration: "none", fontWeight: href === "/pricing" ? 700 : 500 }}>{label}</Link>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end" }}>
            <Link href="/login" style={{ padding: "8px 18px", borderRadius: 10, fontSize: 14, fontWeight: 500, color: "#2D1B8E", textDecoration: "none" }}>Sign In</Link>
            <Link href="/login" style={{ padding: "9px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700, color: "white", background: "linear-gradient(90deg,#2D1B8E,#3D2AAD)", textDecoration: "none" }}>Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: "72px 24px 0", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#D1FAE5", borderRadius: 999, padding: "5px 14px", fontSize: 12, fontWeight: 600, color: "#059669", marginBottom: 20 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#059669", display: "inline-block" }} />
          14-day free trial on all plans — no credit card required
        </div>
        <h1 style={{ fontSize: "clamp(32px,4.5vw,52px)", fontWeight: 800, color: "#180D62", margin: "0 0 16px", lineHeight: 1.15 }}>
          Simple Pricing for Every Pharmacy
        </h1>
        <p style={{ fontSize: 18, color: "#6B6B9A", margin: "0 auto 16px", maxWidth: 520, lineHeight: 1.7 }}>
          Whether you run a single location or a nationwide chain, DawoLink scales with your operations.
        </p>
        <div style={{ display: "inline-flex", gap: 0, background: "#E8E4FF", borderRadius: 12, padding: 4, marginBottom: 60 }}>
          <div style={{ padding: "8px 20px", borderRadius: 9, background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", fontSize: 13, fontWeight: 700, color: "#180D62" }}>Monthly</div>
          <div style={{ padding: "8px 20px", borderRadius: 9, fontSize: 13, fontWeight: 500, color: "#9B9BC0", display: "flex", alignItems: "center", gap: 6 }}>
            Yearly <span style={{ background: "#00C897", color: "white", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>Save 20%</span>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section style={{ padding: "0 24px 80px" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
          {PLANS.map(plan => (
            <div key={plan.name} style={{
              borderRadius: 24,
              padding: "36px 30px",
              position: "relative",
              background: plan.highlight ? "linear-gradient(150deg,#2D1B8E,#3D2AAD)" : "white",
              border: plan.highlight ? "none" : "1px solid #E8E4FF",
              boxShadow: plan.highlight ? "0 24px 72px rgba(45,27,142,0.35)" : "0 2px 16px rgba(0,0,0,0.04)",
            }}>
              {plan.highlight && (
                <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "#00C897", color: "white", fontSize: 11, fontWeight: 700, padding: "5px 18px", borderRadius: 999, whiteSpace: "nowrap" as const, boxShadow: "0 4px 12px rgba(0,200,151,0.4)" }}>
                  Most Popular
                </div>
              )}
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.07em", color: plan.highlight ? "rgba(255,255,255,0.5)" : "#9B9BC0" }}>{plan.desc}</span>
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 800, color: plan.highlight ? "white" : "#180D62", margin: "0 0 4px" }}>{plan.name}</h3>
              <div style={{ display: "flex", alignItems: "baseline", gap: 3, margin: "16px 0 24px" }}>
                <span style={{ fontSize: 46, fontWeight: 800, color: plan.highlight ? "white" : "#180D62", lineHeight: 1 }}>{plan.price}</span>
                <span style={{ fontSize: 14, color: plan.highlight ? "rgba(255,255,255,0.5)" : "#9B9BC0" }}>{plan.period}</span>
              </div>
              <Link href="/login" style={{
                display: "block", textAlign: "center", padding: "13px",
                borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: "none",
                color: "white",
                background: plan.highlight ? "#00C897" : "linear-gradient(90deg,#2D1B8E,#3D2AAD)",
                marginBottom: 26,
                boxShadow: plan.highlight ? "0 4px 16px rgba(0,200,151,0.4)" : "none",
              }}>
                {plan.cta}
              </Link>
              <div style={{ borderTop: `1px solid ${plan.highlight ? "rgba(255,255,255,0.12)" : "#E8E4FF"}`, paddingTop: 20 }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", color: plan.highlight ? "rgba(255,255,255,0.4)" : "#9B9BC0", marginBottom: 14 }}>What&apos;s included</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 13, color: plan.highlight ? "rgba(255,255,255,0.85)" : "#374151" }}>
                      <span style={{ color: "#00C897", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                      {f}
                    </div>
                  ))}
                  {plan.notIncluded.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 13, opacity: 0.32, color: plan.highlight ? "white" : "#374151" }}>
                      <span style={{ flexShrink: 0, marginTop: 1 }}>—</span>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section style={{ padding: "0 24px 80px", background: "white" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", padding: "60px 0 40px" }}>
            <h2 style={{ fontSize: 34, fontWeight: 800, color: "#180D62", margin: "0 0 12px" }}>Compare All Features</h2>
            <p style={{ fontSize: 16, color: "#6B6B9A" }}>See exactly what&apos;s included in each plan.</p>
          </div>
          <div style={{ borderRadius: 20, border: "1px solid #E8E4FF", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", background: "#F4F2FF", padding: "16px 24px", borderBottom: "1px solid #E8E4FF" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#9B9BC0", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Feature</div>
              {["Starter", "Professional", "Enterprise"].map((p, i) => (
                <div key={p} style={{ textAlign: "center" as const, fontSize: 13, fontWeight: 700, color: i === 1 ? "#2D1B8E" : "#374151" }}>{p}</div>
              ))}
            </div>
            {COMPARISON.map((row, i) => (
              <div key={row.feature} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "13px 24px", background: i % 2 === 0 ? "white" : "#FAFAFA", borderBottom: i < COMPARISON.length - 1 ? "1px solid #F0EDFF" : "none", alignItems: "center" }}>
                <span style={{ fontSize: 14, color: "#374151" }}>{row.feature}</span>
                <div style={{ textAlign: "center" as const }}><Check val={row.starter} /></div>
                <div style={{ textAlign: "center" as const }}><Check val={row.pro} /></div>
                <div style={{ textAlign: "center" as const }}><Check val={row.enterprise} /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Add-Ons */}
      <section style={{ padding: "80px 24px", background: "#F4F2FF" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: 34, fontWeight: 800, color: "#180D62", margin: "0 0 12px" }}>Optional Add-Ons</h2>
            <p style={{ fontSize: 16, color: "#6B6B9A" }}>Extend DawoLink with powerful additional modules.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {ADDONS.map(a => (
              <div key={a.title} style={{ background: "white", borderRadius: 20, padding: "28px 24px", border: "1px solid #E8E4FF" }}>
                <span style={{ fontSize: 28, display: "block", marginBottom: 14 }}>{a.icon}</span>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: "#180D62", margin: 0 }}>{a.title}</h4>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#00C897", background: "#D1FAE5", padding: "3px 10px", borderRadius: 6, flexShrink: 0, marginLeft: 8 }}>{a.price}</span>
                </div>
                <p style={{ fontSize: 13, color: "#6B6B9A", lineHeight: 1.65, margin: 0 }}>{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free Trial Banner */}
      <section style={{ padding: "72px 24px", background: "linear-gradient(135deg,#180D62 0%,#2D1B8E 60%,#1a2a5e 100%)" }}>
        <div style={{ maxWidth: 820, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr auto", gap: 40, alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: "white", margin: "0 0 12px", lineHeight: 1.2 }}>Try DawoLink Free for 14 Days</h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", margin: 0, lineHeight: 1.7 }}>
              Start immediately with full access to all Starter or Professional features. No credit card required. No risk.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
            <Link href="/login" style={{ padding: "14px 30px", borderRadius: 12, fontWeight: 700, color: "white", background: "linear-gradient(90deg,#00C897,#009E78)", fontSize: 15, textDecoration: "none", textAlign: "center" as const, whiteSpace: "nowrap" as const }}>
              Start Free Trial
            </Link>
            <Link href="/about" style={{ padding: "12px 30px", borderRadius: 12, fontWeight: 600, fontSize: 14, color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.2)", textDecoration: "none", textAlign: "center" as const }}>
              Book a Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Why DawoLink */}
      <section style={{ padding: "80px 24px", background: "white" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: 34, fontWeight: 800, color: "#180D62", margin: "0 0 12px" }}>Why Pharmacies Choose DawoLink</h2>
            <p style={{ fontSize: 16, color: "#6B6B9A" }}>Not just a cost — a measurable return on investment.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
            {[
              { icon: "⏰", title: "Stop Expiry Losses", desc: "Pharmacies using DawoLink report up to 70% reduction in expired stock losses.", color: "#F59E0B" },
              { icon: "⚡", title: "Faster Operations", desc: "The POS system cuts average checkout time by 60% vs. manual systems.", color: "#4A8FE5" },
              { icon: "📊", title: "Real-Time Visibility", desc: "Know your stock, sales, and profitability at any moment — not at month-end.", color: "#00C897" },
              { icon: "🛡️", title: "Employee Accountability", desc: "Audit logs and role permissions reduce internal losses and improve accuracy.", color: "#8B5CF6" },
            ].map(b => (
              <div key={b.title} style={{ background: "#F4F2FF", borderRadius: 20, padding: "28px 22px", border: "1px solid #E8E4FF", textAlign: "center" as const }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: `${b.color}14`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 14px" }}>{b.icon}</div>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: "#180D62", marginBottom: 8 }}>{b.title}</h4>
                <p style={{ fontSize: 13, color: "#6B6B9A", lineHeight: 1.65, margin: 0 }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section style={{ padding: "80px 24px", background: "#F4F2FF" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: 34, fontWeight: 800, color: "#180D62", margin: "0 0 12px" }}>The Real Cost of Not Switching</h2>
            <p style={{ fontSize: 16, color: "#6B6B9A" }}>Manual pharmacy systems cost far more than any subscription.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: "#FEF2F2", borderRadius: 20, padding: "32px", border: "1px solid #FCA5A5" }}>
              <h4 style={{ fontSize: 17, fontWeight: 800, color: "#DC2626", marginBottom: 20 }}>Without DawoLink</h4>
              {[
                ["Monthly expiry losses", "$300 – $1,200"],
                ["Lost sales from stockouts", "$200 – $500"],
                ["Manual counting hours", "8 – 20 hrs/week"],
                ["Reporting errors & mistakes", "Unquantified losses"],
                ["Staff time on admin", "15+ hrs/week"],
              ].map(([label, cost]) => (
                <div key={label as string} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, padding: "8px 0", borderBottom: "1px solid #FEE2E2" }}>
                  <span style={{ fontSize: 13, color: "#7F1D1D" }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#DC2626" }}>{cost}</span>
                </div>
              ))}
            </div>
            <div style={{ background: "linear-gradient(150deg,#F0FDF4,#D1FAE5)", borderRadius: 20, padding: "32px", border: "1px solid #6EE7B7" }}>
              <h4 style={{ fontSize: 17, fontWeight: 800, color: "#059669", marginBottom: 20 }}>With DawoLink Starter ($29/mo)</h4>
              {[
                ["Expiry intelligence alerts", "Losses near zero"],
                ["Real-time stock prevents stockouts", "Sales maximized"],
                ["Automated inventory tracking", "Hours saved daily"],
                ["Accurate reporting built-in", "Zero manual errors"],
                ["Staff focused on patients", "Productivity up 40%"],
              ].map(([label, result]) => (
                <div key={label as string} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, padding: "8px 0", borderBottom: "1px solid #A7F3D0" }}>
                  <span style={{ fontSize: 13, color: "#064E3B" }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#059669" }}>{result}</span>
                </div>
              ))}
            </div>
          </div>
          <p style={{ textAlign: "center" as const, fontSize: 15, color: "#6B6B9A", marginTop: 24, fontStyle: "italic" }}>
            Most pharmacies recover the cost of DawoLink within the first month through expiry loss prevention alone.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "80px 24px", background: "white" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: 34, fontWeight: 800, color: "#180D62", margin: "0 0 12px" }}>Frequently Asked Questions</h2>
            <p style={{ fontSize: 16, color: "#6B6B9A" }}>Everything you need to know before getting started.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {FAQ.map(item => (
              <div key={item.q} style={{ background: "#F4F2FF", borderRadius: 16, padding: "22px 26px", border: "1px solid #E8E4FF" }}>
                <h4 style={{ fontWeight: 700, color: "#180D62", marginBottom: 10, fontSize: 15 }}>{item.q}</h4>
                <p style={{ fontSize: 14, color: "#6B6B9A", margin: 0, lineHeight: 1.7 }}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: "100px 24px", background: "linear-gradient(150deg,#0d0825 0%,#180D62 50%,#2D1B8E 100%)", textAlign: "center" as const }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 800, color: "white", margin: "0 0 16px", lineHeight: 1.2 }}>
            Start Building a Smarter Pharmacy Today
          </h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.6)", marginBottom: 40, lineHeight: 1.7 }}>
            Join 150+ pharmacies using DawoLink. 14-day free trial. No credit card needed.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/login" style={{ padding: "16px 36px", borderRadius: 14, fontWeight: 700, color: "white", background: "linear-gradient(90deg,#00C897,#009E78)", fontSize: 16, textDecoration: "none", boxShadow: "0 8px 32px rgba(0,200,151,0.35)" }}>
              Start Free Trial
            </Link>
            <Link href="/about" style={{ padding: "16px 36px", borderRadius: 14, fontWeight: 700, fontSize: 16, color: "white", border: "1px solid rgba(255,255,255,0.2)", textDecoration: "none", background: "rgba(255,255,255,0.06)" }}>
              Book a Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: "#080520", padding: "60px 24px 32px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <img src="/logo.png" alt="DawoLink" style={{ width: 34, height: 34, borderRadius: 10, objectFit: "contain" }} />
                <span style={{ fontWeight: 800, fontSize: 17, color: "white" }}>Dawo<span style={{ color: "#00C897" }}>Link</span></span>
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.75, maxWidth: 240 }}>Somalia&apos;s smart pharmacy infrastructure. One platform. Every pharmacy.</p>
            </div>
            {[
              { title: "Product", links: [["Features", "/features"], ["Pricing", "/pricing"], ["Integrations", "/features"]] },
              { title: "Company", links: [["About", "/about"], ["Contact", "/about"], ["Careers", "/about"]] },
              { title: "Legal", links: [["Privacy", "/about"], ["Terms", "/about"], ["Security", "/about"]] },
            ].map(col => (
              <div key={col.title}>
                <h4 style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 14 }}>{col.title}</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {col.links.map(([label, href]) => (
                    <Link key={label} href={href} style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>{label}</Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.2)" }}>© 2026 DawoLink. Built for Somalia.</span>
            <div style={{ display: "flex", gap: 16 }}>
              {[["LinkedIn", "/about"], ["Facebook", "/about"], ["X", "/about"]].map(([l, h]) => (
                <Link key={l} href={h} style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", textDecoration: "none" }}>{l}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
