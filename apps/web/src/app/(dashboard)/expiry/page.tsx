"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ExpiryBadge, expiryDaysLeft } from "@/components/expiry/ExpiryBadge";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageSpinner } from "@/components/ui/Spinner";
import { formatCurrency } from "@/lib/utils";
import {
  AlertTriangle, AlertCircle, Clock, CheckCircle,
  ChevronDown, Search, Calendar, Package,
} from "lucide-react";

type Filter = "all" | "expired" | "critical" | "warning" | "upcoming";

const FILTERS: { id: Filter; label: string; icon: React.ElementType; color: string }[] = [
  { id: "all", label: "All", icon: Package, color: "text-gray-500" },
  { id: "expired", label: "Expired", icon: AlertCircle, color: "text-red-500" },
  { id: "critical", label: "< 30 days", icon: AlertTriangle, color: "text-orange-500" },
  { id: "warning", label: "30–60 days", icon: Clock, color: "text-yellow-500" },
  { id: "upcoming", label: "60–90 days", icon: CheckCircle, color: "text-blue-500" },
];

export default function ExpiryPage() {
  const [selectedBranch, setSelectedBranch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const { data: branches = [] } = useQuery<any[]>({
    queryKey: ["branches"],
    queryFn: () => api.get("/v1/pharmacy/branches").then(r => r.data),
  });

  const { data: dashboard } = useQuery({
    queryKey: ["expiry-dashboard", selectedBranch],
    queryFn: () => api.get(`/v1/expiry/branches/${selectedBranch}/dashboard`).then(r => r.data),
    enabled: !!selectedBranch,
  });

  const { data: expiringSoon = [], isLoading } = useQuery<any[]>({
    queryKey: ["expiring-soon", selectedBranch],
    queryFn: () => api.get(`/v1/expiry/branches/${selectedBranch}/expiring?days=90`).then(r => r.data),
    enabled: !!selectedBranch,
  });

  const { data: expired = [] } = useQuery<any[]>({
    queryKey: ["expired", selectedBranch],
    queryFn: () => api.get(`/v1/expiry/branches/${selectedBranch}/expired`).then(r => r.data),
    enabled: !!selectedBranch,
  });

  const allItems = [...expired, ...expiringSoon];

  const filtered = allItems.filter(item => {
    const days = item.expiryDate ? expiryDaysLeft(item.expiryDate) : -999;
    const matchSearch = !search || item.medicine?.name?.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    switch (filter) {
      case "expired": return days < 0;
      case "critical": return days >= 0 && days <= 30;
      case "warning": return days > 30 && days <= 60;
      case "upcoming": return days > 60 && days <= 90;
      default: return true;
    }
  }).sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  const totalAtRisk = allItems.reduce((sum, i) => sum + Number(i.sellingPrice) * i.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expiry Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track and act on near-expiry & expired stock</p>
        </div>
        <div className="relative">
          <select
            value={selectedBranch}
            onChange={e => setSelectedBranch(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Expired"
          value={dashboard?.expired ?? 0}
          sub="Remove immediately"
          icon={<AlertCircle className="h-5 w-5" />}
          color="bg-red-50 border-red-100 text-red-600"
          valueCls="text-red-700"
        />
        <SummaryCard
          label="Critical (< 30d)"
          value={dashboard?.critical ?? 0}
          sub="Urgent action needed"
          icon={<AlertTriangle className="h-5 w-5" />}
          color="bg-orange-50 border-orange-100 text-orange-600"
          valueCls="text-orange-700"
        />
        <SummaryCard
          label="Warning (30–60d)"
          value={dashboard?.warning ?? 0}
          sub="Apply discounts or transfer"
          icon={<Clock className="h-5 w-5" />}
          color="bg-yellow-50 border-yellow-100 text-yellow-600"
          valueCls="text-yellow-700"
        />
        <SummaryCard
          label="Stock at Risk"
          value={formatCurrency(totalAtRisk)}
          sub="Total value of at-risk stock"
          icon={<Calendar className="h-5 w-5" />}
          color="bg-blue-50 border-blue-100 text-blue-600"
          valueCls="text-blue-700"
        />
      </div>

      {/* Main table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Table toolbar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 flex-wrap">
          {/* Filter pills */}
          <div className="flex gap-1.5">
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  filter === f.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <f.icon className="h-3.5 w-3.5" />
                {f.label}
                {f.id !== "all" && dashboard && (
                  <span className={`ml-0.5 ${filter === f.id ? "opacity-80" : ""}`}>
                    ({dashboard[f.id] ?? 0})
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="ml-auto relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search medicine…"
              className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
            />
          </div>
        </div>

        {isLoading ? <PageSpinner /> : filtered.length === 0 ? (
          <EmptyState
            icon={filter === "expired" ? "✅" : "📅"}
            title={filter === "expired" ? "No expired stock!" : "No items match this filter"}
            sub={filter === "all" ? "All stock is within safe expiry range" : undefined}
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">Medicine</th>
                <th className="px-4 py-3 text-center">Qty</th>
                <th className="px-4 py-3">Batch</th>
                <th className="px-4 py-3">Expiry Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Value at Risk</th>
                <th className="px-4 py-3">Suggested Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((item: any) => {
                const days = expiryDaysLeft(item.expiryDate);
                const value = Number(item.sellingPrice) * item.quantity;

                let action = "";
                if (days < 0) action = "Remove from shelf";
                else if (days <= 14) action = "Apply 50% discount";
                else if (days <= 30) action = "Apply 30% discount";
                else if (days <= 60) action = "Transfer or promote";
                else action = "Monitor";

                let rowBg = "";
                if (days < 0) rowBg = "bg-red-50/40";
                else if (days <= 30) rowBg = "bg-orange-50/30";

                return (
                  <tr key={item.id} className={`hover:bg-gray-50/60 transition-colors ${rowBg}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-8 rounded-full flex-shrink-0 ${
                          days < 0 ? "bg-red-400" : days <= 30 ? "bg-orange-400" : days <= 60 ? "bg-yellow-400" : "bg-blue-400"
                        }`} />
                        <div>
                          <p className="font-medium text-gray-900">{item.medicine?.name}</p>
                          <p className="text-xs text-gray-400">{item.medicine?.category} · {item.medicine?.form}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-gray-900">{item.quantity}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                      {item.batchNo ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${days < 0 ? "text-red-600" : days <= 30 ? "text-orange-600" : "text-gray-700"}`}>
                        {new Date(item.expiryDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ExpiryBadge expiryDate={item.expiryDate} />
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-700">
                      {formatCurrency(value)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${
                        days < 0
                          ? "bg-red-100 text-red-700"
                          : days <= 30
                          ? "bg-orange-100 text-orange-700"
                          : "bg-blue-50 text-blue-600"
                      }`}>
                        {action}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span>Showing {filtered.length} item{filtered.length !== 1 ? "s" : ""}</span>
            <span>Total value at risk: <span className="font-semibold text-gray-600">{formatCurrency(totalAtRisk)}</span></span>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sub, icon, color, valueCls }: {
  label: string; value: number | string; sub: string;
  icon: React.ReactNode; color: string; valueCls: string;
}) {
  return (
    <div className={`rounded-xl border p-4 ${color}`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm font-medium opacity-80">{label}</span>
        {icon}
      </div>
      <p className={`text-3xl font-bold ${valueCls}`}>{value}</p>
      <p className="text-xs opacity-70 mt-1">{sub}</p>
    </div>
  );
}
