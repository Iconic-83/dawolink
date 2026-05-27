import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex items-center justify-center">
      <div className="text-center text-white px-6">
        <div className="mb-6 inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 text-sm font-medium backdrop-blur">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Pharmacy Management Platform — Somalia & Africa
        </div>

        <h1 className="text-6xl font-bold mb-4 tracking-tight">
          Dawo<span className="text-blue-300">Link</span>
        </h1>
        <p className="text-xl text-blue-200 mb-10 max-w-2xl mx-auto">
          The connected operating network for modern pharmacies. Built for Somalia, designed for Africa.
        </p>

        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/login"
            className="bg-white text-blue-900 font-semibold px-8 py-3 rounded-lg hover:bg-blue-50 transition"
          >
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-blue-500 transition border border-blue-500"
          >
            Dashboard
          </Link>
        </div>

        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto text-left">
          {[
            { label: "Inventory Intelligence", icon: "📦" },
            { label: "Smart POS", icon: "💳" },
            { label: "Expiry Tracking", icon: "⏰" },
            { label: "Analytics Dashboard", icon: "📊" },
            { label: "Multi-Branch", icon: "🏪" },
            { label: "Supplier Management", icon: "🤝" },
            { label: "EVC Plus / Zaad", icon: "📱" },
            { label: "AI Forecasting", icon: "🤖" },
          ].map((f) => (
            <div key={f.label} className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10">
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="text-sm font-medium text-blue-100">{f.label}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
