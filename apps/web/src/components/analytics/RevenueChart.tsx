"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { api } from "@/lib/api";
import dayjs from "dayjs";
import { formatCurrency } from "@/lib/utils";

const RANGES = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

export function RevenueChart() {
  const [range, setRange] = useState(30);

  const { data = [], isLoading } = useQuery({
    queryKey: ["revenue-trend", range],
    queryFn: () => api.get(`/v1/analytics/revenue-trend?days=${range}`).then(r => r.data),
  });

  const formatted = (data as any[]).map(d => ({
    date: dayjs(d.date).format(range <= 7 ? "ddd" : "MMM D"),
    Revenue: Number(d.revenue),
    Transactions: Number(d.transactions),
  }));

  const totalRev = formatted.reduce((s, d) => s + d.Revenue, 0);
  const totalTx  = formatted.reduce((s, d) => s + d.Transactions, 0);
  const avgDaily  = formatted.length ? totalRev / formatted.length : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h3 className="font-semibold text-gray-900">Revenue Trend</h3>
          <p className="text-xs text-gray-400">
            {formatCurrency(totalRev)} total · {totalTx} transactions · {formatCurrency(avgDaily)}/day avg
          </p>
        </div>
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

      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={formatted} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            axisLine={false} tickLine={false}
            tickFormatter={v => `$${v >= 1000 ? (v / 1000).toFixed(1) + "k" : v}`}
          />
          <Tooltip
            formatter={(v: number, name: string) => [name === "Revenue" ? formatCurrency(v) : v, name]}
            contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Area
            type="monotone" dataKey="Revenue"
            stroke="#3b82f6" strokeWidth={2}
            fill="url(#revGrad)" dot={false} activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
