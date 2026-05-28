"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

function StatCard({ label, value, sub, color }: { label: string; value: any; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ border: "1px solid #E8E4FF" }}>
      <div className="text-sm font-medium mb-1" style={{ color: "#6B6B9A" }}>{label}</div>
      <div className="text-3xl font-bold" style={{ color }}>{value}</div>
      {sub && <div className="text-xs mt-1" style={{ color: "#9B9BC0" }}>{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    api.get("/v1/admin/analytics", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { setStats(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center" style={{ color: "#6B6B9A" }}>Loading...</div>;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "#180D62" }}>Platform Overview</h1>
        <p className="text-sm mt-1" style={{ color: "#6B6B9A" }}>DawoLink ecosystem health at a glance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard label="Total Pharmacies" value={stats?.totalPharmacies ?? 0} color="#2D1B8E" />
        <StatCard label="Total Branches" value={stats?.totalBranches ?? 0} color="#00C897" />
        <StatCard label="Platform Users" value={stats?.totalUsers ?? 0} color="#4A8FE5" />
        <StatCard label="Total Transactions" value={(stats?.totalTransactions ?? 0).toLocaleString()} color="#F59E0B" />
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ border: "1px solid #E8E4FF" }}>
        <h2 className="font-semibold mb-4" style={{ color: "#2D1B8E" }}>Recently Joined Pharmacies</h2>
        {!stats?.recentPharmacies?.length ? (
          <p className="text-sm" style={{ color: "#9B9BC0" }}>No pharmacies yet.</p>
        ) : (
          <div className="space-y-3">
            {stats.recentPharmacies.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: "#E8E4FF" }}>
                <div>
                  <div className="font-medium text-sm" style={{ color: "#180D62" }}>{p.name}</div>
                  <div className="text-xs" style={{ color: "#9B9BC0" }}>{p.city} · {new Date(p.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "#E8E4FF", color: "#2D1B8E" }}>{p.plan}</span>
                  <span className="w-2 h-2 rounded-full" style={{ background: p.isActive ? "#00C897" : "#EF4444" }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
