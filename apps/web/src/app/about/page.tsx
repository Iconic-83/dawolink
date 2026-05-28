import Link from "next/link";

const NAV = [["Features", "/features"], ["Pricing", "/pricing"], ["About", "/about"]];

const PROBLEMS = [
  "Manual inventory tracking with paper records",
  "Medicine expiry losses costing thousands monthly",
  "Disconnected branches with zero unified visibility",
  "Inaccurate reporting and guesswork-based decisions",
  "Employee theft and accountability gaps",
  "Supplier confusion and procurement inefficiencies",
  "No analytics, no forecasting, no intelligence",
  "Poor customer tracking and retention",
  "Technology systems built for other markets",
];

const VALUES = [
  { icon: "💡", title: "Innovation", desc: "We build smarter healthcare systems — not just software. Every feature is designed to solve real operational problems in Somalia.", color: "#4A8FE5" },
  { icon: "🔒", title: "Reliability", desc: "Pharmacies depend on DawoLink every single day. We treat that responsibility seriously across every line of code we write.", color: "#00C897" },
  { icon: "🌍", title: "Accessibility", desc: "World-class pharmacy technology should not be reserved for large corporations. We price for Somali businesses, not multinational budgets.", color: "#F59E0B" },
  { icon: "🛡️", title: "Security", desc: "Healthcare data requires the highest level of trust. We encrypt everything, audit everything, and isolate every pharmacy completely.", color: "#EF4444" },
  { icon: "📈", title: "Scalability", desc: "DawoLink is designed for long-term growth — from a single pharmacy today to a national infrastructure spanning all of East Africa.", color: "#8B5CF6" },
];

const DIFFERENTIATORS = [
  {
    icon: "🌐",
    title: "Ecosystem Thinking",
    desc: "DawoLink is not just pharmacy software. It is connected infrastructure. Every pharmacy on the network contributes to and benefits from a shared national intelligence layer.",
    color: "#2D1B8E",
  },
  {
    icon: "🤖",
    title: "AI-Powered Operations",
    desc: "Smart forecasting, demand prediction, expiry intelligence, and prescription OCR. Our AI layer works alongside pharmacists — making them faster and smarter, never replacing them.",
    color: "#8B5CF6",
  },
  {
    icon: "🇸🇴",
    title: "Somalia-First Design",
    desc: "Built for local workflows, mobile money payments, offline operations, and the specific supply chain realities of Somalia. This is not a generic SaaS with a new logo.",
    color: "#00C897",
  },
  {
    icon: "🏢",
    title: "Enterprise Architecture",
    desc: "Multi-tenant, multi-branch, role-based access, encrypted infrastructure. DawoLink scales from a single pharmacy to a nationwide chain without changing a single workflow.",
    color: "#4A8FE5",
  },
];

const ROADMAP = [
  { phase: "Phase 1", title: "Smart Pharmacy Operations", status: "Live", desc: "Full POS, inventory management, expiry intelligence, analytics, supplier management, and role-based access control.", color: "#00C897", active: true },
  { phase: "Phase 2", title: "Delivery & Online Orders", status: "In Progress", desc: "Online medicine ordering, prescription uploads, delivery tracking, driver management, and pharmacy matching.", color: "#4A8FE5", active: true },
  { phase: "Phase 3", title: "Clinic & Doctor Integrations", status: "Planned", desc: "Direct prescription routing from clinics, doctor referral networks, and electronic prescription management.", color: "#F59E0B", active: false },
  { phase: "Phase 4", title: "National Medicine Intelligence", status: "Planned", desc: "Full national medicine availability network, shortage prediction, pricing intelligence, and counterfeit detection at scale.", color: "#8B5CF6", active: false },
  { phase: "Phase 5", title: "East Africa Expansion", status: "Future", desc: "Expanding the DawoLink ecosystem to Ethiopia, Kenya, Uganda, and beyond. Somalia&apos;s infrastructure model, applied regionally.", color: "#EC4899", active: false },
];

