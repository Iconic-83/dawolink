import Link from "next/link";

const NAV = [["Features", "/features"], ["Pricing", "/pricing"], ["About", "/about"]];

const CATEGORIES = [
  { icon: "⚙️", label: "Operations" },
  { icon: "🤖", label: "AI & Automation" },
  { icon: "📊", label: "Analytics" },
  { icon: "🏪", label: "Multi-Branch" },
  { icon: "🚚", label: "Delivery" },
  { icon: "🛡️", label: "Security" },
  { icon: "📱", label: "Mobile" },
];

function SectionBadge({ children, color, bg }: { children: string; color: string; bg: string }) {
  return (
    <div style={{ display: "inline-block", background: bg, color, fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 6, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 16 }}>
      {children}
    </div>
  );
}

function Check({ children, color = "#00C897" }: { children: string; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
      <span style={{ color, fontWeight: 800, fontSize: 13, marginTop: 2, flexShrink: 0 }}>✓</span>
      <span style={{ fontSize: 14, color: "#374151", lineHeight: 1.6 }}>{children}</span>
    </div>
  );
}

export default function FeaturesPage() {
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
              <Link key={href} href={href} style={{ color: href === "/features" ? "#2D1B8E" : "#6B6B9A", textDecoration: "none", fontWeight: href === "/features" ? 700 : 500 }}>{label}</Link>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end" }}>
            <Link href="/login" style={{ padding: "8px 18px", borderRadius: 10, fontSize: 14, fontWeight: 500, color: "#2D1B8E", textDecoration: "none" }}>Sign In</Link>
            <Link href="/login" style={{ padding: "9px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700, color: "white", background: "linear-gradient(90deg,#2D1B8E,#3D2AAD)", textDecoration: "none" }}>Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ background: "linear-gradient(150deg,#0d0825 0%,#180D62 50%,#1a2a5e 100%)", padding: "90px 24px 80px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -80, left: "15%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,200,151,0.07) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -80, right: "10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(74,143,229,0.07) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 760, margin: "0 auto", position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,200,151,0.12)", border: "1px solid rgba(0,200,151,0.25)", borderRadius: 999, padding: "6px 16px", fontSize: 12, fontWeight: 600, color: "#00C897", marginBottom: 28 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00C897", display: "inline-block" }} />
            Complete Pharmacy Platform
          </div>
          <h1 style={{ fontSize: "clamp(32px,4.5vw,52px)", fontWeight: 800, color: "white", margin: "0 0 20px", lineHeight: 1.15 }}>
            Everything Modern Pharmacies Need —{" "}
            <span style={{ background: "linear-gradient(135deg,#00C897,#4A8FE5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              In One Intelligent Platform
            </span>
          </h1>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.6)", lineHeight: 1.75, margin: "0 auto 36px", maxWidth: 620 }}>
            DawoLink combines inventory management, POS, AI automation, analytics, supplier management, delivery systems, and national medicine intelligence into one connected platform built for Somalia.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/login" style={{ padding: "14px 30px", borderRadius: 12, fontWeight: 700, color: "white", background: "linear-gradient(90deg,#00C897,#009E78)", fontSize: 15, textDecoration: "none", boxShadow: "0 8px 24px rgba(0,200,151,0.3)" }}>
              Start Free Trial
            </Link>
            <Link href="/about" style={{ padding: "14px 30px", borderRadius: 12, fontWeight: 700, fontSize: 15, color: "white", border: "1px solid rgba(255,255,255,0.2)", textDecoration: "none", background: "rgba(255,255,255,0.06)" }}>
              Book Demo →
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section style={{ background: "white", borderBottom: "1px solid #E8E4FF", padding: "20px 24px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
          {CATEGORIES.map(c => (
            <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 18px", borderRadius: 10, border: "1px solid #E8E4FF", background: "#FAFAFA", fontSize: 13, fontWeight: 500, color: "#374151" }}>
              <span>{c.icon}</span> {c.label}
            </div>
          ))}
        </div>
      </section>

      {/* Smart Inventory */}
      <section style={{ padding: "80px 24px", background: "#F4F2FF" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          <div>
            <SectionBadge bg="#E8E4FF" color="#2D1B8E">Operations</SectionBadge>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: "#180D62", margin: "0 0 16px", lineHeight: 1.2 }}>Smart Inventory Management</h2>
            <p style={{ fontSize: 16, color: "#6B6B9A", lineHeight: 1.75, marginBottom: 28 }}>
              Full visibility into every medicine across every branch. Real-time tracking with AI-powered intelligence to prevent stockouts and eliminate waste permanently.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
              {["Real-time stock levels", "Barcode & QR scanning", "Expiry date tracking", "Batch management", "Low-stock auto-alerts", "Supplier linking", "Stock transfers", "Full audit log"].map(f => <Check key={f}>{f}</Check>)}
            </div>
            <div style={{ background: "white", borderRadius: 14, padding: "16px 20px", border: "1px solid #E8E4FF" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#8B5CF6", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <span>🤖</span> AI Smart Features
              </div>
              {["Predicts shortages before they happen", "Identifies fast-selling medicines by season", "Flags overstock and slow-moving inventory", "Auto-generates supplier reorder recommendations"].map(f => (
                <div key={f} style={{ display: "flex", gap: 8, marginBottom: 7 }}>
                  <span style={{ color: "#8B5CF6", fontWeight: 800, fontSize: 12, marginTop: 2 }}>✦</span>
                  <span style={{ fontSize: 13, color: "#374151" }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Inventory Mockup */}
          <div style={{ background: "linear-gradient(160deg,#1a1040,#0d0825)", borderRadius: 20, padding: 24, border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 32px 64px rgba(0,0,0,0.4)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>📦 Inventory Dashboard</span>
              <span style={{ fontSize: 11, color: "#00C897", background: "rgba(0,200,151,0.1)", padding: "3px 10px", borderRadius: 6, fontWeight: 600 }}>Live</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
              {[{ l: "Total SKUs", v: "1,247" }, { l: "Low Stock", v: "18" }, { l: "Expiring Soon", v: "34" }].map(s => (
                <div key={s.l} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 4 }}>{s.l}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "white" }}>{s.v}</div>
                </div>
              ))}
            </div>
            <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", background: "rgba(255,255,255,0.04)", padding: "8px 12px" }}>
                {["Medicine", "Stock", "Expiry", "Status"].map(h => (
                  <span key={h} style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{h}</span>
                ))}
              </div>
              {[
                { name: "Amoxicillin 500mg", stock: "240", exp: "Aug 2026", status: "good", color: "#00C897" },
                { name: "Paracetamol 500mg", stock: "18", exp: "Mar 2026", status: "low", color: "#F59E0B" },
                { name: "Metformin 850mg", stock: "5", exp: "Jan 2026", status: "critical", color: "#EF4444" },
                { name: "Omeprazole 20mg", stock: "95", exp: "Jul 2026", status: "good", color: "#00C897" },
                { name: "Ibuprofen 400mg", stock: "62", exp: "Feb 2026", status: "warn", color: "#F59E0B" },
              ].map((r, i) => (
                <div key={r.name} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "9px 12px", background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.75)" }}>{r.name}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{r.stock}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{r.exp}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: r.color, display: "inline-block" }} />
                    <span style={{ fontSize: 10, color: r.color, fontWeight: 600 }}>{r.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* POS */}
      <section style={{ padding: "80px 24px", background: "white" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          {/* POS Mockup */}
          <div style={{ background: "linear-gradient(160deg,#1a1040,#0d0825)", borderRadius: 20, padding: 24, border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 32px 64px rgba(0,0,0,0.4)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>💳 Point of Sale</span>
              <span style={{ fontSize: 11, color: "#00C897" }}>Transaction #0841</span>
            </div>
            {[
              { name: "Amoxicillin 500mg × 2", price: "$4.80" },
              { name: "Paracetamol 500mg × 1", price: "$1.20" },
              { name: "Vitamin C 1000mg × 3", price: "$6.00" },
            ].map(item => (
              <div key={item.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{item.name}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "white" }}>{item.price}</span>
              </div>
            ))}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "12px 0 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Subtotal</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>$12.00</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "white" }}>Total</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: "#00C897" }}>$12.00</span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              {[
                { name: "EVC Plus", color: "#E31837", active: true },
                { name: "Zaad", color: "#009A44", active: false },
                { name: "Sahal", color: "#0066CC", active: false },
                { name: "Cash", color: "#6B7280", active: false },
              ].map(p => (
                <div key={p.name} style={{ padding: "10px", borderRadius: 10, background: p.active ? `${p.color}22` : "rgba(255,255,255,0.04)", border: `1px solid ${p.active ? p.color + "55" : "rgba(255,255,255,0.06)"}`, textAlign: "center" as const }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: p.active ? p.color : "rgba(255,255,255,0.4)" }}>{p.name}</span>
                </div>
              ))}
            </div>
            <div style={{ background: "linear-gradient(90deg,#00C897,#009E78)", borderRadius: 10, padding: "12px", textAlign: "center" as const }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "white" }}>Complete Sale — $12.00</span>
            </div>
          </div>

          <div>
            <SectionBadge bg="#D1FAE5" color="#059669">Point of Sale</SectionBadge>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: "#180D62", margin: "0 0 16px", lineHeight: 1.2 }}>Ultra-Fast Pharmacy Checkout</h2>
            <p style={{ fontSize: 16, color: "#6B6B9A", lineHeight: 1.75, marginBottom: 28 }}>
              The fastest pharmacy POS in Somalia. Built for speed, accuracy, and seamless mobile money integration at every counter.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 28 }}>
              {["Ultra-fast medicine search", "Invoice generation", "Receipt printing", "Customer history", "Discount & promotion handling", "Debt & credit tracking", "Returns & refunds", "Works offline"].map(f => <Check key={f}>{f}</Check>)}
            </div>
            <div style={{ background: "#F4F2FF", borderRadius: 14, padding: "16px 20px", border: "1px solid #E8E4FF" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#2D1B8E", marginBottom: 12 }}>Accepted Payments</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {[
                  { name: "EVC Plus", color: "#E31837" },
                  { name: "Zaad", color: "#009A44" },
                  { name: "Sahal", color: "#0066CC" },
                  { name: "Premier Wallet", color: "#8B5CF6" },
                  { name: "Cash", color: "#6B7280" },
                ].map(p => (
                  <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: `1px solid ${p.color}33`, background: `${p.color}11` }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: p.color, display: "inline-block" }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Assistant */}
      <section style={{ padding: "80px 24px", background: "linear-gradient(150deg,#0d0825,#180D62)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          <div>
            <SectionBadge bg="rgba(139,92,246,0.2)" color="#A78BFA">AI & Automation</SectionBadge>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: "white", margin: "0 0 14px", lineHeight: 1.2 }}>AI Pharmacy Assistant</h2>
            <div style={{ background: "rgba(0,200,151,0.1)", border: "1px solid rgba(0,200,151,0.25)", borderRadius: 10, padding: "10px 16px", marginBottom: 20, display: "inline-block" }}>
              <span style={{ fontSize: 13, color: "#00C897", fontWeight: 600 }}>AI assists pharmacists — it never replaces them.</span>
            </div>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", lineHeight: 1.75, marginBottom: 28 }}>
              DawoLink&apos;s AI works alongside your pharmacists — catching what humans miss and automating what humans shouldn&apos;t have to do manually.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { icon: "📋", title: "Prescription OCR Scanning", desc: "Scan handwritten prescriptions instantly. Medicines auto-populated at checkout." },
                { icon: "💊", title: "Drug Interaction Detection", desc: "Instant safety warnings before dispensing conflicting medicines to patients." },
                { icon: "🔮", title: "Demand Forecasting", desc: "Predicts which medicines will run out weeks in advance based on sales patterns." },
                { icon: "🔄", title: "Smart Reorder Automation", desc: "Auto-generates purchase orders based on consumption trends." },
                { icon: "💡", title: "Alternative Recommendations", desc: "Suggests available alternatives when a medicine is out of stock." },
              ].map(a => (
                <div key={a.title} style={{ display: "flex", gap: 14, alignItems: "flex-start", background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "14px 16px", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{a.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "white", marginBottom: 3 }}>{a.title}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{a.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Chat Mockup */}
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 20, padding: 24, border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#8B5CF6,#6D28D9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🤖</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>DawoLink AI</div>
                <div style={{ fontSize: 11, color: "#00C897" }}>● Active</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "12px 12px 12px 2px", padding: "12px 14px", maxWidth: "90%" }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>⚠️ Amoxicillin 500mg is at 18 units. Based on 32 units/day average, you will stock out in 4 days. Reorder now?</span>
              </div>
              <div style={{ background: "linear-gradient(90deg,#2D1B8E,#3D2AAD)", borderRadius: "12px 12px 2px 12px", padding: "12px 14px", maxWidth: "80%", alignSelf: "flex-end" }}>
                <span style={{ fontSize: 12, color: "white" }}>Yes, generate purchase order.</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "12px 12px 12px 2px", padding: "12px 14px", maxWidth: "90%" }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>✓ PO created for 500 units from MedSupply Somalia. Expected delivery in 2 days.</span>
              </div>
              <div style={{ background: "rgba(0,200,151,0.08)", border: "1px solid rgba(0,200,151,0.2)", borderRadius: "12px 12px 12px 2px", padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: "#00C897", fontWeight: 700, marginBottom: 4 }}>Drug Interaction Alert</div>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>Warfarin + Ibuprofen detected on prescription. Known interaction. Recommend Paracetamol as alternative.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Expiry Intelligence */}
      <section style={{ padding: "80px 24px", background: "white" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          <div>
            <SectionBadge bg="#FEF3C7" color="#D97706">Expiry Intelligence</SectionBadge>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: "#180D62", margin: "0 0 16px", lineHeight: 1.2 }}>Never Sell Expired Medicine Again</h2>
            <p style={{ fontSize: 16, color: "#6B6B9A", lineHeight: 1.75, marginBottom: 28 }}>
              Somali pharmacies lose thousands monthly to expired stock. DawoLink&apos;s expiry intelligence eliminates these losses with predictive alerts and automated action plans.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
              {["30/15/7 day expiry warnings", "Color-coded urgency system", "Bulk expiry reporting", "Unsold inventory detection", "Supplier return tracking", "Dangerous stock warnings", "Expiry cost analysis", "Auto-discount triggers"].map(f => <Check key={f} color="#D97706">{f}</Check>)}
            </div>
            <div style={{ background: "#FEF3C7", borderRadius: 14, padding: "16px 20px", border: "1px solid #FDE68A" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#D97706", marginBottom: 10 }}>🤖 AI Recommendations</div>
              {["Transfer to high-demand branch before expiry", "Apply automatic discount to move stock faster", "Initiate supplier return for unsellable stock", "Run targeted promotion for slow-moving items"].map(r => (
                <div key={r} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <span style={{ color: "#D97706", fontWeight: 800, fontSize: 12 }}>→</span>
                  <span style={{ fontSize: 13, color: "#92400E" }}>{r}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#F4F2FF", borderRadius: 20, padding: "24px", border: "1px solid #E8E4FF" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#9B9BC0", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 14 }}>Expiry Alerts Dashboard</div>
            {[
              { name: "Metformin 850mg", days: 7, units: "45 units", level: "critical", color: "#EF4444", bg: "#FEE2E2" },
              { name: "Insulin Glargine", days: 14, units: "12 units", level: "danger", color: "#F97316", bg: "#FED7AA" },
              { name: "Amoxicillin Syrup", days: 22, units: "88 units", level: "warning", color: "#F59E0B", bg: "#FEF3C7" },
              { name: "Vitamin B12 Inj.", days: 28, units: "30 units", level: "watch", color: "#3B82F6", bg: "#DBEAFE" },
              { name: "Paracetamol Drops", days: 42, units: "156 units", level: "normal", color: "#00C897", bg: "#D1FAE5" },
            ].map(item => (
              <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: item.bg, borderRadius: 10, marginBottom: 8, border: `1px solid ${item.color}22` }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${item.color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: item.color }}>{item.days}d</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#180D62" }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: "#6B6B9A" }}>{item.units} remaining</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: item.color, background: `${item.color}18`, padding: "3px 8px", borderRadius: 5, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{item.level}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Multi-Branch + Analytics */}
      <section style={{ padding: "80px 24px", background: "#F4F2FF" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div style={{ background: "white", borderRadius: 24, padding: "40px", border: "1px solid #E8E4FF" }}>
            <SectionBadge bg="#EDE9FE" color="#7C3AED">Multi-Branch</SectionBadge>
            <h3 style={{ fontSize: 26, fontWeight: 800, color: "#180D62", margin: "0 0 14px" }}>One Account. All Branches. Full Control.</h3>
            <p style={{ fontSize: 14, color: "#6B6B9A", lineHeight: 1.75, marginBottom: 24 }}>Manage unlimited pharmacy branches from a single intelligent dashboard. Unified inventory, reporting, and team management across your entire network.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {["Centralized branch management", "Real-time inter-branch stock transfers", "Branch-level access control", "Consolidated financial reporting", "Employee monitoring per branch", "Branch performance comparison"].map(f => <Check key={f} color="#7C3AED">{f}</Check>)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
              {[["Mogadishu", "48 sales", "#00C897"], ["Hargeisa", "31 sales", "#00C897"], ["Kismayo", "12 sales", "#F59E0B"]].map(([b, s, c]) => (
                <div key={b} style={{ background: "#F4F2FF", borderRadius: 10, padding: "12px", textAlign: "center" as const, border: "1px solid #E8E4FF" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: c, margin: "0 auto 6px" }} />
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#180D62" }}>{b}</div>
                  <div style={{ fontSize: 11, color: "#9B9BC0" }}>{s}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "linear-gradient(150deg,#180D62,#2D1B8E)", borderRadius: 24, padding: "40px" }}>
            <SectionBadge bg="rgba(74,143,229,0.2)" color="#93C5FD">Analytics & BI</SectionBadge>
            <h3 style={{ fontSize: 26, fontWeight: 800, color: "white", margin: "0 0 14px" }}>Business Intelligence That Drives Growth</h3>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.75, marginBottom: 24 }}>Real-time analytics that turn your pharmacy data into decisions. Know what&apos;s selling, what&apos;s not, and what&apos;s coming next.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {["Sales forecasting & trends", "Medicine demand analytics", "Supplier performance scores", "Employee performance tracking", "Profit & margin analysis", "Regional branch comparison"].map(f => (
                <div key={f} style={{ display: "flex", gap: 10 }}>
                  <span style={{ color: "#4A8FE5", fontWeight: 800, fontSize: 13 }}>✓</span>
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.75)" }}>{f}</span>
                </div>
              ))}
            </div>
            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Revenue — This Month</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 48 }}>
                {[40, 55, 35, 70, 60, 85, 65, 90, 75, 95, 80, 100].map((h, i) => (
                  <div key={i} style={{ flex: 1, height: `${h}%`, background: i === 11 ? "linear-gradient(180deg,#00C897,#009E78)" : "rgba(0,200,151,0.2)", borderRadius: "2px 2px 0 0" }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Delivery */}
      <section style={{ padding: "80px 24px", background: "white" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          <div>
            <SectionBadge bg="#D1FAE5" color="#059669">Delivery & Orders</SectionBadge>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: "#180D62", margin: "0 0 16px", lineHeight: 1.2 }}>Online Medicine Orders & Delivery</h2>
            <p style={{ fontSize: 16, color: "#6B6B9A", lineHeight: 1.75, marginBottom: 28 }}>
              Expand beyond the counter. Accept online medicine orders, manage deliveries, and reach patients anywhere in the city.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 28 }}>
              {["Online medicine ordering", "Prescription uploads", "Delivery tracking", "Nearby pharmacy matching", "Customer notifications", "OTP delivery verification", "Route optimization", "Driver management"].map(f => <Check key={f} color="#059669">{f}</Check>)}
            </div>
          </div>

          <div style={{ background: "linear-gradient(160deg,#1a1040,#0d0825)", borderRadius: 20, padding: 24, border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 16 }}>🚚 Active Deliveries</div>
            {[
              { customer: "Fatima Ahmed", medicine: "Amoxicillin + Vitamins", status: "On the way", pct: 65, color: "#00C897" },
              { customer: "Mohamed Abdi", medicine: "Insulin Glargine", status: "Preparing", pct: 20, color: "#F59E0B" },
              { customer: "Halima Omar", medicine: "Blood pressure meds", status: "Delivered", pct: 100, color: "#4A8FE5" },
            ].map(d => (
              <div key={d.customer} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "14px", marginBottom: 10, border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "white" }}>{d.customer}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{d.medicine}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: d.color }}>{d.status}</span>
                </div>
                <div style={{ height: 3, borderRadius: 99, background: "rgba(255,255,255,0.06)" }}>
                  <div style={{ height: "100%", width: `${d.pct}%`, borderRadius: 99, background: d.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* National Medicine Network */}
      <section style={{ padding: "80px 24px", background: "linear-gradient(150deg,#0d0825,#180D62)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", textAlign: "center" }}>
          <SectionBadge bg="rgba(0,200,151,0.15)" color="#00C897">National Infrastructure</SectionBadge>
          <h2 style={{ fontSize: 42, fontWeight: 800, color: "white", margin: "0 0 20px", lineHeight: 1.2 }}>Somalia&apos;s National Medicine Network</h2>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.6)", maxWidth: 620, margin: "0 auto 56px", lineHeight: 1.75 }}>
            Every connected pharmacy contributes to a shared intelligence layer. DawoLink is not just software — it is the infrastructure that powers Somalia&apos;s medicine ecosystem.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
            {[
              { icon: "💊", title: "Medicine Availability", desc: "Real-time map of what medicines are available at which pharmacy nationwide.", color: "#00C897" },
              { icon: "📈", title: "Pricing Intelligence", desc: "Network-wide price tracking helps pharmacies stay competitive and fair.", color: "#4A8FE5" },
              { icon: "🔔", title: "Shortage Alerts", desc: "National shortage warnings before they reach individual pharmacies.", color: "#F59E0B" },
              { icon: "🛡️", title: "Counterfeit Detection", desc: "Community-flagged medicines removed from the network instantly.", color: "#EF4444" },
            ].map(n => (
              <div key={n.title} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 20, padding: "28px 22px", border: "1px solid rgba(255,255,255,0.07)", textAlign: "center" as const }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: `${n.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 16px" }}>{n.icon}</div>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: "white", marginBottom: 10 }}>{n.title}</h4>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.65, margin: 0 }}>{n.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles + Offline + Security */}
      <section style={{ padding: "80px 24px", background: "#F4F2FF" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
          <div style={{ background: "white", borderRadius: 24, padding: "32px", border: "1px solid #E8E4FF" }}>
            <span style={{ fontSize: 28, display: "block", marginBottom: 14 }}>🛡️</span>
            <SectionBadge bg="#EDE9FE" color="#7C3AED">Access Control</SectionBadge>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: "#180D62", margin: "0 0 12px" }}>Roles & Permissions</h3>
            <p style={{ fontSize: 13, color: "#6B6B9A", lineHeight: 1.7, marginBottom: 20 }}>26 granular permissions across 9 modules. Define exactly what every employee can access.</p>
            {[
              { role: "Pharmacy Owner", access: "Full access", color: "#2D1B8E" },
              { role: "Pharmacist", access: "Inventory + POS", color: "#4A8FE5" },
              { role: "Cashier", access: "POS only", color: "#00C897" },
              { role: "Inventory Manager", access: "Stock + Suppliers", color: "#F59E0B" },
              { role: "Delivery Driver", access: "Delivery module", color: "#10B981" },
            ].map(r => (
              <div key={r.role} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#F4F2FF", borderRadius: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{r.role}</span>
                <span style={{ fontSize: 11, color: r.color, fontWeight: 600 }}>{r.access}</span>
              </div>
            ))}
          </div>

          <div style={{ background: "linear-gradient(160deg,#180D62,#2D1B8E)", borderRadius: 24, padding: "32px" }}>
            <span style={{ fontSize: 28, display: "block", marginBottom: 14 }}>📶</span>
            <SectionBadge bg="rgba(0,200,151,0.15)" color="#00C897">Offline-First</SectionBadge>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: "white", margin: "0 0 12px" }}>Works Without Internet</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, marginBottom: 20 }}>DawoLink keeps operating even during internet interruptions. Every transaction is preserved.</p>
            {["Offline POS — zero interruption", "Local sync — all data preserved", "Background sync when online", "Automatic conflict resolution", "Zero setup required"].map(f => (
              <div key={f} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                <span style={{ color: "#00C897", fontWeight: 800, fontSize: 13 }}>✓</span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{f}</span>
              </div>
            ))}
          </div>

          <div style={{ background: "white", borderRadius: 24, padding: "32px", border: "1px solid #E8E4FF" }}>
            <span style={{ fontSize: 28, display: "block", marginBottom: 14 }}>🔐</span>
            <SectionBadge bg="#D1FAE5" color="#059669">Security</SectionBadge>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: "#180D62", margin: "0 0 12px" }}>Healthcare-Grade Protection</h3>
            <p style={{ fontSize: 13, color: "#6B6B9A", lineHeight: 1.7, marginBottom: 20 }}>Patient data and medicine records secured at every layer.</p>
            {["AES-256 encryption at rest", "TLS 1.3 in transit", "Complete audit trails", "Fraud detection system", "Session monitoring", "Daily encrypted backups"].map(f => <Check key={f} color="#059669">{f}</Check>)}
          </div>
        </div>
      </section>

      {/* Why Different */}
      <section style={{ padding: "80px 24px", background: "white" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: 38, fontWeight: 800, color: "#180D62", margin: "0 0 12px" }}>Why Pharmacies Switch to DawoLink</h2>
            <p style={{ fontSize: 17, color: "#6B6B9A" }}>Old disconnected tools vs. intelligent infrastructure.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: "#FEF2F2", borderRadius: 20, padding: "32px", border: "1px solid #FCA5A5" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#DC2626", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 20 }}>❌ Old Systems</div>
              {["Desktop-only, no remote access", "Manual inventory counts", "No expiry tracking", "Weak or no analytics", "No AI or automation", "No national ecosystem", "Poor UX, slow to learn", "No mobile money support"].map(f => (
                <div key={f} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <span style={{ color: "#DC2626", fontSize: 13 }}>✕</span>
                  <span style={{ fontSize: 14, color: "#7F1D1D" }}>{f}</span>
                </div>
              ))}
            </div>
            <div style={{ background: "linear-gradient(150deg,#F0FDF4,#D1FAE5)", borderRadius: 20, padding: "32px", border: "1px solid #6EE7B7" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#059669", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 20 }}>✓ DawoLink</div>
              {["Cloud-based + mobile-first", "Real-time AI inventory tracking", "Expiry intelligence & forecasting", "Live analytics & business intelligence", "AI forecasting & automation", "National medicine ecosystem", "Intuitive, modern interface", "EVC Plus, Zaad, Sahal, Premier"].map(f => <Check key={f} color="#059669">{f}</Check>)}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: "100px 24px", background: "linear-gradient(150deg,#0d0825 0%,#180D62 50%,#2D1B8E 100%)", textAlign: "center" as const }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 800, color: "white", margin: "0 0 16px", lineHeight: 1.2 }}>
            Modernize Your Pharmacy Operations with DawoLink
          </h2>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.6)", marginBottom: 40, lineHeight: 1.7 }}>
            Start free for 14 days. No credit card required.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/login" style={{ padding: "16px 36px", borderRadius: 14, fontWeight: 700, color: "white", background: "linear-gradient(90deg,#00C897,#009E78)", fontSize: 16, textDecoration: "none", boxShadow: "0 8px 32px rgba(0,200,151,0.35)" }}>
              Start Free Trial
            </Link>
            <Link href="/about" style={{ padding: "16px 36px", borderRadius: 14, fontWeight: 700, fontSize: 16, color: "white", border: "1px solid rgba(255,255,255,0.2)", textDecoration: "none", background: "rgba(255,255,255,0.06)" }}>
              Schedule Demo
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
