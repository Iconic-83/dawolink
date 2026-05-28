"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const PLAN_INFO: Record<string, { price: string; color: string; features: string[] }> = {
  STARTER: { price: "$29/mo", color: "#4A8FE5", features: ["1 branch", "5 staff", "Inventory + POS", "Basic analytics"] },
  PROFESSIONAL: { price: "$79/mo", color: "#2D1B8E", features: ["5 branches", "Unlimited staff", "All features", "Priority support"] },
  ENTERPRISE: { price: "Custom", color: "#180D62", features: ["Unlimited everything", "API access", "Custom domain", "SLA"] },
};

export default function BillingPage() {
  const { data: sub, isLoading } = useQuery<any>({
    queryKey: ["subscription"],
    queryFn: () => api.get("/v1/billing/subscription").then(r => r.data),
  });

  if (isLoading) return <div className="p-8" style={{ color: "#6B6B9A" }}>Loading...</div>;

  const info = sub ? PLAN_INFO[sub.plan] : null;
  const daysLeft = sub ? Math.ceil((new Date(sub.currentPeriodEnd).getTime() - Date.now()) / 86400000) : 0;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "#180D62" }}>Billing & Subscription</h1>

      {!sub ? (
        <div className="bg-white rounded-2xl p-8 text-center" style={{ border: "1px solid #E8E4FF" }}>
          <div className="text-4xl mb-3">💳</div>
          <h2 className="font-bold text-lg mb-2" style={{ color: "#180D62" }}>No Active Subscription</h2>
          <p className="text-sm mb-4" style={{ color: "#6B6B9A" }}>Contact DawoLink support to activate your subscription.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Current Plan */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm" style={{ border: "1px solid #E8E4FF" }}>
            <h2 className="font-semibold mb-4" style={{ color: "#2D1B8E" }}>Current Plan</h2>
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="text-3xl font-bold mb-1" style={{ color: info?.color }}>{sub.plan}</div>
                <div className="text-2xl font-semibold" style={{ color: "#180D62" }}>{info?.price}</div>
                <div className="text-sm mt-1" style={{ color: "#9B9BC0" }}>{sub.billingCycle === "ANNUAL" ? "Billed annually" : "Billed monthly"}</div>
              </div>
              <span className="px-3 py-1 rounded-full text-sm font-medium" style={{
                background: sub.status === "ACTIVE" ? "rgba(0,200,151,0.1)" : sub.status === "TRIALING" ? "rgba(74,143,229,0.1)" : "rgba(239,68,68,0.1)",
                color: sub.status === "ACTIVE" ? "#00C897" : sub.status === "TRIALING" ? "#4A8FE5" : "#EF4444",
              }}>
                {sub.status === "TRIALING" ? "Free Trial" : sub.status}
              </span>
            </div>
            <div className="rounded-xl p-4 mb-4" style={{ background: "#F4F2FF" }}>
              <div className="flex justify-between text-sm mb-1">
                <span style={{ color: "#6B6B9A" }}>Current period</span>
                <span className="font-medium" style={{ color: daysLeft <= 7 ? "#EF4444" : "#180D62" }}>{daysLeft} days remaining</span>
              </div>
              <div className="w-full rounded-full h-2" style={{ background: "#E8E4FF" }}>
                <div className="h-2 rounded-full" style={{ background: daysLeft <= 7 ? "#EF4444" : "#00C897", width: `${Math.max(5, Math.min(100, (daysLeft / 30) * 100))}%` }} />
              </div>
              <div className="flex justify-between text-xs mt-1" style={{ color: "#9B9BC0" }}>
                <span>{new Date(sub.currentPeriodStart).toLocaleDateString()}</span>
                <span>{new Date(sub.currentPeriodEnd).toLocaleDateString()}</span>
              </div>
            </div>
            <ul className="space-y-1">
              {info?.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <span style={{ color: "#00C897" }}>✓</span>
                  <span style={{ color: "#374151" }}>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Invoices */}
          <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ border: "1px solid #E8E4FF" }}>
            <h2 className="font-semibold mb-4" style={{ color: "#2D1B8E" }}>Payment History</h2>
            {!sub.invoices?.length ? (
              <p className="text-sm" style={{ color: "#9B9BC0" }}>No invoices yet.</p>
            ) : (
              <div className="space-y-3">
                {sub.invoices.slice(0, 6).map((inv: any) => (
                  <div key={inv.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: "#E8E4FF" }}>
                    <div>
                      <div className="text-sm font-medium" style={{ color: "#180D62" }}>{inv.invoiceNo}</div>
                      <div className="text-xs" style={{ color: "#9B9BC0" }}>{new Date(inv.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold" style={{ color: "#00C897" }}>${inv.amount}</div>
                      <span className="text-xs" style={{ color: inv.status === "PAID" ? "#00C897" : "#EF4444" }}>{inv.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