const ECOSYSTEM_NODES = [
  { icon: "🏥", label: "Pharmacies", desc: "Core operators" },
  { icon: "🏢", label: "Branches", desc: "Multi-location" },
  { icon: "🚚", label: "Suppliers", desc: "Supply chain" },
  { icon: "👥", label: "Customers", desc: "Patients served" },
  { icon: "🛵", label: "Delivery", desc: "Last mile" },
  { icon: "📊", label: "Analytics", desc: "Intelligence layer" },
  { icon: "🤖", label: "AI Engine", desc: "Automation" },
  { icon: "💊", label: "Medicine DB", desc: "National catalog" },
];

export default function AboutPage() {
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
              <Link key={href} href={href} style={{ color: href === "/about" ? "#2D1B8E" : "#6B6B9A", textDecoration: "none", fontWeight: href === "/about" ? 700 : 500 }}>{label}</Link>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end" }}>
            <Link href="/login" style={{ padding: "8px 18px", borderRadius: 10, fontSize: 14, fontWeight: 500, color: "#2D1B8E", textDecoration: "none" }}>Sign In</Link>
            <Link href="/login" style={{ padding: "9px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700, color: "white", background: "linear-gradient(90deg,#2D1B8E,#3D2AAD)", textDecoration: "none" }}>Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ background: "linear-gradient(150deg,#0d0825 0%,#180D62 50%,#1a2a5e 100%)", padding: "100px 24px 90px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -100, left: "10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,200,151,0.07) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -100, right: "5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(74,143,229,0.07) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 780, margin: "0 auto", position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,200,151,0.12)", border: "1px solid rgba(0,200,151,0.25)", borderRadius: 999, padding: "6px 16px", fontSize: 12, fontWeight: 600, color: "#00C897", marginBottom: 28 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00C897", display: "inline-block" }} />
            Our Story & Vision
          </div>
          <h1 style={{ fontSize: "clamp(34px,5vw,58px)", fontWeight: 800, color: "white", margin: "0 0 24px", lineHeight: 1.1 }}>
            Building the Future of{" "}
            <span style={{ background: "linear-gradient(135deg,#00C897,#4A8FE5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Pharmacy Operations
            </span>{" "}
            in Somalia
          </h1>
          <p style={{ fontSize: 19, color: "rgba(255,255,255,0.65)", lineHeight: 1.75, margin: "0 0 40px", maxWidth: 620, marginLeft: "auto", marginRight: "auto" }}>
            DawoLink was created to modernize pharmacy operations, eliminate inefficiencies, improve medicine accessibility, and build a connected healthcare ecosystem for Somalia and beyond.
          </p>
          <div style={{ display: "flex", gap: 40, justifyContent: "center" }}>
            {[["150+", "Pharmacies"], ["10K+", "Medicines"], ["99.9%", "Uptime"]].map(([v, l]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: "white" }}>{v}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section style={{ padding: "80px 24px", background: "white" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-block", background: "#FEF3C7", color: "#D97706", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 6, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 20 }}>
              Why DawoLink Exists
            </div>
            <h2 style={{ fontSize: 38, fontWeight: 800, color: "#180D62", lineHeight: 1.2, margin: "0 0 20px" }}>
              Most Pharmacies in Somalia Still Struggle with These Problems
            </h2>
            <p style={{ fontSize: 16, color: "#6B6B9A", lineHeight: 1.75, marginBottom: 32 }}>
              Thousands of pharmacies across Somalia are handling critical healthcare operations using disconnected, outdated, and inefficient systems. The human and financial cost is enormous.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {PROBLEMS.map(p => (
                <div key={p} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#FEE2E2", color: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>✕</span>
                  <span style={{ fontSize: 14, color: "#374151" }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: "#F4F2FF", borderRadius: 24, padding: "40px", border: "1px solid #E8E4FF" }}>
            <div style={{ display: "inline-block", background: "#D1FAE5", color: "#059669", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 6, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 20 }}>
              The DawoLink Solution
            </div>
            <h3 style={{ fontSize: 26, fontWeight: 800, color: "#180D62", margin: "0 0 16px", lineHeight: 1.3 }}>
              Intelligent, Connected Infrastructure Built to Solve Every One of These Problems
            </h3>
            <p style={{ fontSize: 15, color: "#6B6B9A", lineHeight: 1.75, marginBottom: 24 }}>
              DawoLink was built to eliminate these problems through intelligent, connected infrastructure — not just another app.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                "AI-powered inventory with real-time accuracy",
                "Expiry intelligence that prevents losses automatically",
                "Multi-branch control from one unified dashboard",
                "Analytics and reporting built in — always live",
                "Role-based access with complete audit trails",
                "National medicine ecosystem connecting all pharmacies",
              ].map(s => (
                <div key={s} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#D1FAE5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>✓</span>
                  <span style={{ fontSize: 14, color: "#374151" }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission + Vision */}
      <section style={{ padding: "80px 24px", background: "linear-gradient(150deg,#0d0825,#180D62)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
          <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 24, padding: "44px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: 36, marginBottom: 20 }}>🎯</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#00C897", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 14 }}>Our Mission</div>
            <h3 style={{ fontSize: 28, fontWeight: 800, color: "white", margin: "0 0 16px", lineHeight: 1.3 }}>
              To build Somalia&apos;s most trusted medicine ecosystem.
            </h3>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", lineHeight: 1.8, margin: 0 }}>
              We exist to modernize pharmacy operations through intelligent, accessible, and connected technology — making every pharmacy more efficient, every patient safer, and every medicine more traceable.
            </p>
          </div>
          <div style={{ background: "rgba(0,200,151,0.06)", borderRadius: 24, padding: "44px", border: "1px solid rgba(0,200,151,0.15)" }}>
            <div style={{ fontSize: 36, marginBottom: 20 }}>🔭</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#00C897", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 14 }}>Our Vision</div>
            <h3 style={{ fontSize: 28, fontWeight: 800, color: "white", margin: "0 0 16px", lineHeight: 1.3 }}>
              A connected healthcare ecosystem across Africa.
            </h3>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", lineHeight: 1.8, margin: 0 }}>
              We envision a future where every pharmacy, clinic, supplier, and healthcare provider is connected through one smart ecosystem — improving medicine access, operational efficiency, and healthcare intelligence across all of Africa.
            </p>
          </div>
        </div>
      </section>

      {/* What Makes DawoLink Different */}
      <section style={{ padding: "80px 24px", background: "#F4F2FF" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontSize: 38, fontWeight: 800, color: "#180D62", margin: "0 0 12px" }}>What Makes DawoLink Different</h2>
            <p style={{ fontSize: 17, color: "#6B6B9A", maxWidth: 520, margin: "0 auto" }}>Not just another pharmacy app. A connected national infrastructure.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 24 }}>
            {DIFFERENTIATORS.map(d => (
              <div key={d.title} style={{ background: "white", borderRadius: 24, padding: "36px", border: "1px solid #E8E4FF" }}>
                <div style={{ width: 60, height: 60, borderRadius: 18, background: `${d.color}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 20 }}>
                  {d.icon}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: "#180D62", marginBottom: 12 }}>{d.title}</h3>
                <p style={{ fontSize: 15, color: "#6B6B9A", lineHeight: 1.75, margin: 0 }}>{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Story */}
      <section style={{ padding: "80px 24px", background: "white" }}>
        <div style={{ maxWidth: 820, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-block", background: "#E8E4FF", color: "#2D1B8E", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 6, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 20 }}>
            Our Story
          </div>
          <h2 style={{ fontSize: 38, fontWeight: 800, color: "#180D62", margin: "0 0 32px", lineHeight: 1.2 }}>
            How DawoLink Began
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 20, textAlign: "left" as const }}>
            {[
              "DawoLink started with a simple but urgent realization: pharmacies across Somalia were handling critical healthcare operations using disconnected, outdated, and deeply inefficient systems. Paper stock records. Manual expiry tracking. No analytics. No supplier visibility. No way to know what medicine was available across a network of branches.",
              "We saw an opportunity to build something far larger than a POS system — a connected infrastructure capable of transforming pharmacy operations at a national level. Not a generic SaaS platform reskinned for Somalia, but a purpose-built system that deeply understands the local context: EVC Plus payments, offline connectivity, Somali supply chains, and the specific workflows of Somali pharmacists.",
              "Today, DawoLink is a full-stack pharmacy operating system: intelligent inventory management, AI forecasting, expiry intelligence, multi-branch control, supplier management, and the beginning of Somalia's national medicine database. Every connected pharmacy makes the entire network smarter.",
              "We are building infrastructure. Not software.",
            ].map((para, i) => (
              <p key={i} style={{ fontSize: 16, color: "#374151", lineHeight: 1.85, margin: 0 }}>{para}</p>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section style={{ padding: "80px 24px", background: "#F4F2FF" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontSize: 38, fontWeight: 800, color: "#180D62", margin: "0 0 12px" }}>What We Believe</h2>
            <p style={{ fontSize: 17, color: "#6B6B9A" }}>The principles behind every decision we make.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 20 }}>
            {VALUES.map(v => (
              <div key={v.title} style={{ background: "white", borderRadius: 20, padding: "28px 22px", border: "1px solid #E8E4FF", textAlign: "center" as const }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: `${v.color}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 16px" }}>
                  {v.icon}
                </div>
                <h4 style={{ fontSize: 15, fontWeight: 800, color: "#180D62", marginBottom: 10 }}>{v.title}</h4>
                <p style={{ fontSize: 12, color: "#6B6B9A", lineHeight: 1.65, margin: 0 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ecosystem Diagram */}
      <section style={{ padding: "80px 24px", background: "linear-gradient(150deg,#0d0825,#180D62)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ display: "inline-block", background: "rgba(0,200,151,0.15)", color: "#00C897", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 6, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 16 }}>
              The Ecosystem
            </div>
            <h2 style={{ fontSize: 38, fontWeight: 800, color: "white", margin: "0 0 16px" }}>The DawoLink Ecosystem</h2>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.55)", maxWidth: 540, margin: "0 auto", lineHeight: 1.7 }}>
              Every component is connected. Every pharmacy benefits from every other. This is what infrastructure looks like.
            </p>
          </div>

          {/* Center hub */}
          <div style={{ position: "relative", display: "flex", justifyContent: "center", marginBottom: 48 }}>
            <div style={{ width: 120, height: 120, borderRadius: "50%", background: "linear-gradient(135deg,#00C897,#009E78)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 24px rgba(0,200,151,0.08), 0 0 0 48px rgba(0,200,151,0.04)", zIndex: 2 }}>
              <span style={{ fontSize: 36 }}>💊</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "white", marginTop: 4 }}>DawoLink</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
            {ECOSYSTEM_NODES.map(node => (
              <div key={node.label} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 18, padding: "22px", border: "1px solid rgba(255,255,255,0.07)", textAlign: "center" as const }}>
                <span style={{ fontSize: 28, display: "block", marginBottom: 10 }}>{node.icon}</span>
                <div style={{ fontSize: 14, fontWeight: 700, color: "white", marginBottom: 4 }}>{node.label}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{node.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology */}
      <section style={{ padding: "80px 24px", background: "white" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-block", background: "#E8E4FF", color: "#2D1B8E", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 6, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 20 }}>
              Technology
            </div>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: "#180D62", margin: "0 0 20px", lineHeight: 1.2 }}>
              Built on Modern, Reliable Infrastructure
            </h2>
            <p style={{ fontSize: 16, color: "#6B6B9A", lineHeight: 1.75, marginBottom: 32 }}>
              DawoLink is built to healthcare-grade standards. Every technical decision is made with reliability, security, and scalability as the primary constraints.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[
                { icon: "☁️", title: "Cloud Infrastructure", desc: "Globally distributed, auto-scaling, zero single points of failure." },
                { icon: "🤖", title: "AI Systems", desc: "Machine learning for forecasting, detection, and smart automation." },
                { icon: "⚡", title: "Real-Time Analytics", desc: "Live data processing with sub-second dashboard updates." },
                { icon: "📶", title: "Offline-First", desc: "Local-first architecture that works during any connectivity interruption." },
                { icon: "📱", title: "Mobile-First Design", desc: "Built for tablets and phones — the way Somalia actually works." },
                { icon: "🔐", title: "Secure Architecture", desc: "End-to-end encryption, audit trails, and healthcare-grade data isolation." },
              ].map(t => (
                <div key={t.title} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{t.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#180D62", marginBottom: 3 }}>{t.title}</div>
                    <div style={{ fontSize: 12, color: "#6B6B9A", lineHeight: 1.55 }}>{t.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { value: "99.9%", label: "Uptime SLA" },
              { value: "<50ms", label: "API Response" },
              { value: "AES-256", label: "Encryption" },
              { value: "Daily", label: "Backups" },
            ].map(s => (
              <div key={s.label} style={{ background: "#F4F2FF", borderRadius: 20, padding: "32px 24px", border: "1px solid #E8E4FF", textAlign: "center" as const }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: "#2D1B8E", marginBottom: 6 }}>{s.value}</div>
                <div style={{ fontSize: 13, color: "#6B6B9A", fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section style={{ padding: "80px 24px", background: "#F4F2FF" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontSize: 38, fontWeight: 800, color: "#180D62", margin: "0 0 12px" }}>Our Roadmap</h2>
            <p style={{ fontSize: 17, color: "#6B6B9A" }}>From smart pharmacy operations to a continent-wide healthcare ecosystem.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {ROADMAP.map((r, i) => (
              <div key={r.phase} style={{ display: "flex", gap: 24, position: "relative" }}>
                {/* Timeline line */}
                {i < ROADMAP.length - 1 && (
                  <div style={{ position: "absolute", left: 28, top: 56, bottom: -24, width: 2, background: r.active ? r.color : "#E8E4FF", zIndex: 0 }} />
                )}
                {/* Node */}
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: r.active ? r.color : "#E8E4FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: 1, border: `3px solid ${r.active ? r.color : "#E8E4FF"}`, boxShadow: r.active ? `0 0 0 6px ${r.color}18` : "none" }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: r.active ? "white" : "#9B9BC0" }}>{i + 1}</span>
                </div>
                <div style={{ background: "white", borderRadius: 20, padding: "24px 28px", border: `1px solid ${r.active ? r.color + "33" : "#E8E4FF"}`, flex: 1, marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: r.color, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{r.phase}</span>
                      <h4 style={{ fontSize: 17, fontWeight: 800, color: "#180D62", margin: "2px 0 0" }}>{r.title}</h4>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: r.active ? r.color : "#9B9BC0", background: r.active ? `${r.color}14` : "#F4F2FF", padding: "4px 12px", borderRadius: 6, whiteSpace: "nowrap" as const }}>
                      {r.status}
                    </span>
                  </div>
                  <p style={{ fontSize: 14, color: "#6B6B9A", lineHeight: 1.7, margin: 0 }}>{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact */}
      <section style={{ padding: "80px 24px", background: "white" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontSize: 38, fontWeight: 800, color: "#180D62", margin: "0 0 12px" }}>Who DawoLink Serves</h2>
            <p style={{ fontSize: 17, color: "#6B6B9A" }}>Every stakeholder in the healthcare ecosystem benefits from the network.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
            {[
              { icon: "🏥", title: "Pharmacies", color: "#2D1B8E", points: ["Better operational efficiency", "Reduced inventory losses", "Real-time business intelligence", "AI-powered automation"] },
              { icon: "👥", title: "Customers", color: "#00C897", points: ["Improved medicine access", "Faster checkout service", "Online ordering & delivery", "Better patient safety"] },
              { icon: "🚚", title: "Suppliers", color: "#F59E0B", points: ["Better demand visibility", "Streamlined procurement", "Performance analytics", "Direct pharmacy connections"] },
              { icon: "🏛️", title: "Healthcare System", color: "#8B5CF6", points: ["National medicine intelligence", "Shortage early warnings", "Counterfeit detection", "Healthcare data insights"] },
            ].map(s => (
              <div key={s.title} style={{ background: "#F4F2FF", borderRadius: 22, padding: "32px 24px", border: "1px solid #E8E4FF" }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: `${s.color}14`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 16 }}>
                  {s.icon}
                </div>
                <h4 style={{ fontSize: 17, fontWeight: 800, color: "#180D62", marginBottom: 16 }}>{s.title}</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {s.points.map(p => (
                    <div key={p} style={{ display: "flex", gap: 8 }}>
                      <span style={{ color: s.color, fontWeight: 800, fontSize: 12 }}>✓</span>
                      <span style={{ fontSize: 13, color: "#374151" }}>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners & Integrations */}
      <section style={{ padding: "72px 24px", background: "#F4F2FF", borderTop: "1px solid #E8E4FF" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h2 style={{ fontSize: 30, fontWeight: 800, color: "#180D62", margin: "0 0 10px" }}>Integrations & Partnerships</h2>
            <p style={{ fontSize: 15, color: "#6B6B9A" }}>Built-in support for Somalia&apos;s payment infrastructure.</p>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap", marginBottom: 32 }}>
            {[
              { name: "EVC Plus", color: "#E31837", desc: "Hormuud Telecom" },
              { name: "Zaad", color: "#009A44", desc: "Telesom" },
              { name: "Sahal", color: "#0066CC", desc: "Somtel" },
              { name: "Premier Wallet", color: "#8B5CF6", desc: "Premier Bank" },
            ].map(p => (
              <div key={p.name} style={{ background: "white", borderRadius: 16, padding: "20px 28px", border: `2px solid ${p.color}22`, textAlign: "center" as const, minWidth: 140 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: p.color, margin: "0 auto 10px" }} />
                <div style={{ fontSize: 15, fontWeight: 800, color: "#180D62" }}>{p.name}</div>
                <div style={{ fontSize: 11, color: "#9B9BC0", marginTop: 3 }}>{p.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "#9B9BC0" }}>Coming soon: Hospital integrations, insurance providers, supplier networks, and government healthcare systems.</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: "100px 24px", background: "linear-gradient(150deg,#0d0825 0%,#180D62 50%,#2D1B8E 100%)", textAlign: "center" as const }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(30px,4.5vw,50px)", fontWeight: 800, color: "white", margin: "0 0 20px", lineHeight: 1.15 }}>
            Join the Future of Smart Pharmacy Operations
          </h2>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.6)", marginBottom: 44, lineHeight: 1.75, maxWidth: 560, margin: "0 auto 44px" }}>
            DawoLink is building something much bigger than a pharmacy app. It is Somalia&apos;s smart medicine infrastructure. Be part of it.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/login" style={{ padding: "16px 38px", borderRadius: 14, fontWeight: 700, color: "white", background: "linear-gradient(90deg,#00C897,#009E78)", fontSize: 16, textDecoration: "none", boxShadow: "0 8px 32px rgba(0,200,151,0.35)" }}>
              Start Free Trial
            </Link>
            <Link href="/pricing" style={{ padding: "16px 38px", borderRadius: 14, fontWeight: 700, fontSize: 16, color: "white", border: "1px solid rgba(255,255,255,0.2)", textDecoration: "none", background: "rgba(255,255,255,0.06)" }}>
              View Pricing
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
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.75, maxWidth: 240 }}>Somalia&apos;s smart pharmacy infrastructure. One platform. Every pharmacy. Connected forever.</p>
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
