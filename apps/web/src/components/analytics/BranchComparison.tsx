"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PageSpinner } from "@/components/ui/Spinner";

export function BranchComparison() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["branch-comparison"],
    queryFn: () => api.get("/v1/analytics/branches").then(r => r.data),
  });

  const formatted = (data as any[]).map(d => ({
    name: d.branchName,
    Revenue: Number(d.monthlyRevenue),
    Transactions: Number(d.transactionCount),
  }));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900">Branch Comparison</h3>
        <p className="text-xs text-gray-400">Monthly revenue by branch</p>
      </div>

      {isLoading ? <PageSpinner /> : formatted.length === 0 ? (
        <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No branch data</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={formatted} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false}
                tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+"k" : v}`}
              />
              <Tooltip
                formatter={(v: number, n: string) => [n === "Revenue" ? formatCurrency(v) : `${v} txns`, n]}
                contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb" }}
              />
              <Bar dataKey="Revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {(data as any[]).map((b: any) => (
              <div key={b.branchId} className="bg-gray-50 rounded-xl px-3 py-2">
                <p className="text-xs font-medium text-gray-700 truncate">{b.branchName}</p>
                <p className="text-sm font-bold text-gray-900">{formatCurrency(Number(b.monthlyRevenue))}</p>
                <p className="text-xs text-gray-400">{b.transactionCount} transactions</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
