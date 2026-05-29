"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import dayjs from "dayjs";
import { api } from "@/lib/api";
import { StatCard } from "./StatCard";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const RANGES = [
  { label: "7d",  days: 7  },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

const STATUS_LABEL: Record<string, string> = {
  PENDING:          "Pending",
  CONFIRMED:        "Confirmed",
  PREPARING:        "Preparing",
  READY_FOR_PICKUP: "Ready",
  OUT_FOR_DELIVERY: "Delivering",
  DELIVERED:        "Delivered",
  CANCELLED:        "Cancelled",
};

const STATUS_COLOR: Record<string, string> = {
  PENDING:          "#F59E0B",
  CONFIRMED:        "#3B82F6",
  PREPARING:        "#8B5CF6",
  READY_FOR_PICKUP: "#10B981",
  OUT_FOR_DELIVERY: "#0EA5E9",
  DELIVERED:        "#22C55E",
  CANCELLED:        "#EF4444",
};

const DELIVERY_COLORS = { DELIVERY: "#6366F1", PICKUP: "#10B981" };

const PAYMENT_COLORS: Record<string, string> = {
  CASH: "#22c55e", EVC_PLUS: "#3b82f6", ZAAD: "#10b981", SAHAL: "#6366f1",
};
const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Cash", EVC_PLUS: "EVC Plus", ZAAD: "Zaad", SAHAL: "Sahal",
};

function PctChange({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-gray-400">—</span>;
  const positive = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${positive ? "text-emerald-600" : "text-red-500"}`}>
      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {positive ? "+" : ""}{value}% vs prev
    </span>
  );
}

function Card({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 p-5 ${className}`}>
      <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
      No data for this period
    </div>
  );
}

