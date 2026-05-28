import Link from "next/link";

const MODULES = [
  { title: "Smart POS", icon: "💳", color: "#00C897", desc: "The fastest pharmacy checkout in Somalia.", points: ["Barcode & manual medicine search", "EVC Plus, Zaad, Sahal, Cash payments", "Instant receipt printing", "Customer balance tracking", "Return & refund processing"] },
  { title: "Inventory Management", icon: "📦", color: "#2D1B8E", desc: "Full visibility into every medicine, every branch.", points: ["Real-time stock levels", "Low stock automatic alerts", "Batch & expiry tracking", "Stock adjustments with audit log", "Multi-branch stock view"] },
  { title: "Expiry Intelligence", icon: "⏰", color: "#F59E0B", desc: "Never sell expired medicine again.", points: ["30/15/7 day expiry warnings", "Color-coded urgency levels", "Bulk expiry reporting", "Supplier return tracking", "Expiry cost analysis"] },
  { title: "Analytics & Reports", icon: "📊", color: "#4A8FE5", desc: "Know your business numbers at a glance.", points: ["Revenue trend charts", "Top-selling medicines", "Branch performance comparison", "Payment method breakdown", "Export to PDF/Excel"] },
  { title: "Supplier & Procurement", icon: "🤝", color: "#EC4899", desc: "Streamline your entire supply chain.", points: ["Supplier database & ratings", "Purchase order management", "Delivery tracking", "Invoice matching", "Reorder automation"] },
  { title: "Multi-Branch Control", icon: "🏪", color: "#8B5CF6", desc: "One account. Unlimited branches.", points: ["Centralized branch management", "Inter-branch stock transfers", "Branch-level access control", "Consolidated reporting", "Branch performance comparison"] },
  { title: "Roles & Permissions", icon: "🛡️", color: "#10B981", desc: "Enterprise-grade access control.", points: ["7 built-in roles (Owner → Cashier)", "Custom role creation", "26 granular permissions", "Branch-scoped access", "Activity audit log"] },
  { title: "Global Medicine Database", icon: "🌍", color: "#F97316", desc: "Powered by Somalia's national medicine catalog.", points: ["10,000+ medicines pre-loaded", "WHO ATC classification", "Drug interaction warnings", "Counterfeit flagging", "One-click import to pharmacy"] },
];

export default function FeaturesPage() {
  return (
    <div style={{ background: "#F4F2FF", minHeight: "100vh" }}>
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(244,242,255,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E8E4FF" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 60, display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#2D1B8E,#4A8FE5)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 16 }}>D</div>
            <span style={{ fontWeight: 800, fontSize: 18, color: "#180D62" }}>Dawo<span style={{ color: "#00C897" }}>Link</span></span>
          </Link>
          <div style={{ display: "flex", gap: 32, fontSize: 14, fontWeight: 500 }}>
            <Link href="/features" style={{ color: "#2D1B8E", textDecoration: "none", fontWeight: 700 }}>Features</Link>
            <Link href="/pricing" style={{ color: "#6B6B9A", textDecoration: "none" }}>Pricing</Link>
            <Link href="/about" style={{ color: "#6B6B9A", textDecoration: "none" }}>About</Link>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Link href="/login" style={{ fontSize: 14, fontWeight: 600, padding: "7px 18px", borderRadius: 10, color: "white", background: "linear-gradient(90deg,#2D1B8E,#3D2AAD)", textDecoration: "none" }}>Get Started</Link>
          </div>
        </div>
      </nav>

      <div style={{ textAlign: "center", padding: "64px 24px 48px" }}>
        <h1 style={{ fontSize: 42, fontWeight: 800, color: "#180D62", margin: "0 0 12px" }}>Platform Features</h1>
        <p style={{ fontSize: 18, color: "#6B6B9A" }}>Every tool your pharmacy needs to operate at full capacity</p>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 80px", display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 20 }}>
        {MODULES.map(m => (
          <div key={m.title} style={{ background: "white", borderRadius: 20, padding: "28px", border: "1px solid #E8E4FF" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, background: `${m.color}14`, flexShrink: 0 }}>{m.icon}</div>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: 17, color: "#180D62", margin: "0 0 3px" }}>{m.title}</h3>
                <p style={{ fontSize: 13, color: "#9B9BC0", margin: 0 }}>{m.desc}</p>
              </div>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {m.points.map(p => (
                <li key={p} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: "#374151" }}>
                  <span style={{ color: m.color, fontWeight: 700, flexShrink: 0 }}>✓</span> {p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", paddingBottom: 80 }}>
        <Link href="/login" style={{ display: "inline-block", padding: "16px 40px", borderRadius: 14, fontWeight: 700, color: "white", fontSize: 17, background: "linear-gradient(90deg,#2D1B8E,#3D2AAD)", textDecoration: "none" }}>
          Start Your Free Trial
        </Link>
      </div>

      <footer style={{ padding: "28px 24px", background: "white", borderTop: "1px solid #E8E4FF" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontWeight: 700, color: "#180D62", fontSize: 15 }}>Dawo<span style={{ color: "#00C897" }}>Link</span></span>
          <div style={{ display: "flex", gap: 20, fontSize: 13 }}>
            {[["Pricing","/pricing"],["About","/about"],["Login","/login"]].map(([l,h]) => (
              <Link key={l} href={h} style={{ color: "#9B9BC0", textDecoration: "none" }}>{l}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
