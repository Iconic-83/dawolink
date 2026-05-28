import Link from "next/link";

const MODULES = [
  {
    title: "Smart POS", icon: "💳", color: "#00C897",
    desc: "The fastest pharmacy checkout experience in Somalia.",
    points: ["Barcode & manual medicine search", "EVC Plus, Zaad, Sahal, Cash payments", "Instant receipt printing", "Customer balance & credit tracking", "Return & refund processing"],
  },
  {
    title: "Inventory Management", icon: "📦", color: "#2D1B8E",
    desc: "Full visibility into every medicine, every branch.",
    points: ["Real-time stock levels", "Low stock automatic alerts", "Batch & expiry tracking", "Stock adjustments with audit log", "Multi-branch stock view"],
  },
  {
    title: "Expiry Intelligence", icon: "⏰", color: "#F59E0B",
    desc: "Never sell expired medicine again.",
    points: ["30/15/7 day expiry warnings", "Color-coded urgency levels", "Bulk expiry reporting", "Supplier return tracking", "Expiry cost analysis"],
  },
  {
    title: "Analytics & Reports", icon: "📊", color: "#4A8FE5",
    desc: "Know your business numbers at a glance.",
    points: ["Revenue trend charts", "Top-selling medicines", "Branch performance comparison", "Payment method breakdown", "Export to PDF/Excel"],
  },
  {
    title: "Supplier & Procurement", icon: "🤝", color: "#EC4899",
    desc: "Streamline your entire supply chain.",
    points: ["Supplier database & ratings", "Purchase order management", "Delivery tracking", "Invoice matching", "Reorder automation"],
  },
  {
    title: "Multi-Branch Control", icon: "🏪", color: "#8B5CF6",
    desc: "One account. Unlimited branches.",
    points: ["Centralized branch management", "Inter-branch stock transfers", "Branch-level access control", "Consolidated reporting", "Branch performance comparison"],
  },
  {
    title: "Roles & Permissions", icon: "🛡️", color: "#10B981",
    desc: "Enterprise-grade access control.",
    points: ["7 built-in roles (Owner → Cashier)", "Custom role creation", "26 granular permissions", "Branch-scoped access", "Activity audit log"],
  },
  {
    title: "Global Medicine Database", icon: "🌍", color: "#F97316",
    desc: "Powered by Somalia's national medicine catalog.",
    points: ["10,000+ medicines pre-loaded", "WHO ATC classification", "Drug interaction warnings", "Counterfeit flagging", "One-click import to pharmacy"],
  },
];

export default function FeaturesPage() {
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

      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4" style={{ color: "#180D62" }}>Platform Features</h1>
          <p className="text-xl" style={{ color: "#6B6B9A" }}>Every tool your pharmacy needs to operate at full capacity</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {MODULES.map(m => (
            <div key={m.title} className="bg-white rounded-2xl p-7 shadow-sm" style={{ border: "1px solid #E8E4FF" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: `${m.color}18` }}>{m.icon}</div>
                <div>
                  <h3 className="font-bold text-lg" style={{ color: "#180D62" }}>{m.title}</h3>
                  <p className="text-sm" style={{ color: "#9B9BC0" }}>{m.desc}</p>
                </div>
              </div>
              <ul className="space-y-2">
                {m.points.map(p => (
                  <li key={p} className="flex items-center gap-2 text-sm" style={{ color: "#374151" }}>
                    <span style={{ color: m.color }}>✓</span> {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <Link href="/login" className="inline-block px-10 py-4 rounded-xl font-bold text-white text-lg" style={{ background: "linear-gradient(90deg, #2D1B8E, #3D2AAD)" }}>
            Start Your Free Trial
          </Link>
        </div>
      </div>
    </div>
  );
}