export function OnlineOrdersAnalytics() {
  const [range, setRange] = useState(30);

  const { data: analytics, isLoading } = useQuery<any>({
    queryKey: ["order-analytics", range],
    queryFn: () => api.get(`/v1/analytics/orders?days=${range}`).then(r => r.data),
  });

  const { data: trend = [] } = useQuery<any[]>({
    queryKey: ["order-trend", range],
    queryFn: () => api.get(`/v1/analytics/orders/trend?days=${range}`).then(r => r.data),
  });

  const trendFormatted = trend.map(d => ({
    date: dayjs(d.date).format(range <= 7 ? "ddd" : "MMM D"),
    Orders: Number(d.orders),
    Revenue: Number(d.revenue),
  }));

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-gray-100 rounded-2xl h-28" />)}
        </div>
        <div className="bg-gray-100 rounded-2xl h-64" />
      </div>
    );
  }

  const t = analytics?.totals ?? {};
  const vs = analytics?.vsLastPeriod ?? {};

  // Build status funnel in pipeline order
  const statusOrder = ["PENDING","CONFIRMED","PREPARING","READY_FOR_PICKUP","OUT_FOR_DELIVERY","DELIVERED","CANCELLED"];
  const statusMap: Record<string, number> = {};
  (analytics?.byStatus ?? []).forEach((s: any) => { statusMap[s.status] = s.count; });
  const statusData = statusOrder
    .map(s => ({ status: STATUS_LABEL[s] ?? s, count: statusMap[s] ?? 0, color: STATUS_COLOR[s] }))
    .filter(s => s.count > 0);

  const maxStatus = Math.max(...statusData.map(s => s.count), 1);

  // Delivery donut
  const deliveryData = (analytics?.byDelivery ?? []).map((d: any) => ({
    name: d.type === "DELIVERY" ? "Delivery" : "Pickup",
    value: d.count,
    revenue: d.revenue,
    color: DELIVERY_COLORS[d.type as keyof typeof DELIVERY_COLORS] ?? "#94a3b8",
  }));

  // Payment donut
  const paymentData = (analytics?.byPayment ?? []).map((p: any) => ({
    name: PAYMENT_LABELS[p.method] ?? p.method,
    value: p.count,
    revenue: p.revenue,
    color: PAYMENT_COLORS[p.method] ?? "#94a3b8",
  }));

  // Peak hours — fill all 24 slots
  const hoursMap: Record<number, number> = {};
  (analytics?.peakHours ?? []).forEach((h: any) => { hoursMap[h.hour] = h.count; });
  const hoursData = Array.from({ length: 24 }, (_, h) => ({
    hour: h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`,
    orders: hoursMap[h] ?? 0,
  }));

  const topMeds = analytics?.topMedicines ?? [];
  const maxMed = Math.max(...topMeds.map((m: any) => m.qty), 1);

  const citiesData = analytics?.byCity ?? [];

  return (
    <div className="space-y-5">

      {/* Range picker */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing last <strong>{range} days</strong>
          {t.orders > 0 && <> · {t.orders} orders</>}
        </p>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {RANGES.map(r => (
            <button
              key={r.days}
              onClick={() => setRange(r.days)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                range === r.days ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{t.orders ?? 0}</p>
          <div className="mt-1"><PctChange value={vs.orders ?? null} /></div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Online Revenue</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(t.revenue ?? 0)}</p>
          <div className="mt-1"><PctChange value={vs.revenue ?? null} /></div>
        </div>
        <StatCard
          title="Avg Order Value"
          value={formatCurrency(t.avgOrderValue ?? 0)}
          sub="Per completed order"
          icon="🧾"
          color="orange"
        />
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Fulfillment Rate</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{t.fulfillmentRate ?? 0}%</p>
          <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${t.fulfillmentRate ?? 0}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">{t.cancellationRate ?? 0}% cancellation rate</p>
        </div>
      </div>

      {/* Orders trend */}
      <Card title="Orders & Revenue Trend">
        {trendFormatted.length === 0 ? <EmptyChart /> : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendFormatted} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }}
                tickFormatter={v => `$${v}`} />
              <Tooltip
                formatter={(v: any, name: string) =>
                  name === "Revenue" ? [formatCurrency(v), name] : [v, name]}
              />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="Orders" stroke="#6366F1"
                strokeWidth={2} fill="url(#ordersGrad)" />
              <Area yAxisId="right" type="monotone" dataKey="Revenue" stroke="#10B981"
                strokeWidth={2} fill="url(#revenueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Middle row: status funnel + delivery split + payment split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Status pipeline */}
        <Card title="Order Pipeline">
          {statusData.length === 0 ? <EmptyChart /> : (
            <div className="space-y-2.5">
              {statusData.map(s => (
                <div key={s.status}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700">{s.status}</span>
                    <span className="font-bold text-gray-900">{s.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${(s.count / maxStatus) * 100}%`, background: s.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Delivery vs Pickup */}
        <Card title="Delivery vs Pickup">
          {deliveryData.length === 0 ? <EmptyChart /> : (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={deliveryData} dataKey="value" cx="50%" cy="50%"
                    innerRadius={40} outerRadius={60} paddingAngle={3}>
                    {deliveryData.map((d: any, i: number) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => [v, "orders"]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-1">
                {deliveryData.map((d: any) => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span className="text-gray-700">{d.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">{d.value}</span>
                      <span className="text-gray-400 text-xs ml-2">{formatCurrency(d.revenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* Payment methods */}
        <Card title="Payment Methods">
          {paymentData.length === 0 ? <EmptyChart /> : (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={paymentData} dataKey="value" cx="50%" cy="50%"
                    innerRadius={40} outerRadius={60} paddingAngle={3}>
                    {paymentData.map((d: any, i: number) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => [v, "orders"]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-1">
                {paymentData.map((d: any) => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span className="text-gray-700">{d.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">{d.value}</span>
                      <span className="text-gray-400 text-xs ml-2">{formatCurrency(d.revenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Bottom row: top medicines + peak hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Top ordered medicines */}
        <Card title="Top Ordered Medicines">
          {topMeds.length === 0 ? <EmptyChart /> : (
            <div className="space-y-3">
              {topMeds.map((m: any, i: number) => (
                <div key={m.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-gray-400 w-5 flex-shrink-0">#{i + 1}</span>
                      <span className="font-medium text-gray-800 truncate">{m.name}</span>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <span className="font-bold text-gray-900">{m.qty} units</span>
                      <span className="text-gray-400 text-xs ml-2">{formatCurrency(m.revenue)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-violet-500"
                      style={{ width: `${(m.qty / maxMed) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Peak order hours */}
        <Card title="Peak Order Hours">
          {hoursData.every(h => h.orders === 0) ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hoursData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={2} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="orders" fill="#6366F1" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* City distribution — only shown if there's delivery data */}
      {citiesData.length > 0 && (
        <Card title="Orders by City (Delivery)">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {citiesData.map((c: any) => (
              <div key={c.city} className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{c.count}</p>
                <p className="text-xs text-gray-500 mt-0.5 font-medium">{c.city}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
