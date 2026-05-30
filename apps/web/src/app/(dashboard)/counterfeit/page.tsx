"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ScanLine, CheckCircle, AlertTriangle, XCircle, History } from "lucide-react";

const RESULT_META: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  VERIFIED:    { label: "Verified",    color: "text-green-700",  bg: "bg-green-50 border-green-300",  icon: CheckCircle },
  SUSPICIOUS:  { label: "Suspicious",  color: "text-amber-700",  bg: "bg-amber-50 border-amber-300",  icon: AlertTriangle },
  COUNTERFEIT: { label: "Counterfeit", color: "text-red-700",    bg: "bg-red-50 border-red-300",      icon: XCircle },
  UNVERIFIED:  { label: "Unverified",  color: "text-gray-600",   bg: "bg-gray-50 border-gray-300",    icon: AlertTriangle },
};

export default function CounterfeitPage() {
  const [tab, setTab] = useState<"scan" | "history">("scan");
  const [form, setForm] = useState({ medicineName: "", batchNumber: "", barcode: "" });
  const [result, setResult] = useState<any>(null);

  const scanMutation = useMutation({
    mutationFn: (dto: typeof form) => api.post("/v1/counterfeit/scan", { ...dto, scannerType: "STAFF" }).then(r => r.data),
    onSuccess: (data) => setResult(data),
  });

  const { data: history = [] } = useQuery<any[]>({
    queryKey: ["counterfeit-history"],
    queryFn: () => api.get("/v1/counterfeit/history").then(r => r.data),
    enabled: tab === "history",
  });

  const { data: stats } = useQuery({
    queryKey: ["counterfeit-stats"],
    queryFn: () => api.get("/v1/counterfeit/stats").then(r => r.data),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center">
          <ScanLine className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Counterfeit Detection</h1>
          <p className="text-sm text-gray-500">Verify medicine authenticity and batch recalls</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total Scans",  value: stats.total,       color: "bg-gray-50 text-gray-700" },
            { label: "Verified",     value: stats.verified,    color: "bg-green-50 text-green-700" },
            { label: "Suspicious",   value: stats.suspicious,  color: "bg-amber-50 text-amber-700" },
            { label: "Counterfeit",  value: stats.counterfeit, color: "bg-red-50 text-red-700" },
          ].map(s => (
            <div key={s.label} className={`rounded-xl p-4 text-center ${s.color}`}>
              <p className="text-2xl font-black">{s.value}</p>
              <p className="text-xs font-medium mt-0.5 opacity-70">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-200">
        {[{ id: "scan", label: "Scan Medicine", icon: ScanLine }, { id: "history", label: "Scan History", icon: History }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition -mb-px ${tab === t.id ? "border-orange-600 text-orange-600" : "border-transparent text-gray-500"}`}>
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "scan" && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
            {[
              { k: "medicineName", l: "Medicine Name *", ph: "e.g. Amoxicillin 500mg" },
              { k: "batchNumber",  l: "Batch Number",    ph: "e.g. BN2024-0123" },
              { k: "barcode",      l: "Barcode",         ph: "Scan or enter barcode" },
            ].map(f => (
              <div key={f.k}>
                <label className="block text-sm font-semibold text-gray-600 mb-1">{f.l}</label>
                <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  placeholder={f.ph} value={(form as any)[f.k]} onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))} />
              </div>
            ))}

            <button onClick={() => { setResult(null); scanMutation.mutate(form); }}
              disabled={!form.medicineName || scanMutation.isPending}
              className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
              <ScanLine className="w-5 h-5" />
              {scanMutation.isPending ? "Scanning…" : "Scan for Counterfeit"}
            </button>
          </div>

          {result && (() => {
            const meta = RESULT_META[result.result] ?? RESULT_META.UNVERIFIED;
            return (
              <div className={`border-2 rounded-2xl p-6 ${meta.bg}`}>
                <div className="flex items-center gap-3 mb-3">
                  <meta.icon className={`w-8 h-8 ${meta.color}`} />
                  <div>
                    <p className={`text-xl font-black ${meta.color}`}>{meta.label}</p>
                    <p className="text-sm text-gray-500">{result.medicineName}</p>
                  </div>
                </div>
                <p className={`text-sm font-medium ${meta.color}`}>{result.message}</p>
                {result.recall && (
                  <div className="mt-3 bg-white bg-opacity-60 rounded-xl p-3">
                    <p className="text-xs font-bold text-red-700 mb-1">⚠️ Active Recall</p>
                    <p className="text-xs text-gray-600">Reason: {result.recall.reason}</p>
                    {result.recall.batchNumber && <p className="text-xs text-gray-600">Batch: {result.recall.batchNumber}</p>}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-2">
          {(history as any[]).length === 0 ? <p className="text-center py-10 text-gray-400">No scans yet</p> : (
            history.map((s: any) => {
              const meta = RESULT_META[s.result] ?? RESULT_META.UNVERIFIED;
              return (
                <div key={s.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3">
                  <meta.icon className={`w-5 h-5 flex-shrink-0 ${meta.color}`} />
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900">{s.medicineName}</p>
                    <p className="text-xs text-gray-400">{s.batchNumber ? `Batch: ${s.batchNumber} · ` : ""}{new Date(s.scannedAt).toLocaleString()}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${meta.bg} ${meta.color}`}>{meta.label}</span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
