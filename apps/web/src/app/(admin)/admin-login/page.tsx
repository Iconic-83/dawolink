"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/v1/admin/auth/login", { email, password });
      localStorage.setItem("admin_token", res.data.token);
      router.push("/admin");
    } catch {
      setError("Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #180D62 0%, #2D1B8E 60%, #1A3A6E 100%)" }}>
      <div className="w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <img src="/logo.png" alt="DawoLink" className="w-10 h-10 rounded-xl" style={{ objectFit: "contain" }} />
            <span className="text-2xl font-bold text-white">
              Dawo<span style={{ color: "#00C897" }}>Link</span>
            </span>
          </div>
          <p className="text-sm font-medium" style={{ color: "#7DEBCE" }}>Platform Control Center</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-8"
          style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          <h2 className="text-xl font-semibold text-white mb-6">Super Admin Login</h2>

          {error && (
            <div className="mb-4 rounded-lg px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#FCA5A5" }}>
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1.5" style={{ color: "#C4BBFF" }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
                placeholder="admin@dawolink.so"
              />
            </div>
            <div>
              <label className="block text-sm mb-1.5" style={{ color: "#C4BBFF" }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3 rounded-xl font-semibold text-white text-sm transition disabled:opacity-60"
            style={{ background: "linear-gradient(90deg, #00C897, #009E78)" }}
          >
            {loading ? "Signing in..." : "Sign In to Platform"}
          </button>
        </form>
      </div>
    </div>
  );
}
