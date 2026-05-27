"use client";

import { useQuery } from "@tanstack/react-query";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { api } from "@/lib/api";
import dayjs from "dayjs";

export function RevenueTrendChart() {
  const { data = [] } = useQuery({
    queryKey: ["revenue-trend"],
    queryFn: () => api.get("/v1/analytics/revenue-trend?days=30").then((r) => r.data),
  });

  const formatted = data.map((d: any) => ({
    date: dayjs(d.date).format("MMM D"),
    revenue: Number(d.revenue),
    transactions: Number(d.transactions),
  }));

  return (
    <div className="bg-white border rounded-xl p-5">
      <h3 className="font-semibold mb-4">Revenue Trend (30 days)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={formatted}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]} />
          <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#revGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
