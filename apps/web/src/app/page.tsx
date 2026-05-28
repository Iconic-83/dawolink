import Link from "next/link";

const FEATURES = [
  { icon: "📦", title: "Smart Inventory", desc: "Real-time stock tracking across all branches. Auto-alerts before you run out." },
  { icon: "💳", title: "Point of Sale", desc: "Fast checkout with barcode scanning. EVC Plus, Zaad, Sahal payment support." },
  { icon: "⏰", title: "Expiry Tracking", desc: "Automated alerts 30, 15, and 7 days before medicine expiry. Never sell expired stock." },
  { icon: "📊", title: "Analytics Dashboard", desc: "Revenue trends, top medicines, branch performance — all in real time." },
  { icon: "🏪", title: "Multi-Branch", desc: "Run unlimited branches from one account. Stock transfers, unified reporting." },
  { icon: "🤝", title: "Supplier Management", desc: "Purchase orders, supplier ratings, delivery tracking. Complete procurement cycle." },
  { icon: "🛡️", title: "Roles & Permissions", desc: "Define exactly what each employee can see and do. Pharmacy-grade access control." },
  { icon: "🤖", title: "AI Forecasting", desc: "Predict demand, detect shortages early. Powered by national medicine intelligence." },
];

const PLANS = [
  {
    name: "Starter", price: "$29", period: "/month",
    desc: "Perfect for a single pharmacy branch",
    features: ["1 branch", "Up to 5 staff", "Inventory + POS", "Expiry alerts", "Basic analytics"],
    cta: "Start Free Trial", highlighted: false,
  },
  {
    name: "Professional", price: "$79", period: "/month",
    desc: "For growing multi-branch pharmacies",
    features: ["Up to 5 branches", "Unlimited staff", "All Starter features", "Advanced analytics", "Supplier management", "Stock transfers", "Priority support"],
    cta: "Start Free Trial", highlighted: true,
  },
  {
    name: "Enterprise", price: "Custom", period: "",
    desc: "Hospital networks & pharmacy chains",
    features: ["Unlimited branches", "Custom roles & permissions", "API access", "Custom integrations", "Dedicated account manager", "SLA guarantee", "Custom domain"],
    cta: "Contact Sales", highlighted: false,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: "#F4F2FF" }}>
      {/* Nav */}
      <nav className="sticky top-0 z-50" style={{ background: "rgba(244,242,255,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E8E4FF" }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: "linear-gradient(135deg, #2D1B8E, #4A8FE5)" }}>D</div>
            <span className="font-bold text-lg" style={{ color: "#180D62" }}>Dawo<span style={{ color: "#00C897" }}>Link</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: "#6B6B9A" }}>
            <Link href="/features" className="hover:text-[#2D1B8E] transition">Features</Link>
            <Link href="/pricing" className="hover:text-[#2D1B8E] transition">Pricing</Link>
            <Link href="/about" className="hover:text-[#2D1B8E] transition">About</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium px-4 py-2 rounded-xl transition" style={{ color: "#2D1B8E" }}>Sign In</Link>
            <Link href="/login" className="text-sm font-semibold px-4 py-2 rounded-xl text-white transition" style={{ background: "linear-gradient(90deg, #2D1B8E, #3D2AAD)" }}>Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-6">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full opacity-10" style={{ background: "#2D1B8E", filter: "blur(80px)" }} />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full opacity-10" style={{ background: "#00C897", filter: "blur(80px)" }} />
        </div>
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium mb-6" style={{ background: "#E8E4FF", color: "#2D1B8E" }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#00C897" }} />
            Built for Somalia. Designed for Africa.
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight" style={{ color: "#180D62" }}>
            The Connected Operating Network<br />
            <span style={{ color: "#00C897" }}>for Modern Pharmacies</span>
          </h1>
          <p className="text-xl mb-10 max-w-2xl mx-auto" style={{ color: "#6B6B9A" }}>
            Manage inventory, process sales, track expiry, and grow your pharmacy business — all in one platform.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/login" className="px-8 py-4 rounded-xl font-semibold text-white text-lg transition" style={{ background: "linear-gradient(90deg, #2D1B8E, #3D2AAD)" }}>
              Start Free Trial
            </Link>
            <Link href="/features" className="px-8 py-4 rounded-xl font-semibold text-lg border-2 transition" style={{ borderColor: "#2D1B8E", color: "#2D1B8E" }}>
              View Features →
            </Link>
          </div>
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[["120+", "Pharmacies"], ["50K+", "Medicines Tracked"], ["2M+", "Transactions"]].map(([v, l]) => (
              <div key={l} className="text-center">
                <div className="text-3xl font-bold" style={{ color: "#2D1B8E" }}>{v}</div>
                <div className="text-sm mt-1" style={{ color: "#9B9BC0" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3" style={{ color: "#180D62" }}>Everything Your Pharmacy Needs</h2>
            <p className="text-lg" style={{ color: "#6B6B9A" }}>From daily operations to national-scale intelligence</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm" style={{ border: "1px solid #E8E4FF" }}>
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold mb-2" style={{ color: "#180D62" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#6B6B9A" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3" style={{ color: "#180D62" }}>Simple, Transparent Pricing</h2>
            <p className="text-lg" style={{ color: "#6B6B9A" }}>Start free. Scale as you grow.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map(plan => (
              <div key={plan.name} className="rounded-2xl p-7 relative"
                style={plan.highlighted
                  ? { background: "linear-gradient(135deg, #2D1B8E, #3D2AAD)" }
                  : { background: "#F4F2FF", border: "1px solid #E8E4FF" }}>
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1 rounded-full" style={{ background: "#00C897", color: "white" }}>
                    Most Popular
                  </div>
                )}
                <h3 className="font-bold text-lg mb-1" style={plan.highlighted ? { color: "white" } : { color: "#180D62" }}>{plan.name}</h3>
                <p className="text-sm mb-4" style={{ color: plan.highlighted ? "rgba(255,255,255,0.7)" : "#9B9BC0" }}>{plan.desc}</p>
                <div className="flex items-end gap-1 mb-5">
                  <span className="text-4xl font-bold" style={plan.highlighted ? { color: "white" } : { color: "#180D62" }}>{plan.price}</span>
                  <span className="text-sm pb-1" style={{ color: plan.highlighted ? "rgba(255,255,255,0.6)" : "#9B9BC0" }}>{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <span style={{ color: "#00C897" }}>✓</span>
                      <span style={plan.highlighted ? { color: "rgba(255,255,255,0.85)" } : { color: "#374151" }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/login" className="block text-center py-3 rounded-xl font-semibold text-sm text-white"
                  style={plan.highlighted ? { background: "#00C897" } : { background: "#2D1B8E" }}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-24 px-6" style={{ background: "linear-gradient(135deg, #180D62 0%, #2D1B8E 60%, #1A3A6E 100%)" }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Transform Your Pharmacy?</h2>
          <p className="text-xl mb-8" style={{ color: "rgba(255,255,255,0.7)" }}>Join 120+ pharmacies already using DawoLink</p>
          <Link href="/login" className="inline-block px-10 py-4 rounded-xl font-bold text-white text-lg" style={{ background: "linear-gradient(90deg, #00C897, #009E78)" }}>
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-white" style={{ borderTop: "1px solid #E8E4FF" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ background: "linear-gradient(135deg, #2D1B8E, #4A8FE5)" }}>D</div>
            <span className="font-bold" style={{ color: "#180D62" }}>Dawo<span style={{ color: "#00C897" }}>Link</span></span>
          </div>
          <div className="flex gap-6 text-sm" style={{ color: "#9B9BC0" }}>
            <Link href="/features">Features</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/about">About</Link>
            <Link href="/login">Login</Link>
          </div>
          <p className="text-sm" style={{ color: "#C4BBFF" }}>© 2026 DawoLink. Built for Somalia.</p>
        </div>
      </footer>
    </div>
  );
}
