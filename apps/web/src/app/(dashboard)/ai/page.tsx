"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Bot, TrendingUp, Package, ShieldAlert, Send, Loader2, Sparkles, AlertTriangle, CheckCircle } from "lucide-react";

type Tab = "pharmacist" | "forecast" | "optimize" | "fraud";

const TABS = [
  { id: "pharmacist", label: "AI Pharmacist", icon: Bot, desc: "Drug info, interactions & alternatives" },
  { id: "forecast",   label: "Demand Forecast", icon: TrendingUp, desc: "Predict medicine demand & trends" },
  { id: "optimize",   label: "Inventory AI",    icon: Package, desc: "Optimize stock levels & orders" },
  { id: "fraud",      label: "Fraud Detection", icon: ShieldAlert, desc: "Detect suspicious activity" },
] as const;

function PharmacistTab() {
  const [question, setQuestion] = useState("");
  const [medicine, setMedicine] = useState("");
  const [answer, setAnswer] = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: () => api.post("/v1/ai/pharmacist", { question, medicineName: medicine || undefined }).then(r => r.data),
    onSuccess: (data) => setAnswer(data.answer),
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-1">Medicine (optional)</label>
        <input
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          placeholder="e.g. Amoxicillin, Metformin, Paracetamol..."
          value={medicine}
          onChange={e => setMedicine(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-1">Your Question</label>
        <textarea
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
          rows={3}
          placeholder="e.g. What are the drug interactions? What's the adult dosage? Suggest alternatives..."
          value={question}
          onChange={e => setQuestion(e.target.value)}
        />
      </div>
      <button
        onClick={() => mutate()}
        disabled={isPending || !question.trim()}
        className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50 hover:bg-indigo-700 transition"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Ask AI Pharmacist
      </button>

      {answer && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Bot className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-semibold text-indigo-700">AI Pharmacist Response</span>
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

function ForecastTab() {
  const [branchId, setBranchId] = useState("");
  const { data: branches = [] } = useQuery<any[]>({
    queryKey: ["branches"],
    queryFn: () => api.get("/v1/pharmacy/branches").then(r => r.data),
  });
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["ai-forecast", branchId],
    queryFn: () => api.post("/v1/ai/demand-forecast", { branchId }).then(r => r.data),
    enabled: false,
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Analyzes your last 90 days of sales to predict upcoming demand, seasonal patterns, and potential shortages.</p>
      <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-full" value={branchId} onChange={e => setBranchId(e.target.value)}>
        <option value="">Select branch…</option>
        {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>
      <button
        onClick={() => refetch()}
        disabled={isLoading || !branchId}
        className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50 hover:bg-emerald-700 transition"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
        Generate Forecast
      </button>

      {data && (
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <p className="text-sm text-gray-700 font-medium">{data.summary}</p>
          </div>

          {data.seasonalAlerts?.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-amber-500" /> Seasonal Alerts</h4>
              <ul className="space-y-1">{data.seasonalAlerts.map((a: string, i: number) => (
                <li key={i} className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">• {a}</li>
              ))}</ul>
            </div>
          )}

          {data.forecasts?.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-2">Medicine Forecasts</h4>
              <div className="space-y-2">
                {data.forecasts.map((f: any, i: number) => (
                  <div key={i} className="bg-white border border-gray-100 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm text-gray-900">{f.medicine}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${f.trend === "rising" ? "bg-red-100 text-red-600" : f.trend === "declining" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"}`}>
                        {f.predictedChange} {f.trend}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{f.reason}</p>
                    <p className="text-xs text-indigo-600 font-medium mt-1">→ {f.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OptimizeTab() {
  const [branchId, setBranchId] = useState("");
  const { data: branches = [] } = useQuery<any[]>({
    queryKey: ["branches"],
    queryFn: () => api.get("/v1/pharmacy/branches").then(r => r.data),
  });
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["ai-optimize", branchId],
    queryFn: () => api.post("/v1/ai/inventory-optimize", { branchId }).then(r => r.data),
    enabled: false,
  });

  const ACTION_COLOR: Record<string, string> = {
    ORDER:    "bg-red-100 text-red-700",
    REDUCE:   "bg-blue-100 text-blue-700",
    TRANSFER: "bg-amber-100 text-amber-700",
    OK:       "bg-green-100 text-green-700",
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">AI analyzes current stock levels vs. sales velocity and recommends the optimal actions to save money and prevent stockouts.</p>
      <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-full" value={branchId} onChange={e => setBranchId(e.target.value)}>
        <option value="">Select branch…</option>
        {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>
      <button
        onClick={() => refetch()}
        disabled={isLoading || !branchId}
        className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50 hover:bg-purple-700 transition"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
        Optimize Inventory
      </button>

      {data && (
        <div className="space-y-4">
          {data.insight && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
              <p className="text-sm text-gray-700">{data.insight}</p>
            </div>
          )}

          {data.criticalStock?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-xs font-bold text-red-700 mb-1">⚠️ Critical — Running Out</p>
              <p className="text-sm text-red-600">{data.criticalStock.join(", ")}</p>
            </div>
          )}

          {data.recommendations?.length > 0 && (
            <div className="space-y-2">
              {data.recommendations.map((r: any, i: number) => (
                <div key={i} className="bg-white border border-gray-100 rounded-xl p-3 flex items-start gap-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg mt-0.5 ${ACTION_COLOR[r.action] ?? "bg-gray-100 text-gray-600"}`}>{r.action}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900">{r.medicine} {r.quantity ? `— ${r.quantity} units` : ""}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{r.reason}</p>
                  </div>
                  <span className={`text-xs font-semibold ${r.urgency === "HIGH" ? "text-red-600" : r.urgency === "MEDIUM" ? "text-amber-600" : "text-gray-400"}`}>{r.urgency}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FraudTab() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["ai-fraud"],
    queryFn: () => api.post("/v1/ai/fraud-detect", { days: 30 }).then(r => r.data),
    enabled: false,
  });

  const RISK_COLOR: Record<string, string> = {
    LOW: "text-green-600 bg-green-50 border-green-200",
    MEDIUM: "text-amber-600 bg-amber-50 border-amber-200",
    HIGH: "text-red-600 bg-red-50 border-red-200",
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">AI scans your last 30 days of audit logs to detect suspicious activity, inventory manipulation, and potential employee fraud.</p>
      <button
        onClick={() => refetch()}
        disabled={isLoading}
        className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50 hover:bg-red-700 transition"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
        Run Fraud Analysis
      </button>

      {data && (
        <div className="space-y-4">
          <div className={`border rounded-xl p-4 ${RISK_COLOR[data.riskLevel] ?? RISK_COLOR.LOW}`}>
            <p className="font-bold text-lg">Risk Level: {data.riskLevel}</p>
            <p className="text-sm mt-1">{data.summary}</p>
          </div>

          {data.alerts?.length > 0 ? (
            <div className="space-y-2">
              {data.alerts.map((a: any, i: number) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className={`w-4 h-4 ${a.severity === "HIGH" ? "text-red-500" : "text-amber-500"}`} />
                    <span className="font-semibold text-sm text-gray-900">{a.type}</span>
                  </div>
                  <p className="text-sm text-gray-600">{a.description}</p>
                  {a.actorHint && <p className="text-xs text-gray-400 mt-1">Actor: {a.actorHint}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded-xl p-3">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">No suspicious activity detected</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AiPage() {
  const [tab, setTab] = useState<Tab>("pharmacist");
  const { data: status } = useQuery({
    queryKey: ["ai-status"],
    queryFn: () => api.get("/v1/ai/status").then(r => r.data),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Intelligence</h1>
          <p className="text-sm text-gray-500">Powered by Claude AI</p>
        </div>
        {status && (
          <span className={`ml-auto text-xs font-semibold px-3 py-1 rounded-full ${status.enabled ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
            {status.enabled ? "● AI Active" : "○ AI Disabled"}
          </span>
        )}
      </div>

      {!status?.enabled && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
          <strong>AI not configured.</strong> Set <code className="bg-amber-100 px-1 rounded">ANTHROPIC_API_KEY</code> in your environment variables to enable AI features.
        </div>
      )}

      {/* Tab Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`p-3 rounded-xl border text-left transition ${tab === t.id ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-white hover:border-indigo-300"}`}
          >
            <t.icon className={`w-5 h-5 mb-1 ${tab === t.id ? "text-indigo-600" : "text-gray-400"}`} />
            <p className={`text-sm font-semibold ${tab === t.id ? "text-indigo-700" : "text-gray-700"}`}>{t.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        {tab === "pharmacist" && <PharmacistTab />}
        {tab === "forecast"   && <ForecastTab />}
        {tab === "optimize"   && <OptimizeTab />}
        {tab === "fraud"      && <FraudTab />}
      </div>
    </div>
  );
}
