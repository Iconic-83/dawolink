"use client";

import { useQuery } from "@tanstack/react-query";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { api } from "@/lib/api";
import dayjs from "dayjs";

export function RevenueTrendChart() {
  const { data = [] } = useQuery<any[]>({
    queryKey: ["revenue-trend"],
    queryFn: () => api.get("/v1/analytics/revenue-trend?days=30").then((r) => r.data),
  });

  const formatted = data.map((d: any) => ({
    date: dayjs(d.date).format("MMM D"),
    revenue: Number(d.revenue),
    transactions: Number(d.transactions),
  }));

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ border: "1px solid #E8E4FF" }}>
      <h3 className="font-semibold mb-4" style={{ color: "#2D1B8E" }}>Revenue Trend (30 days)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={formatted}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00C897" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#00C897" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E4FF" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6B6B9A" }} />
          <YAxis tick={{ fontSize: 11, fill: "#6B6B9A" }} />
          <Tooltip
            contentStyle={{ borderRadius: "12px", border: "1px solid #E8E4FF", fontSize: 12 }}
            formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#00C897"
            fill="url(#revGrad)"
            strokeWidth={2.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
