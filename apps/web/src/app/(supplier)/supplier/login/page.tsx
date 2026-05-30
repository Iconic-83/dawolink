"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supplierApi, setSupplierToken } from "@/lib/supplier-auth";
import { Truck } from "lucide-react";

export default function SupplierLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const { data } = await supplierApi.post("/v1/supplier-portal/auth/login", { email, password });
      setSupplierToken(data.token);
      router.push("/supplier/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Invalid credentials");
    } finally { setLoading(false); }
  }

  const inp = "w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: "linear-gradient(135deg,#180D62,#2D1B8E)" }}>
            <Truck className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            Dawo<span style={{ color: "#00C897" }}>Link</span>
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Supplier Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@supplier.com" className={inp} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" className={inp} required />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60"
            style={{ background: "linear-gradient(90deg,#00C897,#009E78)" }}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
