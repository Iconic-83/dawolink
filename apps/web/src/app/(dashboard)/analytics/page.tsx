"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { StatCard } from "@/components/analytics/StatCard";
import { RevenueChart } from "@/components/analytics/RevenueChart";
import { TopMedicinesChart } from "@/components/analytics/TopMedicinesChart";
import { PaymentBreakdown } from "@/components/analytics/PaymentBreakdown";
import { BranchComparison } from "@/components/analytics/BranchComparison";
import { OnlineOrdersAnalytics } from "@/components/analytics/OnlineOrdersAnalytics";
import { formatCurrency } from "@/lib/utils";
import { ChevronDown, RefreshCw, Store, ShoppingBag } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

type Tab = "instore" | "online";

export default function AnalyticsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("instore");
  const [selectedBranch, setSelectedBranch] = useState("");

  const { data: branches = [] } = useQuery<any[]>({
    queryKey: ["branches"],
    queryFn: () => api.get("/v1/pharmacy/branches").then(r => r.data),
  });

  const { data: dashboard, isLoading } = useQuery<any>({
    queryKey: ["dashboard"],
    queryFn: () => api.get("/v1/analytics/dashboard").then(r => r.data),
  });

  const { data: todaySummary } = useQuery<any>({
    queryKey: ["daily-summary", selectedBranch],
    queryFn: () =>
      api.get(`/v1/pos/branches/${selectedBranch}/summary`).then(r => r.data),
    enabled: !!selectedBranch,
  });

  const avgTx = dashboard?.today.transactions > 0
    ? dashboard.today.revenue / dashboard.today.transactions
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Revenue, performance & trends</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Tab switcher */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setTab("instore")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                tab === "instore" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Store className="h-3.5 w-3.5" /> In-Store
            </button>
            <button
              onClick={() => setTab("online")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                tab === "online" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <ShoppingBag className="h-3.5 w-3.5" /> Online Orders
            </button>
          </div>

          <button
            onClick={() => qc.invalidateQueries()}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
            title="Refresh all data"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {tab === "instore" && (
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
          )}
        </div>
      </div>

      {/* Online Orders tab */}
      {tab === "online" && <OnlineOrdersAnalytics />}

      {/* In-Store tab content */}
      {tab === "instore" && <>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(dashboard?.today.revenue ?? 0)}
          sub={`${dashboard?.today.transactions ?? 0} transactions`}
          icon="💰"
          color="blue"
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(dashboard?.month.revenue ?? 0)}
          sub="Current month"
          icon="📈"
          color="green"
        />
        <StatCard
          title="Avg. Transaction"
          value={formatCurrency(avgTx)}
          sub="Today's average"
          icon="🧾"
          color="orange"
        />
        <StatCard
          title="Active Medicines"
          value={dashboard?.inventory.totalMedicines ?? 0}
          sub={`${dashboard?.inventory.lowStockCount ?? 0} low stock`}
          icon="💊"
          color="purple"
        />
      </div>

      {/* Today at a glance */}
      {todaySummary && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
          <p className="text-blue-200 text-sm font-medium mb-3">Today at a Glance — {todaySummary.date}</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-blue-200 text-xs">Revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(todaySummary.totalRevenue)}</p>
            </div>
            <div>
              <p className="text-blue-200 text-xs">Transactions</p>
              <p className="text-2xl font-bold">{todaySummary.transactionCount}</p>
            </div>
            <div>
              <p className="text-blue-200 text-xs">Avg. per sale</p>
              <p className="text-2xl font-bold">
                {formatCurrency(todaySummary.transactionCount > 0 ? todaySummary.totalRevenue / todaySummary.transactionCount : 0)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Revenue chart — full width */}
      <RevenueChart />

      {/* Bottom row: Top Medicines + Payment Breakdown + Branch Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <TopMedicinesChart branchId={selectedBranch} />
        </div>
        <div className="space-y-4">
          <PaymentBreakdown branchId={selectedBranch} />
        </div>
        <div>
          <BranchComparison />
        </div>
      </div>

      {/* Inventory health */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Inventory Health</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Medicines",  value: dashboard?.inventory.totalMedicines ?? 0,   color: "bg-blue-50 text-blue-700",   bar: "bg-blue-500" },
            { label: "Low Stock Items",  value: dashboard?.inventory.lowStockCount ?? 0,    color: "bg-orange-50 text-orange-700", bar: "bg-orange-500" },
            { label: "Expiring (30d)",   value: dashboard?.inventory.expiringCount ?? 0,    color: "bg-red-50 text-red-700",     bar: "bg-red-500" },
            { label: "Healthy Items",
              value: Math.max(0, (dashboard?.inventory.totalMedicines ?? 0) - (dashboard?.inventory.lowStockCount ?? 0)),
              color: "bg-emerald-50 text-emerald-700", bar: "bg-emerald-500",
            },
          ].map(item => {
            const total = dashboard?.inventory.totalMedicines || 1;
            const pct   = Math.min(100, Math.round((item.value / total) * 100));
            return (
              <div key={item.label} className={`rounded-xl p-4 ${item.color}`}>
                <p className="text-xs font-medium opacity-70">{item.label}</p>
                <p className="text-3xl font-bold mt-1">{item.value}</p>
                <div className="mt-2 h-1.5 rounded-full bg-black/10 overflow-hidden">
                  <div className={`h-full rounded-full ${item.bar}`} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs opacity-60 mt-1">{pct}% of catalog</p>
              </div>
            );
          })}
        </div>
      </div>

      </>} {/* end tab === "instore" */}
    </div>
  );
}
