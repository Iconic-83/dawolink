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
import { ChevronDown, RefreshCw, Store, ShoppingBag, Truck, Users, TrendingUp } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

type Tab = "instore" | "online" | "suppliers" | "staff" | "regional";

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
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 flex-wrap">
            {[
              { key: "instore",   label: "In-Store",      icon: Store },
              { key: "online",    label: "Online",        icon: ShoppingBag },
              { key: "suppliers", label: "Suppliers",     icon: Truck },
              { key: "staff",     label: "Staff",         icon: Users },
              { key: "regional",  label: "Demand",        icon: TrendingUp },
            ].map(({ key, label, icon: Icon }) => (
              <button key={key}
                onClick={() => setTab(key as Tab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  tab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
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

      {tab === "suppliers"  && <SupplierAnalyticsTab />}
      {tab === "staff"      && <StaffAnalyticsTab />}
      {tab === "regional"   && <RegionalAnalyticsTab />}
    </div>
  );
}

// ── Supplier Analytics Tab ─────────────────────────────────────────────────

function SupplierAnalyticsTab() {
  const { data, isLoading } = useQuery<any>({
    queryKey: ["analytics-suppliers"],
    queryFn: () => api.get("/v1/analytics/suppliers").then(r => r.data),
  });

  if (isLoading) return <div className="flex items-center justify-center py-20 text-gray-400">Loading…</div>;

  const { topSuppliers = [], paymentSummary = {}, monthlySpend = [], avgDelivery = [] } = data ?? {};
  const totalDebt = paymentSummary.unpaid + paymentSummary.partial;

  return (
    <div className="space-y-6">
      {/* Payment summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Unpaid", value: paymentSummary.unpaid, color: "#DC2626" },
          { label: "Partially Paid", value: paymentSummary.partial, color: "#D97706" },
          { label: "Fully Paid", value: paymentSummary.paid, color: "#059669" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs font-medium text-gray-500 mb-1">{s.label}</p>
            <p className="text-2xl font-black" style={{ color: s.color }}>${(s.value ?? 0).toFixed(0)}</p>
          </div>
        ))}
      </div>

      {/* Monthly spend */}
      {monthlySpend.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="font-semibold text-gray-900 mb-4">Monthly Procurement Spend</p>
          <div className="flex items-end gap-3 h-32">
            {monthlySpend.map((m: any) => {
              const max = Math.max(...monthlySpend.map((x: any) => x.spend));
              const h = max > 0 ? (m.spend / max) * 100 : 0;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <p className="text-xs text-gray-500">${(m.spend / 1000).toFixed(1)}k</p>
                  <div className="w-full rounded-t-lg" style={{ height: `${h}%`, background: "linear-gradient(180deg,#4A8FE5,#2563EB)", minHeight: 4 }} />
                  <p className="text-xs font-medium text-gray-600">{m.month}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top suppliers table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="font-semibold text-gray-900">Top Suppliers by Value</p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="px-5 py-3 text-left">Supplier</th>
              <th className="px-5 py-3 text-right">Orders</th>
              <th className="px-5 py-3 text-right">Total Value</th>
              <th className="px-5 py-3 text-right">Completed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {topSuppliers.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-400">No purchase orders yet</td></tr>
            ) : topSuppliers.map((s: any, i: number) => (
              <tr key={s.id} className="hover:bg-gray-50/50">
                <td className="px-5 py-3 font-medium text-gray-900">
                  <span className="text-gray-300 mr-2">#{i + 1}</span>{s.name}
                </td>
                <td className="px-5 py-3 text-right text-gray-600">{s.totalOrders}</td>
                <td className="px-5 py-3 text-right font-semibold text-gray-900">${s.totalValue.toFixed(0)}</td>
                <td className="px-5 py-3 text-right">
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium">{s.completed}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Avg delivery time */}
      {avgDelivery.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="font-semibold text-gray-900 mb-4">Average Delivery Time</p>
          <div className="space-y-3">
            {avgDelivery.map((d: any) => (
              <div key={d.name} className="flex items-center gap-3">
                <p className="text-sm text-gray-700 w-40 truncate">{d.name}</p>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-2 rounded-full bg-blue-400" style={{ width: `${Math.min((d.avgDays / 14) * 100, 100)}%` }} />
                </div>
                <p className="text-sm font-semibold text-gray-700 w-16 text-right">{d.avgDays}d</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Staff Analytics Tab ────────────────────────────────────────────────────

function StaffAnalyticsTab() {
  const [days, setDays] = useState(30);
  const { data, isLoading } = useQuery<any>({
    queryKey: ["analytics-staff", days],
    queryFn: () => api.get(`/v1/analytics/staff?days=${days}`).then(r => r.data),
  });

  const { salesByStaff = [], activityByStaff = [] } = data ?? {};

  // Aggregate activity per person
  const activityMap: Record<string, Record<string, number>> = {};
  activityByStaff.forEach((a: any) => {
    if (!activityMap[a.name]) activityMap[a.name] = {};
    activityMap[a.name][a.action] = a.count;
  });

  if (isLoading) return <div className="flex items-center justify-center py-20 text-gray-400">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-600">Staff performance over the last</p>
        <select value={days} onChange={e => setDays(+e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm focus:outline-none">
          <option value={7}>7 days</option>
          <option value={30}>30 days</option>
          <option value={90}>90 days</option>
        </select>
      </div>

      {/* Sales leaderboard */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="font-semibold text-gray-900">Sales Leaderboard</p>
        </div>
        {salesByStaff.length === 0 ? (
          <p className="px-5 py-8 text-center text-gray-400 text-sm">No sales data for this period</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 text-left">Staff</th>
                <th className="px-5 py-3 text-right">Sales</th>
                <th className="px-5 py-3 text-right">Revenue</th>
                <th className="px-5 py-3 text-right">Avg Sale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {salesByStaff.map((s: any, i: number) => (
                <tr key={s.name} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-300">#{i + 1}</span>
                      <div>
                        <p className="font-medium text-gray-900">{s.name}</p>
                        <p className="text-xs text-gray-400">{s.role.replace(/_/g, " ")}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right text-gray-600">{s.transactions}</td>
                  <td className="px-5 py-3 text-right font-bold text-gray-900">${s.revenue.toFixed(0)}</td>
                  <td className="px-5 py-3 text-right text-gray-500">${s.avgSale.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Activity breakdown */}
      {Object.keys(activityMap).length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="font-semibold text-gray-900 mb-4">Activity Breakdown</p>
          <div className="space-y-3">
            {Object.entries(activityMap).map(([name, actions]) => (
              <div key={name} className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium text-gray-900 w-36 truncate">{name}</p>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(actions).map(([action, count]) => (
                    <span key={action} className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-700">
                      {action.replace(/_/g, " ")}: {count}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Regional Demand Tab ────────────────────────────────────────────────────

function RegionalAnalyticsTab() {
  const [days, setDays] = useState(30);
  const { data, isLoading } = useQuery<any>({
    queryKey: ["analytics-regional", days],
    queryFn: () => api.get(`/v1/analytics/regional?days=${days}`).then(r => r.data),
  });

  const { topMedicines = [], categoryTrend = [], paymentMethods = [] } = data ?? {};
  const maxQty = Math.max(...topMedicines.map((m: any) => m.totalQty), 1);
  const maxCat = Math.max(...categoryTrend.map((c: any) => c.revenue), 1);

  if (isLoading) return <div className="flex items-center justify-center py-20 text-gray-400">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-600">Demand data for the last</p>
        <select value={days} onChange={e => setDays(+e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm focus:outline-none">
          <option value={7}>7 days</option>
          <option value={30}>30 days</option>
          <option value={90}>90 days</option>
        </select>
      </div>

      {/* Top medicines */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="font-semibold text-gray-900 mb-4">Most Sold Medicines</p>
        {topMedicines.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-6">No sales data for this period</p>
        ) : (
          <div className="space-y-3">
            {topMedicines.map((m: any, i: number) => (
              <div key={m.name} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-300 w-5">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{m.name}</p>
                    <p className="text-xs text-gray-400 ml-2 flex-shrink-0">{m.totalQty} units</p>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-1.5 rounded-full" style={{
                      width: `${(m.totalQty / maxQty) * 100}%`,
                      background: "linear-gradient(90deg,#00C897,#009E78)",
                    }} />
                  </div>
                </div>
                <p className="text-xs font-semibold text-gray-700 w-14 text-right">${m.revenue.toFixed(0)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category breakdown */}
      {categoryTrend.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="font-semibold text-gray-900 mb-4">Revenue by Category</p>
          <div className="space-y-3">
            {categoryTrend.map((c: any) => (
              <div key={c.category} className="flex items-center gap-3">
                <p className="text-sm text-gray-700 w-28 truncate">{c.category}</p>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-2 rounded-full bg-indigo-400" style={{ width: `${(c.revenue / maxCat) * 100}%` }} />
                </div>
                <p className="text-sm font-semibold text-gray-700 w-16 text-right">${c.revenue.toFixed(0)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment methods */}
      {paymentMethods.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="font-semibold text-gray-900 mb-4">Payment Methods</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {paymentMethods.map((p: any) => (
              <div key={p.method} className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs font-medium text-gray-500 mb-1">{p.method.replace(/_/g, " ")}</p>
                <p className="text-lg font-black text-gray-900">{p.count}</p>
                <p className="text-xs text-gray-400">${p.revenue.toFixed(0)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
