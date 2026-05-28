import Link from "next/link";

export default function AboutPage() {
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

      {/* Hero */}
      <div className="py-20 px-6" style={{ background: "linear-gradient(135deg, #180D62 0%, #2D1B8E 100%)" }}>
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-white mb-4">Our Mission</h1>
          <p className="text-xl" style={{ color: "rgba(255,255,255,0.75)" }}>
            To connect Somalia's medicine ecosystem — making every pharmacy more efficient, every patient safer, and every medicine more traceable.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16 space-y-16">
        {/* Story */}
        <div className="bg-white rounded-2xl p-8" style={{ border: "1px solid #E8E4FF" }}>
          <h2 className="text-2xl font-bold mb-4" style={{ color: "#180D62" }}>The Story</h2>
          <div className="space-y-4 text-base leading-relaxed" style={{ color: "#374151" }}>
            <p>Somalia has thousands of pharmacies serving millions of patients — but most operate with paper records, no expiry tracking, and no way to know what medicine is available where.</p>
            <p>DawoLink was built to change that. We started with a simple question: <em>what if every pharmacy in Somalia had the same technology as a modern hospital?</em></p>
            <p>Today, DawoLink is a full platform: POS, inventory, analytics, supplier management, multi-branch control — all built specifically for the Somali healthcare context, with native support for EVC Plus, Zaad, and Sahal payments.</p>
          </div>
        </div>

        {/* Vision */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon: "🏥", title: "Connected Pharmacies", desc: "Every pharmacy on one network — sharing intelligence, not data." },
            { icon: "🌍", title: "National Medicine DB", desc: "A single source of truth for medicines available in Somalia." },
            { icon: "🤖", title: "AI-Powered Insights", desc: "Predict shortages before they happen. Route medicines where they're needed." },
          ].map(v => (
            <div key={v.title} className="bg-white rounded-2xl p-6 text-center" style={{ border: "1px solid #E8E4FF" }}>
              <div className="text-4xl mb-3">{v.icon}</div>
              <h3 className="font-bold mb-2" style={{ color: "#180D62" }}>{v.title}</h3>
              <p className="text-sm" style={{ color: "#6B6B9A" }}>{v.desc}</p>
            </div>
          ))}
        </div>

        {/* Values */}
        <div className="bg-white rounded-2xl p-8" style={{ border: "1px solid #E8E4FF" }}>
          <h2 className="text-2xl font-bold mb-6" style={{ color: "#180D62" }}>What We Believe</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: "Data belongs to you", desc: "Your pharmacy data is yours. We never share, sell, or use it for anything beyond running your software." },
              { title: "Affordable by default", desc: "World-class software should not be reserved for large corporations. Our pricing is built for Somali pharmacies." },
              { title: "Security is non-negotiable", desc: "Patient privacy and medicine security are critical. Every action is audited. Every access is controlled." },
              { title: "Built in Africa, for Africa", desc: "We understand local payment systems, supply chains, regulations, and culture. This isn't a generic SaaS with a new logo." },
            ].map(v => (
              <div key={v.title} className="flex gap-3">
                <span className="mt-1 w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#00C897", marginTop: "6px" }} />
                <div>
                  <h4 className="font-semibold mb-1" style={{ color: "#180D62" }}>{v.title}</h4>
                  <p className="text-sm" style={{ color: "#6B6B9A" }}>{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/login" className="inline-block px-10 py-4 rounded-xl font-bold text-white text-lg" style={{ background: "linear-gradient(90deg, #2D1B8E, #3D2AAD)" }}>
            Join DawoLink Today
          </Link>
        </div>
      </div>
    </div>
  );
}
