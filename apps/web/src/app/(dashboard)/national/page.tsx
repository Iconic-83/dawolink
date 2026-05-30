"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AlertTriangle, TrendingUp, DollarSign, Activity, Bell, CheckCircle, Plus, X } from "lucide-react";

type Tab = "shortage" | "prices" | "trends" | "recalls";

const TABS = [
  { id: "shortage", label: "Shortage Map",      icon: AlertTriangle, color: "text-red-600" },
  { id: "prices",   label: "Price Intelligence", icon: DollarSign,   color: "text-blue-600" },
  { id: "trends",   label: "Disease Trends",     icon: Activity,     color: "text-purple-600" },
  { id: "recalls",  label: "Recall Alerts",      icon: Bell,         color: "text-amber-600" },
] as const;

function ShortageTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["national-shortage"],
    queryFn: () => api.get("/v1/national/shortage").then(r => r.data),
  });

  if (isLoading) return <div className="text-center py-10 text-gray-400">Scanning all pharmacies…</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-black text-red-600">{data?.critical ?? 0}</p>
          <p className="text-sm text-red-500 mt-1">Critical Shortages</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-black text-amber-600">{data?.totalShortages ?? 0}</p>
          <p className="text-sm text-amber-500 mt-1">Total Medicines Low</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-black text-blue-600">{data?.shortages?.[0]?.totalAffectedBranches ?? 0}</p>
          <p className="text-sm text-blue-500 mt-1">Most Affected Branches</p>
        </div>
      </div>

      <div className="space-y-2">
        {data?.shortages?.map((s: any, i: number) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-semibold text-gray-900">{s.medicine}</span>
                {s.genericName && <span className="text-xs text-gray-400 ml-2">{s.genericName}</span>}
                <span className="text-xs text-indigo-600 font-medium ml-2 bg-indigo-50 px-2 py-0.5 rounded-full">{s.category}</span>
              </div>
              <div className="flex gap-2">
                {s.criticalBranches > 0 && (
                  <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-1 rounded-lg">{s.criticalBranches} out of stock</span>
                )}
                <span className="text-xs font-bold bg-amber-100 text-amber-600 px-2 py-1 rounded-lg">{s.lowBranches} low stock</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {s.locations.slice(0, 5).map((l: any, j: number) => (
                <span key={j} className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full border">
                  {l.pharmacyName} · {l.city} · {l.quantity} left
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PricesTab() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["national-prices", search],
    queryFn: () => api.get(`/v1/national/prices${search ? `?medicine=${encodeURIComponent(search)}` : ""}`).then(r => r.data),
  });

  return (
    <div className="space-y-4">
      <input
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        placeholder="Search medicine…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      {isLoading ? <div className="text-center py-10 text-gray-400">Loading…</div> : (
        <div className="space-y-2">
          {data?.medicines?.map((m: any, i: number) => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-semibold text-gray-900">{m.medicine}</span>
                  <span className="text-xs text-gray-400 ml-2">{m.category}</span>
                </div>
                <span className="text-xs text-gray-400">{m.pharmacyCount} pharmacies</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-green-50 rounded-lg p-2">
                  <p className="text-sm font-black text-green-700">${m.minPrice.toFixed(2)}</p>
                  <p className="text-xs text-green-500">Lowest</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-2">
                  <p className="text-sm font-black text-blue-700">${m.avgPrice.toFixed(2)}</p>
                  <p className="text-xs text-blue-500">Average</p>
                </div>
                <div className="bg-red-50 rounded-lg p-2">
                  <p className="text-sm font-black text-red-700">${m.maxPrice.toFixed(2)}</p>
                  <p className="text-xs text-red-500">Highest</p>
                </div>
              </div>
              {m.priceSpread > 2 && (
                <p className="text-xs text-amber-600 mt-2 bg-amber-50 rounded-lg px-2 py-1">
                  ⚠️ High price spread (${m.priceSpread.toFixed(2)}) — prices vary significantly across pharmacies
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TrendsTab() {
  const [days, setDays] = useState("30");
  const { data, isLoading } = useQuery({
    queryKey: ["national-trends", days],
    queryFn: () => api.get(`/v1/national/trends?days=${days}`).then(r => r.data),
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {["7", "30", "90"].map(d => (
          <button key={d} onClick={() => setDays(d)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${days === d ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {d}d
          </button>
        ))}
      </div>

      {isLoading ? <div className="text-center py-10 text-gray-400">Analyzing trends…</div> : (
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-bold text-gray-700 mb-3 text-sm">Top Medicine Categories</h3>
            <div className="space-y-2">
              {data?.categoryTrends?.slice(0, 8).map((c: any, i: number) => (
                <div key={i} className="bg-white border border-gray-100 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm text-gray-900">{c.category}</span>
                    <span className="text-sm font-bold text-purple-600">{c.totalSold.toLocaleString()} units</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {c.topCities.map((ct: any, j: number) => (
                      <span key={j} className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">{ct.city}: {ct.count}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-bold text-gray-700 mb-3 text-sm">Top 20 Medicines</h3>
            <div className="space-y-1">
              {data?.topMedicines?.map((m: any, i: number) => (
                <div key={i} className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-3 py-2">
                  <span className="text-sm text-gray-700">{i + 1}. {m.medicine}</span>
                  <span className="text-xs font-bold text-purple-600">{m.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RecallsTab() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ medicineName: "", batchNumber: "", manufacturer: "", reason: "", severity: "HIGH" as "LOW" | "HIGH" | "CRITICAL" });

  const { data, isLoading } = useQuery({
    queryKey: ["national-recalls"],
    queryFn: () => api.get("/v1/national/recalls").then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (dto: typeof form) => api.post("/v1/national/recalls", dto).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["national-recalls"] }); setShowForm(false); setForm({ medicineName: "", batchNumber: "", manufacturer: "", reason: "", severity: "HIGH" }); },
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/v1/national/recalls/${id}/resolve`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["national-recalls"] }),
  });

  const SEV_COLOR: Record<string, string> = {
    LOW: "bg-amber-100 text-amber-700",
    HIGH: "bg-orange-100 text-orange-700",
    CRITICAL: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">Active medicine recalls — pharmacies are notified by email for HIGH/CRITICAL recalls.</p>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1 bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-700 transition">
          <Plus className="w-4 h-4" /> Issue Recall
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-red-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-red-700">Issue Medicine Recall</h3>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          {[
            { key: "medicineName", label: "Medicine Name *", required: true },
            { key: "batchNumber",  label: "Batch Number" },
            { key: "manufacturer", label: "Manufacturer" },
            { key: "reason",       label: "Reason *", required: true },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-semibold text-gray-600 mb-1">{f.label}</label>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Severity</label>
            <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value as any }))}>
              <option value="LOW">LOW</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>
          <button onClick={() => createMutation.mutate(form)} disabled={!form.medicineName || !form.reason || createMutation.isPending}
            className="w-full bg-red-600 text-white py-2 rounded-xl font-semibold text-sm disabled:opacity-50">
            {createMutation.isPending ? "Issuing…" : "Issue Recall & Notify Pharmacies"}
          </button>
        </div>
      )}

      {isLoading ? <div className="text-center py-10 text-gray-400">Loading…</div> : (
        <div className="space-y-2">
          {(data as any[])?.length === 0 && <p className="text-center py-8 text-gray-400">No active recalls</p>}
          {(data as any[])?.map((r: any) => (
            <div key={r.id} className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900">{r.medicineName}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${SEV_COLOR[r.severity]}`}>{r.severity}</span>
                  </div>
                  {r.batchNumber && <p className="text-xs text-gray-500">Batch: {r.batchNumber}</p>}
                  {r.manufacturer && <p className="text-xs text-gray-500">Manufacturer: {r.manufacturer}</p>}
                  <p className="text-sm text-gray-600 mt-1">{r.reason}</p>
                  <p className="text-xs text-gray-400 mt-1">Issued {new Date(r.issuedAt).toLocaleDateString()}</p>
                </div>
                <button onClick={() => resolveMutation.mutate(r.id)} className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-green-200 transition">
                  <CheckCircle className="w-3 h-3" /> Resolve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NationalPage() {
  const [tab, setTab] = useState<Tab>("shortage");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">National Intelligence</h1>
        <p className="text-sm text-gray-500 mt-1">Real-time visibility across all pharmacies in Somalia</p>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition -mb-px ${tab === t.id ? `border-indigo-600 ${t.color}` : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {tab === "shortage" && <ShortageTab />}
        {tab === "prices"   && <PricesTab />}
        {tab === "trends"   && <TrendsTab />}
        {tab === "recalls"  && <RecallsTab />}
      </div>
    </div>
  );
}
