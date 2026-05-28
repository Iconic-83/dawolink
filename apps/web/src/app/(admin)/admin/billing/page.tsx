"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function AdminBillingPage() {
  const [overview, setOverview] = useState<any>(null);
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : "";
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    Promise.all([
      api.get("/v1/billing/admin/overview", { headers }),
      api.get("/v1/billing/admin/subscriptions", { headers }),
    ]).then(([o, s]) => {
      setOverview(o.data);
      setSubs(s.data.subscriptions ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center" style={{ color: "#6B6B9A" }}>Loading...</div>;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "#180D62" }}>Billing & Subscriptions</h1>
        <p className="text-sm mt-1" style={{ color: "#6B6B9A" }}>Platform revenue and subscription management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[
          { label: "MRR", value: `$${(overview?.mrr ?? 0).toLocaleString()}`, color: "#00C897" },
          { label: "ARR", value: `$${(overview?.arr ?? 0).toLocaleString()}`, color: "#2D1B8E" },
          { label: "Active", value: overview?.active ?? 0, color: "#10B981" },
          { label: "Past Due", value: overview?.pastDue ?? 0, color: "#EF4444" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm" style={{ border: "1px solid #E8E4FF" }}>
            <div className="text-sm mb-1" style={{ color: "#6B6B9A" }}>{s.label}</div>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Subscriptions table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{ border: "1px solid #E8E4FF" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "#E8E4FF" }}>
          <h2 className="font-semibold" style={{ color: "#2D1B8E" }}>Active Subscriptions</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid #E8E4FF" }}>
              {["Pharmacy", "Plan", "Amount", "Cycle", "Status", "Expires"].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "#2D1B8E" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!subs.length ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center" style={{ color: "#9B9BC0" }}>No subscriptions yet</td></tr>
            ) : subs.map((s: any) => (
              <tr key={s.id} className="border-b last:border-0" style={{ borderColor: "#E8E4FF" }}>
                <td className="px-5 py-3 font-medium" style={{ color: "#180D62" }}>{s.pharmacy?.name}</td>
                <td className="px-5 py-3"><span className="px-2 py-0.5 rounded-full text-xs" style={{ background: "#E8E4FF", color: "#2D1B8E" }}>{s.plan}</span></td>
                <td className="px-5 py-3 font-medium" style={{ color: "#00C897" }}>${s.amount}</td>
                <td className="px-5 py-3 text-xs" style={{ color: "#6B6B9A" }}>{s.billingCycle}</td>
                <td className="px-5 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs" style={{
                    background: s.status === "ACTIVE" ? "rgba(0,200,151,0.1)" : s.status === "TRIALING" ? "rgba(74,143,229,0.1)" : "rgba(239,68,68,0.1)",
                    color: s.status === "ACTIVE" ? "#00C897" : s.status === "TRIALING" ? "#4A8FE5" : "#EF4444"
                  }}>{s.status}</span>
                </td>
                <td className="px-5 py-3 text-xs" style={{ color: "#6B6B9A" }}>{new Date(s.currentPeriodEnd).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
