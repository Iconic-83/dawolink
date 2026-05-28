import Link from "next/link";

const PLANS = [
  {
    name: "Starter", price: "$29", period: "/month", color: "#2D1B8E",
    desc: "For independent single-location pharmacies",
    features: [
      "1 branch", "Up to 5 staff accounts", "Full POS system",
      "Inventory management", "Expiry tracking", "Basic analytics",
      "Email support",
    ],
    notIncluded: ["Multi-branch", "Stock transfers", "Advanced analytics", "API access"],
  },
  {
    name: "Professional", price: "$79", period: "/month", color: "#2D1B8E", popular: true,
    desc: "For pharmacy groups & multi-branch operations",
    features: [
      "Up to 5 branches", "Unlimited staff accounts", "Everything in Starter",
      "Multi-branch stock transfers", "Branch performance analytics",
      "Supplier & procurement module", "Custom roles & permissions",
      "Priority support (24h response)",
    ],
    notIncluded: ["Unlimited branches", "API access", "Custom integrations"],
  },
  {
    name: "Enterprise", price: "Custom", period: "", color: "#180D62",
    desc: "For hospital networks, pharmacy chains & government",
    features: [
      "Unlimited branches", "Unlimited staff", "Everything in Professional",
      "REST API access", "Custom integrations (ERP, HMIS)",
      "Dedicated account manager", "Custom domain (yourpharmacy.dawolink.so)",
      "99.9% SLA uptime guarantee", "Onboarding & training",
    ],
    notIncluded: [],
  },
];

const FAQ = [
  { q: "Is there a free trial?", a: "Yes. Starter and Professional plans include a 14-day free trial. No credit card required." },
  { q: "Can I switch plans later?", a: "Absolutely. You can upgrade or downgrade at any time from your account settings." },
  { q: "Do you support Somali Shilling?", a: "Yes. You can configure your currency, and the POS supports EVC Plus, Zaad, Sahal, and cash." },
  { q: "Is my data private?", a: "Yes. Each pharmacy has completely isolated data. No pharmacy can see another's information." },
  { q: "Can I add more branches later?", a: "Yes. You can add branches anytime. If you exceed your plan limit, we'll prompt you to upgrade." },
];

export default function PricingPage() {
  return (
    <div style={{ background: "#F4F2FF", minHeight: "100vh" }}>
      <nav className="sticky top-0 z-50" style={{ background: "rgba(244,242,255,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E8E4FF" }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: "linear-gradient(135deg, #2D1B8E, #4A8FE5)" }}>D</div>
            <span className="font-bold text-lg" style={{ color: "#180D62" }}>Dawo<span style={{ color: "#00C897" }}>Link</span></span>
          </Link>
          <Link href="/login" className="text-sm font-semibold px-4 py-2 rounded-xl text-white" style={{ background: "linear-gradient(90deg, #2D1B8E, #3D2AAD)" }}>Get Started</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4" style={{ color: "#180D62" }}>Pricing</h1>
          <p className="text-xl" style={{ color: "#6B6B9A" }}>Start free. No credit card required. Cancel anytime.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {PLANS.map(plan => (
            <div key={plan.name} className="rounded-2xl p-7 relative"
              style={plan.popular
                ? { background: "linear-gradient(135deg, #2D1B8E, #3D2AAD)" }
                : { background: "white", border: "1px solid #E8E4FF" }}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1 rounded-full" style={{ background: "#00C897", color: "white" }}>
                  Most Popular
                </div>
              )}
              <h3 className="font-bold text-xl mb-1" style={plan.popular ? { color: "white" } : { color: "#180D62" }}>{plan.name}</h3>
              <p className="text-sm mb-5" style={{ color: plan.popular ? "rgba(255,255,255,0.65)" : "#9B9BC0" }}>{plan.desc}</p>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-4xl font-bold" style={plan.popular ? { color: "white" } : { color: "#180D62" }}>{plan.price}</span>
                <span className="text-sm pb-1" style={{ color: plan.popular ? "rgba(255,255,255,0.55)" : "#9B9BC0" }}>{plan.period}</span>
              </div>
              <ul className="space-y-2.5 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <span style={{ color: "#00C897" }}>✓</span>
                    <span style={plan.popular ? { color: "rgba(255,255,255,0.85)" } : { color: "#374151" }}>{f}</span>
                  </li>
                ))}
                {plan.notIncluded.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm opacity-40">
                    <span>✕</span>
                    <span style={plan.popular ? { color: "white" } : { color: "#374151" }}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/login" className="block text-center py-3 rounded-xl font-semibold text-sm text-white"
                style={plan.popular ? { background: "#00C897" } : { background: "#2D1B8E" }}>
                {plan.price === "Custom" ? "Contact Sales" : "Start Free Trial"}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8" style={{ color: "#180D62" }}>Frequently Asked Questions</h2>
          <div className="space-y-4">
            {FAQ.map(item => (
              <div key={item.q} className="bg-white rounded-xl p-5" style={{ border: "1px solid #E8E4FF" }}>
                <h4 className="font-semibold mb-2" style={{ color: "#180D62" }}>{item.q}</h4>
                <p className="text-sm" style={{ color: "#6B6B9A" }}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
