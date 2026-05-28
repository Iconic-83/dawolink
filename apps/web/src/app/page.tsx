import Link from "next/link";

const NAV_LINKS = [
  ["/features", "Features"],
  ["/pricing", "Pricing"],
  ["/about", "About"],
];

function DashboardMockup() {
  return (
    <div style={{
      background: "linear-gradient(160deg, #1a1040 0%, #0d0825 100%)",
      borderRadius: 20,
      padding: 24,
      boxShadow: "0 40px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)",
      border: "1px solid rgba(255,255,255,0.07)",
      width: "100%",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#00C897", display: "inline-block" }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>DawoLink Live Dashboard</span>
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F57", display: "inline-block" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FEBC2E", display: "inline-block" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#28C840", display: "inline-block" }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Revenue Today", value: "$4,280", change: "+18%", up: true },
          { label: "Stock Items", value: "1,847", change: "3 low", up: false },
          { label: "Transactions", value: "84", change: "+12%", up: true },
        ].map(s => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "10px 12px", border: "1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "white", marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: s.up ? "#00C897" : "#F59E0B", fontWeight: 600 }}>{s.change}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "12px 14px", marginBottom: 14, border: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>Weekly Revenue</span>
          <span style={{ fontSize: 10, color: "#00C897", fontWeight: 600 }}>↑ 23% this week</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 56 }}>
          {[35, 58, 42, 72, 55, 88, 70].map((h, i) => (
            <div key={i} style={{ flex: 1, height: `${h}%`, background: i === 5 ? "linear-gradient(180deg,#00C897,#009E78)" : "rgba(0,200,151,0.18)", borderRadius: "3px 3px 0 0" }} />
          ))}
        </div>
        <div style={{ display: "flex", marginTop: 5 }}>
          {["M","T","W","T","F","S","S"].map((d, i) => (
            <span key={i} style={{ flex: 1, textAlign: "center", fontSize: 8, color: "rgba(255,255,255,0.2)" }}>{d}</span>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Inventory Alerts</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {[
            { name: "Amoxicillin 500mg", stock: "240 units", status: "good" },
            { name: "Paracetamol 500mg", stock: "18 units", status: "low" },
            { name: "Metformin 850mg", stock: "5 units", status: "critical" },
            { name: "Omeprazole 20mg", stock: "95 units", status: "good" },
          ].map(item => (
            <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.03)", borderRadius: 7, padding: "7px 10px" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: item.status === "good" ? "#00C897" : item.status === "low" ? "#F59E0B" : "#EF4444", display: "inline-block" }} />
              <span style={{ flex: 1, fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{item.name}</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{item.stock}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1, background: "linear-gradient(90deg,#00C897,#009E78)", borderRadius: 8, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "white", fontWeight: 600 }}>EVC Plus</span>
          <span style={{ fontSize: 12, color: "white", fontWeight: 700 }}>$1,240</span>
        </div>
        <div style={{ flex: 1, background: "rgba(74,143,229,0.15)", borderRadius: 8, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(74,143,229,0.25)" }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Zaad</span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: 700 }}>$890</span>
        </div>
      </div>
    </div>
  );
}

const FEATURES = [
  { icon: "📦", title: "Smart Inventory", color: "#2D1B8E", desc: "Real-time stock tracking across all branches. Auto-alerts before shortages hit. Batch and expiry management built in." },
  { icon: "💳", title: "Point of Sale", color: "#00C897", desc: "Ultra-fast checkout with EVC Plus, Zaad, Sahal, and cash. Invoice generation, returns, and customer history." },
  { icon: "⏰", title: "Expiry Intelligence", color: "#F59E0B", desc: "30/15/7 day alerts with color-coded urgency. AI recommends discounts, transfers, or supplier returns before losses occur." },
  { icon: "📊", title: "Analytics & BI", color: "#4A8FE5", desc: "Revenue trends, top medicines, branch performance, employee analytics — all in one live intelligence center." },
  { icon: "🤖", title: "AI Assistant", color: "#8B5CF6", desc: "Prescription scanning, medicine interactions, demand forecasting, and smart reorder automation." },
  { icon: "🏪", title: "Multi-Branch", color: "#EC4899", desc: "One account controls unlimited branches. Unified inventory, reporting, and access control from one dashboard." },
  { icon: "🚚", title: "Delivery & Orders", color: "#10B981", desc: "Online medicine ordering, delivery tracking, nearby pharmacy matching, and driver management." },
  { icon: "🛡️", title: "Roles & Permissions", color: "#F97316", desc: "26 granular permissions across 9 modules. Create custom roles for every position in your pharmacy." },
];

const STEPS = [
  { num: "01", title: "Create Your Account", desc: "Set up your pharmacy in minutes. Add your business details, configure your branches, and customize your workflows.", icon: "🏥" },
  { num: "02", title: "Set Up Branches & Team", desc: "Add your branches, import your medicine catalog from our 10,000+ database, and invite your employees with the right permissions.", icon: "👥" },
  { num: "03", title: "Start Smart Operations", desc: "Go live with POS, inventory tracking, and analytics from day one. Your pharmacy is now connected to Somalia's medicine ecosystem.", icon: "🚀" },
];

export default function HomePage() {
  return (
    <div style={{ background: "#F4F2FF", minHeight: "100vh", fontFamily: "inherit" }}>

      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(244,242,255,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(45,27,142,0.08)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px", height: 64, display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/logo.png" alt="DawoLink" style={{ width: 56, height: 56, borderRadius: 10, objectFit: "contain" }} />
            <span style={{ fontWeight: 800, fontSize: 19, color: "#180D62" }}>Dawo<span style={{ color: "#00C897" }}>Link</span></span>
          </div>
          <div style={{ display: "flex", gap: 36, fontSize: 14, fontWeight: 500 }}>
            {NAV_LINKS.map(([href, label]) => (
              <Link key={href} href={href} style={{ color: "#6B6B9A", textDecoration: "none" }}>{label}</Link>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end" }}>
            <Link href="/login" style={{ padding: "8px 18px", borderRadius: 10, fontSize: 14, fontWeight: 500, color: "#2D1B8E", textDecoration: "none" }}>Sign In</Link>
            <Link href="/login" style={{ padding: "9px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700, color: "white", background: "linear-gradient(90deg,#2D1B8E,#3D2AAD)", textDecoration: "none" }}>Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ background: "linear-gradient(150deg, #0d0825 0%, #180D62 45%, #1a2a5e 100%)", padding: "90px 24px 80px", overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", top: -100, left: "10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,200,151,0.08) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -100, right: "5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(74,143,229,0.08) 0%,transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center", position: "relative" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,200,151,0.12)", border: "1px solid rgba(0,200,151,0.25)", borderRadius: 999, padding: "6px 16px", fontSize: 12, fontWeight: 600, color: "#00C897", marginBottom: 28 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00C897", display: "inline-block" }} />
              Somalia&apos;s Smart Pharmacy Infrastructure
            </div>
            <h1 style={{ fontSize: "clamp(36px,4.5vw,56px)", fontWeight: 800, lineHeight: 1.1, margin: "0 0 24px", color: "white" }}>
              Connecting Somalia&apos;s{" "}
              <span style={{ background: "linear-gradient(135deg,#00C897,#4A8FE5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Medicine Ecosystem
              </span>
            </h1>
            <p style={{ fontSize: 18, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, margin: "0 0 36px", maxWidth: 500 }}>
              DawoLink helps pharmacies manage inventory, sales, suppliers, employees, analytics, and AI-powered operations — all in one intelligent ecosystem built for Somalia.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 48 }}>
              <Link href="/login" style={{ padding: "14px 30px", borderRadius: 12, fontWeight: 700, color: "white", background: "linear-gradient(90deg,#00C897,#009E78)", fontSize: 15, textDecoration: "none", boxShadow: "0 8px 24px rgba(0,200,151,0.3)" }}>
                Start Free Trial
              </Link>
              <Link href="/features" style={{ padding: "14px 30px", borderRadius: 12, fontWeight: 700, fontSize: 15, color: "white", border: "1px solid rgba(255,255,255,0.2)", textDecoration: "none", background: "rgba(255,255,255,0.06)" }}>
                Book Demo →
              </Link>
            </div>

            <div style={{ display: "flex", gap: 40 }}>
              {[["150+", "Pharmacies"], ["10K+", "Medicines"], ["2M+", "Transactions"]].map(([v, l]) => (
                <div key={l}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "white" }}>{v}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ transform: "perspective(1200px) rotateY(-6deg) rotateX(3deg)" }}>
            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section style={{ background: "white", borderBottom: "1px solid #E8E4FF", padding: "24px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", fontSize: 12, fontWeight: 600, color: "#9B9BC0", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 20 }}>
            Supported Payment Integrations
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
            {[
              { name: "EVC Plus", color: "#E31837" },
              { name: "Zaad", color: "#009A44" },
              { name: "Sahal", color: "#0066CC" },
              { name: "Premier Wallet", color: "#8B5CF6" },
              { name: "Cash", color: "#6B7280" },
            ].map(p => (
              <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 18px", borderRadius: 8, border: "1px solid #E8E4FF", background: "#FAFAFA" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, display: "inline-block" }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: "white", padding: "64px 24px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, background: "#E8E4FF", borderRadius: 20, overflow: "hidden" }}>
            {[
              { value: "150+", label: "Connected Pharmacies", sub: "Across Somalia" },
              { value: "25K+", label: "Medicines Managed", sub: "In real-time" },
              { value: "1.2M+", label: "Transactions Processed", sub: "And counting" },
              { value: "99.9%", label: "System Uptime", sub: "SLA guaranteed" },
            ].map(s => (
              <div key={s.label} style={{ background: "white", padding: "36px 32px", textAlign: "center" }}>
                <div style={{ fontSize: 42, fontWeight: 800, color: "#180D62", marginBottom: 6 }}>{s.value}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontSize: 12, color: "#9B9BC0" }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why DawoLink */}
      <section style={{ padding: "80px 24px", background: "#F4F2FF" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
            <div>
              <div style={{ display: "inline-block", background: "#FEF3C7", color: "#D97706", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 6, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 20 }}>
                The Problem
              </div>
              <h2 style={{ fontSize: 36, fontWeight: 800, color: "#180D62", lineHeight: 1.2, margin: "0 0 24px" }}>
                Somalia&apos;s Pharmacies Deserve Better Technology
              </h2>
              <p style={{ fontSize: 16, color: "#6B6B9A", lineHeight: 1.75, marginBottom: 32 }}>
                Thousands of pharmacies across Somalia still operate with paper records, manual inventory, no expiry tracking, and zero visibility into their business performance.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  "Manual inventory leading to stockouts and overstock",
                  "Medicine expiry losses costing thousands monthly",
                  "Disconnected branches with no unified visibility",
                  "No analytics — decisions made on guesswork",
                  "Employee accountability gaps and theft exposure",
                ].map(p => (
                  <div key={p} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <span style={{ width: 18, height: 18, borderRadius: "50%", background: "#FEE2E2", color: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>✕</span>
                    <span style={{ fontSize: 14, color: "#374151" }}>{p}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{ display: "inline-block", background: "#D1FAE5", color: "#059669", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 6, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 20 }}>
                The Solution
              </div>
              <h2 style={{ fontSize: 36, fontWeight: 800, color: "#180D62", lineHeight: 1.2, margin: "0 0 24px" }}>
                One Intelligent Platform That Solves Everything
              </h2>
              <p style={{ fontSize: 16, color: "#6B6B9A", lineHeight: 1.75, marginBottom: 32 }}>
                DawoLink connects every aspect of pharmacy operations — from the POS counter to the supplier network — in one intelligent, AI-powered ecosystem.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  "Real-time inventory with AI demand forecasting",
                  "Expiry intelligence that prevents losses automatically",
                  "Multi-branch control with unified dashboard",
                  "Live analytics and business intelligence",
                  "Role-based access with full audit trails",
                ].map(p => (
                  <div key={p} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <span style={{ width: 18, height: 18, borderRadius: "50%", background: "#D1FAE5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>✓</span>
                    <span style={{ fontSize: 14, color: "#374151" }}>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section style={{ padding: "80px 24px", background: "white" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontSize: 38, fontWeight: 800, color: "#180D62", margin: "0 0 12px" }}>Everything Your Pharmacy Needs</h2>
            <p style={{ fontSize: 18, color: "#6B6B9A", maxWidth: 540, margin: "0 auto" }}>From daily operations to national-scale intelligence. Every module purpose-built for the Somali pharmacy.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ background: "#FAFAFA", borderRadius: 20, padding: "28px 24px", border: "1px solid #E8E4FF", transition: "all 0.2s" }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: `${f.color}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 16 }}>
                  {f.icon}
                </div>
                <h3 style={{ fontWeight: 700, color: "#180D62", marginBottom: 8, fontSize: 15 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: "#6B6B9A", lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <Link href="/features" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", borderRadius: 10, border: "1px solid #2D1B8E", color: "#2D1B8E", fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
              View All Features →
            </Link>
          </div>
        </div>
      </section>

      {/* Live Ecosystem Map */}
      <section style={{ padding: "80px 24px", background: "linear-gradient(150deg,#0d0825 0%,#180D62 60%,#1a2a5e 100%)", overflow: "hidden" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-block", background: "rgba(0,200,151,0.15)", color: "#00C897", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 6, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 20 }}>
              Live Network
            </div>
            <h2 style={{ fontSize: 38, fontWeight: 800, color: "white", lineHeight: 1.2, margin: "0 0 20px" }}>
              Somalia&apos;s Connected Pharmacy Network
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", lineHeight: 1.75, marginBottom: 36 }}>
              Every DawoLink pharmacy contributes to a shared intelligence layer — creating a national medicine ecosystem that benefits every connected pharmacy.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { icon: "💊", label: "National Medicine DB", sub: "10,000+ medicines" },
                { icon: "📍", label: "Availability Mapping", sub: "Real-time stock" },
                { icon: "🔔", label: "Shortage Alerts", sub: "Predictive warnings" },
                { icon: "🛡️", label: "Counterfeit Detection", sub: "Medicine safety" },
              ].map(c => (
                <div key={c.label} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 14, padding: "16px 18px", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{c.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "white", marginBottom: 2 }}>{c.label}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{c.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Map visualization */}
          <div style={{ position: "relative", height: 380, background: "rgba(255,255,255,0.03)", borderRadius: 24, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%,rgba(45,27,142,0.3) 0%,transparent 70%)" }} />
            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map(i => (
              <div key={`h${i}`} style={{ position: "absolute", left: 0, right: 0, top: `${i * 25}%`, height: 1, background: "rgba(255,255,255,0.04)" }} />
            ))}
            {[0, 1, 2, 3].map(i => (
              <div key={`v${i}`} style={{ position: "absolute", top: 0, bottom: 0, left: `${i * 33}%`, width: 1, background: "rgba(255,255,255,0.04)" }} />
            ))}
            {/* City nodes */}
            {[
              { name: "Mogadishu", x: 52, y: 72, size: 14, active: true },
              { name: "Hargeisa", x: 22, y: 14, size: 10, active: true },
              { name: "Bosaso", x: 70, y: 10, size: 8, active: false },
              { name: "Kismayo", x: 50, y: 90, size: 7, active: false },
              { name: "Baidoa", x: 38, y: 58, size: 8, active: true },
              { name: "Garowe", x: 68, y: 32, size: 7, active: false },
              { name: "Berbera", x: 34, y: 10, size: 6, active: false },
            ].map(city => (
              <div key={city.name} style={{ position: "absolute", left: `${city.x}%`, top: `${city.y}%`, transform: "translate(-50%,-50%)" }}>
                <div style={{
                  width: city.size, height: city.size, borderRadius: "50%",
                  background: city.active ? "#00C897" : "rgba(74,143,229,0.6)",
                  boxShadow: city.active ? `0 0 0 ${city.size / 2}px rgba(0,200,151,0.2), 0 0 0 ${city.size}px rgba(0,200,151,0.08)` : "none",
                }} />
                <div style={{ position: "absolute", top: city.size + 4, left: "50%", transform: "translateX(-50%)", fontSize: 9, color: "rgba(255,255,255,0.5)", whiteSpace: "nowrap", fontWeight: 600 }}>
                  {city.name}
                </div>
              </div>
            ))}
            <div style={{ position: "absolute", bottom: 16, left: 16, display: "flex", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#00C897", display: "inline-block" }} />
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>Active</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(74,143,229,0.6)", display: "inline-block" }} />
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>Coming soon</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: "80px 24px", background: "#F4F2FF" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontSize: 38, fontWeight: 800, color: "#180D62", margin: "0 0 12px" }}>Up and Running in Minutes</h2>
            <p style={{ fontSize: 18, color: "#6B6B9A" }}>Three steps to a fully connected, intelligent pharmacy.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
            {STEPS.map((step, i) => (
              <div key={step.num} style={{ background: "white", borderRadius: 24, padding: "36px 32px", border: "1px solid #E8E4FF", position: "relative" }}>
                {i < STEPS.length - 1 && (
                  <div style={{ position: "absolute", right: -12, top: "50%", width: 24, height: 2, background: "#E8E4FF", transform: "translateY(-50%)", zIndex: 1 }} />
                )}
                <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#2D1B8E,#4A8FE5)", marginBottom: 20 }}>
                  <span style={{ fontSize: 22 }}>{step.icon}</span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#00C897", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Step {step.num}</div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: "#180D62", marginBottom: 12 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: "#6B6B9A", lineHeight: 1.7, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section style={{ padding: "80px 24px", background: "linear-gradient(135deg,#180D62 0%,#2D1B8E 50%,#1a2a5e 100%)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-block", background: "rgba(139,92,246,0.2)", color: "#A78BFA", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 6, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 20 }}>
              AI-Powered
            </div>
            <h2 style={{ fontSize: 38, fontWeight: 800, color: "white", lineHeight: 1.2, margin: "0 0 20px" }}>
              AI That Helps Pharmacies Operate Smarter
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", lineHeight: 1.75, marginBottom: 36 }}>
              DawoLink&apos;s AI layer assists pharmacists — it never replaces them. Expect smarter decisions, not automated guesses.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { icon: "🔮", title: "Demand Forecasting", desc: "Predict shortages weeks before they happen based on sales patterns." },
                { icon: "⏰", title: "Expiry Intelligence", desc: "AI-driven recommendations to eliminate stock losses before expiry." },
                { icon: "📋", title: "Prescription OCR", desc: "Scan prescriptions instantly to speed up dispensing and reduce errors." },
                { icon: "💊", title: "Drug Interaction Detection", desc: "Instant warnings when dispensing medicines with known interactions." },
              ].map(a => (
                <div key={a.title} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 22, marginTop: 2 }}>{a.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "white", marginBottom: 3 }}>{a.title}</div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>{a.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 24, padding: 28, border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>AI Forecasting — Next 30 Days</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {[
                { name: "Amoxicillin 500mg", risk: 87, level: "High Risk", color: "#EF4444" },
                { name: "ORS Sachets", risk: 64, level: "Medium Risk", color: "#F59E0B" },
                { name: "Metformin 850mg", risk: 42, level: "Monitor", color: "#3B82F6" },
                { name: "Panadol Extra", risk: 18, level: "Healthy", color: "#00C897" },
              ].map(r => (
                <div key={r.name} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>{r.name}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: r.color }}>{r.level}</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 99, background: "rgba(255,255,255,0.08)" }}>
                    <div style={{ height: "100%", width: `${r.risk}%`, borderRadius: 99, background: r.color }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: "rgba(0,200,151,0.1)", border: "1px solid rgba(0,200,151,0.2)", borderRadius: 12, padding: "12px 16px" }}>
              <div style={{ fontSize: 12, color: "#00C897", fontWeight: 700, marginBottom: 4 }}>AI Recommendation</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>Reorder Amoxicillin 500mg within 7 days. Current trend suggests stockout by next Thursday.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Offline + Mobile */}
      <section style={{ padding: "80px 24px", background: "white" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {/* Offline */}
            <div style={{ background: "linear-gradient(135deg,#F4F2FF,#E8E4FF)", borderRadius: 24, padding: "40px", border: "1px solid #E8E4FF" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#2D1B8E", color: "white", fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 8, marginBottom: 24 }}>
                <span>📶</span> Offline-First Technology
              </div>
              <h3 style={{ fontSize: 28, fontWeight: 800, color: "#180D62", margin: "0 0 16px", lineHeight: 1.2 }}>
                Works Even Without Internet
              </h3>
              <p style={{ fontSize: 15, color: "#6B6B9A", lineHeight: 1.7, marginBottom: 24 }}>
                DawoLink continues operating during internet interruptions. Every transaction, every scan, every sale — processed locally and synced automatically when connectivity returns.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  "Offline POS — sell without interruption",
                  "Local inventory sync — no data loss",
                  "Background sync — automatic when online",
                  "Zero configuration — it just works",
                ].map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ color: "#00C897", fontWeight: 800, fontSize: 13 }}>✓</span>
                    <span style={{ fontSize: 13, color: "#374151" }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile */}
            <div style={{ background: "linear-gradient(135deg,#0d0825,#180D62)", borderRadius: 24, padding: "40px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,200,151,0.15)", color: "#00C897", fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 8, border: "1px solid rgba(0,200,151,0.25)", marginBottom: 24 }}>
                <span>📱</span> Mobile-First Design
              </div>
              <h3 style={{ fontSize: 28, fontWeight: 800, color: "white", margin: "0 0 16px", lineHeight: 1.2 }}>
                Manage From Anywhere
              </h3>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, marginBottom: 24 }}>
                Somalia runs on mobile. DawoLink is designed mobile-first — whether you&apos;re at the counter, in the warehouse, or managing branches remotely.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  "Full POS on tablet or phone",
                  "Dashboard accessible anywhere",
                  "Delivery driver mobile app",
                  "Responsive on all screen sizes",
                ].map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ color: "#00C897", fontWeight: 800, fontSize: 13 }}>✓</span>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security */}
      <section style={{ padding: "80px 24px", background: "#F4F2FF" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-block", background: "#D1FAE5", color: "#059669", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 6, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 20 }}>
            Security & Reliability
          </div>
          <h2 style={{ fontSize: 38, fontWeight: 800, color: "#180D62", margin: "0 0 16px" }}>Healthcare-Grade Security</h2>
          <p style={{ fontSize: 17, color: "#6B6B9A", maxWidth: 560, margin: "0 auto 56px", lineHeight: 1.7 }}>
            Patient data and medicine records require the highest level of protection. DawoLink is built with security at every layer.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {[
              { icon: "🔐", title: "End-to-End Encryption", desc: "All data encrypted in transit and at rest using AES-256. Your pharmacy data is always protected." },
              { icon: "📋", title: "Complete Audit Logs", desc: "Every action by every user is logged. Know exactly who did what, when, and from where." },
              { icon: "🛡️", title: "Role-Based Access", desc: "26 granular permissions. No employee can access what they shouldn't. Fully configurable." },
              { icon: "☁️", title: "Automatic Backups", desc: "Daily encrypted backups with 30-day retention. Your data is never at risk." },
              { icon: "🏥", title: "Data Isolation", desc: "Each pharmacy's data is completely isolated. No pharmacy can ever see another's information." },
              { icon: "⚡", title: "99.9% Uptime SLA", desc: "Enterprise infrastructure with automatic failover. Your pharmacy stays open, we stay reliable." },
            ].map(s => (
              <div key={s.title} style={{ background: "white", borderRadius: 20, padding: "28px", border: "1px solid #E8E4FF", textAlign: "left" }}>
                <span style={{ fontSize: 28, display: "block", marginBottom: 14 }}>{s.icon}</span>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: "#180D62", marginBottom: 8 }}>{s.title}</h4>
                <p style={{ fontSize: 13, color: "#6B6B9A", lineHeight: 1.65, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: "80px 24px", background: "white" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: 38, fontWeight: 800, color: "#180D62", margin: "0 0 12px" }}>Trusted by Somalia&apos;s Pharmacies</h2>
            <p style={{ fontSize: 17, color: "#6B6B9A" }}>Hear from pharmacy owners who transformed their operations.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
            {[
              { name: "Ahmed Hassan", role: "Pharmacy Owner, Mogadishu", quote: "DawoLink reduced our inventory losses by over 60%. We used to lose thousands monthly to expiry. Now we get alerts weeks in advance." },
              { name: "Faadumo Warsame", role: "Multi-Branch Manager, Hargeisa", quote: "Managing 3 branches used to feel impossible. Now I have a unified view of all stock, sales, and staff from one screen." },
              { name: "Omar Duale", role: "Pharmacist, Baidoa", quote: "The AI assistant is incredible. It catches drug interactions I might miss during busy periods. It's like having a second set of eyes." },
            ].map(t => (
              <div key={t.name} style={{ background: "#F4F2FF", borderRadius: 20, padding: "28px", border: "1px solid #E8E4FF" }}>
                <div style={{ fontSize: 32, color: "#00C897", marginBottom: 16, lineHeight: 1 }}>"</div>
                <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.75, marginBottom: 20 }}>{t.quote}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#2D1B8E,#4A8FE5)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#180D62" }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "#9B9BC0" }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section style={{ padding: "80px 24px", background: "#F4F2FF" }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: 38, fontWeight: 800, color: "#180D62", margin: "0 0 12px" }}>Simple, Transparent Pricing</h2>
            <p style={{ fontSize: 17, color: "#6B6B9A" }}>Start free for 14 days. No credit card required.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginBottom: 32 }}>
            {[
              { name: "Starter", price: "$29", period: "/mo", desc: "Single-location pharmacies", features: ["1 branch", "5 staff accounts", "Full POS + Inventory", "Expiry tracking", "Basic analytics"], highlight: false },
              { name: "Professional", price: "$79", period: "/mo", desc: "Growing pharmacy groups", features: ["Up to 5 branches", "Unlimited staff", "AI forecasting", "Advanced analytics", "Supplier management"], highlight: true },
              { name: "Enterprise", price: "Custom", period: "", desc: "Chains & hospital networks", features: ["Unlimited branches", "REST API access", "Custom integrations", "Dedicated manager", "99.9% SLA uptime"], highlight: false },
            ].map(p => (
              <div key={p.name} style={{
                borderRadius: 22, padding: "32px 26px", position: "relative",
                background: p.highlight ? "linear-gradient(150deg,#2D1B8E,#3D2AAD)" : "white",
                border: p.highlight ? "none" : "1px solid #E8E4FF",
                boxShadow: p.highlight ? "0 20px 60px rgba(45,27,142,0.3)" : "0 2px 12px rgba(0,0,0,0.04)",
              }}>
                {p.highlight && <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: "#00C897", color: "white", fontSize: 11, fontWeight: 700, padding: "4px 16px", borderRadius: 999, whiteSpace: "nowrap" }}>Most Popular</div>}
                <div style={{ fontSize: 12, fontWeight: 600, color: p.highlight ? "rgba(255,255,255,0.5)" : "#9B9BC0", marginBottom: 4 }}>{p.desc}</div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: p.highlight ? "white" : "#180D62", margin: "0 0 4px" }}>{p.name}</h3>
                <div style={{ display: "flex", alignItems: "baseline", gap: 3, margin: "14px 0 20px" }}>
                  <span style={{ fontSize: 40, fontWeight: 800, color: p.highlight ? "white" : "#180D62" }}>{p.price}</span>
                  <span style={{ fontSize: 13, color: p.highlight ? "rgba(255,255,255,0.5)" : "#9B9BC0" }}>{p.period}</span>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 8 }}>
                  {p.features.map(f => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: p.highlight ? "rgba(255,255,255,0.85)" : "#374151" }}>
                      <span style={{ color: "#00C897", fontWeight: 700 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/login" style={{ display: "block", textAlign: "center", padding: "12px", borderRadius: 12, fontWeight: 700, fontSize: 14, color: "white", background: p.highlight ? "#00C897" : "linear-gradient(90deg,#2D1B8E,#3D2AAD)", textDecoration: "none" }}>
                  {p.price === "Custom" ? "Contact Sales" : "Start Free — 14 days"}
                </Link>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center" }}>
            <Link href="/pricing" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#2D1B8E", fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
              Compare all plans in detail →
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: "100px 24px", background: "linear-gradient(150deg,#0d0825 0%,#180D62 50%,#2D1B8E 100%)", textAlign: "center" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(30px,4vw,48px)", fontWeight: 800, color: "white", margin: "0 0 16px", lineHeight: 1.2 }}>
            Build the Future of<br />Pharmacy Operations
          </h2>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.6)", marginBottom: 40, lineHeight: 1.7 }}>
            Join 150+ pharmacies already using DawoLink to operate smarter, reduce losses, and serve patients better.
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
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <img src="/logo.png" alt="DawoLink" style={{ width: 80, height: 80, objectFit: "contain", filter: "drop-shadow(0 0 10px rgba(0,200,151,0.55)) drop-shadow(0 0 4px rgba(74,143,229,0.45))" }} />
                <span style={{ fontWeight: 800, fontSize: 18, color: "white" }}>Dawo<span style={{ color: "#00C897" }}>Link</span></span>
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.75, maxWidth: 260, margin: "0 0 20px" }}>
                Somalia&apos;s smart pharmacy infrastructure. Connecting every pharmacy to one intelligent ecosystem.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                {["EVC", "Zaad", "Sahal"].map(p => (
                  <span key={p} style={{ padding: "4px 10px", background: "rgba(255,255,255,0.06)", borderRadius: 6, fontSize: 11, color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>{p}</span>
                ))}
              </div>
            </div>
            {[
              { title: "Product", links: [["Features", "/features"], ["Pricing", "/pricing"], ["Integrations", "/features"]] },
              { title: "Company", links: [["About", "/about"], ["Contact", "/about"], ["Careers", "/about"]] },
              { title: "Legal", links: [["Privacy", "/about"], ["Terms", "/about"], ["Security", "/about"]] },
            ].map(col => (
              <div key={col.title}>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 16 }}>{col.title}</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {col.links.map(([label, href]) => (
                    <Link key={label} href={href} style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>{label}</Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 28, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>© 2026 DawoLink. Built for Somalia.</span>
            <div style={{ display: "flex", gap: 16 }}>
              {[["LinkedIn", "/about"], ["Facebook", "/about"], ["X", "/about"]].map(([l, h]) => (
                <Link key={l} href={h} style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>{l}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
