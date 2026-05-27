"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { PageSpinner } from "@/components/ui/Spinner";

const COLORS = ["#3b82f6","#6366f1","#8b5cf6","#a78bfa","#c4b5fd","#ddd6fe","#ede9fe","#f5f3ff","#faf5ff","#f0f9ff"];

export function TopMedicinesChart({ branchId }: { branchId: string }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["top-medicines", branchId],
    queryFn: () =>
      api.get(`/v1/analytics/branches/${branchId}/top-medicines?limit=10`).then(r => r.data),
    enabled: !!branchId,
  });

  const formatted = (data as any[]).map(d => ({
    name: d.name?.length > 14 ? d.name.slice(0, 14) + "…" : d.name,
    fullName: d.name,
    sold: Number(d.total_sold),
    revenue: Number(d.total_revenue),
  }));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900">Top Medicines</h3>
        <p className="text-xs text-gray-400">By units sold — last 30 days</p>
      </div>
      {isLoading ? <PageSpinner /> : formatted.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No sales data yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={formatted} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
            <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} width={90} />
            <Tooltip
              formatter={(v: number, name: string) => [name === "sold" ? `${v} units` : formatCurrency(v), name === "sold" ? "Sold" : "Revenue"]}
              labelFormatter={(_, p) => p?.[0]?.payload?.fullName ?? ""}
              contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb" }}
            />
            <Bar dataKey="sold" radius={[0, 6, 6, 0]}>
              {formatted.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
