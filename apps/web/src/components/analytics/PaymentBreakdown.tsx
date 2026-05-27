"use client";

import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

const PAYMENT_COLORS: Record<string, string> = {
  CASH:           "#22c55e",
  EVC_PLUS:       "#3b82f6",
  ZAAD:           "#10b981",
  SAHAL:          "#6366f1",
  PREMIER_WALLET: "#8b5cf6",
  CREDIT:         "#f59e0b",
  MIXED:          "#94a3b8",
};

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Cash", EVC_PLUS: "EVC Plus", ZAAD: "Zaad",
  SAHAL: "Sahal", PREMIER_WALLET: "Premier", CREDIT: "Credit", MIXED: "Mixed",
};

export function PaymentBreakdown({ branchId }: { branchId: string }) {
  const { data: transactions = [] } = useQuery<any[]>({
    queryKey: ["transactions-recent", branchId],
    queryFn: () =>
      api.get(`/v1/pos/branches/${branchId}/transactions?limit=200`).then(r => r.data),
    enabled: !!branchId,
  });

  const breakdown = (transactions as any[]).reduce((acc: Record<string, number>, tx: any) => {
    const method = tx.paymentMethod ?? "CASH";
    acc[method] = (acc[method] ?? 0) + Number(tx.total);
    return acc;
  }, {});

  const data = Object.entries(breakdown).map(([key, value]) => ({
    name: PAYMENT_LABELS[key] ?? key,
    value: Number(value),
    color: PAYMENT_COLORS[key] ?? "#94a3b8",
  })).sort((a, b) => b.value - a.value);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-900 mb-1">Payment Methods</h3>
        <p className="text-xs text-gray-400 mb-4">Revenue by payment type</p>
        <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No transaction data yet</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="mb-3">
        <h3 className="font-semibold text-gray-900">Payment Methods</h3>
        <p className="text-xs text-gray-400">Revenue by payment type</p>
      </div>

      <div className="flex items-center gap-4">
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={72} dataKey="value" strokeWidth={2} stroke="#fff">
              {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
            <Tooltip
              formatter={(v: number) => [formatCurrency(v), "Revenue"]}
              contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb" }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="flex-1 space-y-2">
          {data.map(d => (
            <div key={d.name} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
              <span className="text-xs text-gray-600 flex-1">{d.name}</span>
              <div className="text-right">
                <p className="text-xs font-semibold text-gray-900">{formatCurrency(d.value)}</p>
                <p className="text-xs text-gray-400">{((d.value / total) * 100).toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
