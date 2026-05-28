"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";

const PLAN_INFO: Record<string, { price: string; annual: string; color: string; features: string[] }> = {
  STARTER:      { price: "$29", annual: "$290", color: "#4A8FE5", features: ["1 branch", "5 staff accounts", "Inventory + POS", "Expiry intelligence", "Basic analytics"] },
  PROFESSIONAL: { price: "$79", annual: "$790", color: "#2D1B8E", features: ["Up to 5 branches", "50 staff accounts", "All features", "Supplier & PO management", "Priority support"] },
  ENTERPRISE:   { price: "Custom", annual: "Custom", color: "#180D62", features: ["Unlimited branches", "Unlimited staff", "API access", "Custom domain", "Dedicated SLA"] },
};

const PAYMENT_METHODS = [
  { id: "EVC_PLUS",       label: "EVC Plus",       color: "#E34234", hint: "Send to: +252-61-DAWOLINK" },
  { id: "ZAAD",           label: "Zaad",            color: "#009E52", hint: "Send to: +252-63-DAWOLINK" },
  { id: "SAHAL",          label: "Sahal",           color: "#0071B9", hint: "Send to: +252-90-DAWOLINK" },
  { id: "PREMIER_WALLET", label: "Premier Wallet",  color: "#8B5CF6", hint: "Send to: +252-77-DAWOLINK" },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    ACTIVE:   { bg: "rgba(0,200,151,0.1)",  color: "#00C897", label: "Active" },
    TRIALING: { bg: "rgba(74,143,229,0.1)", color: "#4A8FE5", label: "Free Trial" },
    PAST_DUE: { bg: "rgba(239,68,68,0.1)",  color: "#EF4444", label: "Past Due" },
    CANCELLED:{ bg: "rgba(156,163,175,0.1)",color: "#9CA3AF", label: "Cancelled" },
    SUSPENDED:{ bg: "rgba(239,68,68,0.1)",  color: "#EF4444", label: "Suspended" },
  };
  const s = map[status] ?? map.PAST_DUE;
  return (
    <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

export default function BillingPage() {
  const qc = useQueryClient();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("PROFESSIONAL");
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "ANNUAL">("MONTHLY");
  const [method, setMethod] = useState("EVC_PLUS");
  const [reference, setReference] = useState("");

  const { data: sub, isLoading } = useQuery<any>({
    queryKey: ["subscription"],
    queryFn: () => api.get("/v1/billing/subscription").then(r => r.data),
  });

  const payMutation = useMutation({
    mutationFn: (body: any) => api.post("/v1/billing/pay", body).then(r => r.data),
    onSuccess: (data) => {
      toast.success(data.message ?? "Payment submitted! Subscription activated.");
      qc.invalidateQueries({ queryKey: ["subscription"] });
      setShowUpgrade(false);
      setReference("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message ?? "Payment failed. Check the reference and try again.");
    },
  });

  const handlePay = () => {
    if (!reference.trim()) { toast.error("Enter the payment reference number"); return; }
    const planPrices: Record<string, Record<string, number>> = {
      STARTER:      { MONTHLY: 29,  ANNUAL: 290 },
      PROFESSIONAL: { MONTHLY: 79,  ANNUAL: 790 },
    };
    const amount = planPrices[selectedPlan]?.[billingCycle] ?? 29;
    payMutation.mutate({ method, reference, amount, plan: selectedPlan, billingCycle });
  };

  if (isLoading) return <div style={{ padding: 32, color: "#6B6B9A" }}>Loading...</div>;

  const info = sub ? PLAN_INFO[sub.plan] : null;
  const daysLeft = sub ? Math.ceil((new Date(sub.currentPeriodEnd).getTime() - Date.now()) / 86400000) : 0;
  const selectedMethodInfo = PAYMENT_METHODS.find(m => m.id === method)!;
  const planPrice = selectedPlan === "ENTERPRISE" ? null : (billingCycle === "ANNUAL" ? PLAN_INFO[selectedPlan]?.annual : PLAN_INFO[selectedPlan]?.price);

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#180D62", margin: 0 }}>Billing & Subscription</h1>
        {sub && sub.status !== "CANCELLED" && (
          <button
            onClick={() => setShowUpgrade(v => !v)}
            style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "linear-gradient(90deg,#2D1B8E,#4A8FE5)", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
          >
            {showUpgrade ? "✕ Close" : "⬆ Upgrade / Renew"}
          </button>
        )}
      </div>

      {/* Trial warning banner */}
      {sub?.status === "TRIALING" && daysLeft <= 5 && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <span style={{ fontSize: 14, color: "#991B1B", fontWeight: 500 }}>
            Your free trial expires in <strong>{daysLeft} day{daysLeft !== 1 ? "s" : ""}</strong>. Pay now to keep access.
          </span>
          <button onClick={() => setShowUpgrade(true)} style={{ marginLeft: "auto", padding: "7px 16px", borderRadius: 8, border: "none", background: "#EF4444", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            Pay Now
          </button>
        </div>
      )}

      {/* Past due banner */}
      {sub?.status === "PAST_DUE" && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>🔒</span>
          <span style={{ fontSize: 14, color: "#991B1B", fontWeight: 500 }}>
            Your subscription has expired. Submit a payment to restore access.
          </span>
          <button onClick={() => setShowUpgrade(true)} style={{ marginLeft: "auto", padding: "7px 16px", borderRadius: 8, border: "none", background: "#EF4444", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            Restore Access
          </button>
        </div>
      )}

      {/* No subscription */}
      {!sub && (
        <div style={{ background: "white", borderRadius: 16, padding: 32, textAlign: "center", border: "1px solid #E8E4FF", marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
          <h2 style={{ fontWeight: 800, fontSize: 18, color: "#180D62", margin: "0 0 8px" }}>No Active Subscription</h2>
          <p style={{ fontSize: 14, color: "#6B6B9A", margin: "0 0 16px" }}>Choose a plan below to get started.</p>
          <button onClick={() => setShowUpgrade(true)} style={{ padding: "11px 28px", borderRadius: 10, border: "none", background: "linear-gradient(90deg,#00C897,#009E78)", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            Choose a Plan
          </button>
        </div>
      )}

      {/* Current subscription card */}
      {sub && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
          {/* Plan */}
          <div style={{ gridColumn: "span 2", background: "white", borderRadius: 16, padding: 24, border: "1px solid #E8E4FF" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 13, color: "#9B9BC0", marginBottom: 4 }}>Current Plan</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: info?.color }}>{sub.plan}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#180D62", marginTop: 2 }}>{info?.price}<span style={{ fontSize: 13, fontWeight: 400, color: "#9B9BC0" }}>/mo</span></div>
              </div>
              <StatusBadge status={sub.status} />
            </div>

            <div style={{ background: "#F4F2FF", borderRadius: 10, padding: 14, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: "#6B6B9A" }}>Period</span>
                <span style={{ fontWeight: 600, color: daysLeft <= 7 ? "#EF4444" : "#180D62" }}>{daysLeft > 0 ? `${daysLeft} days left` : "Expired"}</span>
              </div>
              <div style={{ height: 6, background: "#E8E4FF", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", background: daysLeft <= 7 ? "#EF4444" : "#00C897", width: `${Math.max(2, Math.min(100, (daysLeft / (sub.billingCycle === "ANNUAL" ? 365 : 30)) * 100))}%`, borderRadius: 3, transition: "width 0.3s" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9B9BC0", marginTop: 4 }}>
                <span>{new Date(sub.currentPeriodStart).toLocaleDateString()}</span>
                <span>{new Date(sub.currentPeriodEnd).toLocaleDateString()}</span>
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
              {info?.features.map(f => (
                <span key={f} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#374151" }}>
                  <span style={{ color: "#00C897", fontWeight: 700 }}>✓</span> {f}
                </span>
              ))}
            </div>
          </div>

          {/* Invoices */}
          <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #E8E4FF" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#2D1B8E", marginBottom: 14 }}>Payment History</div>
            {!sub.invoices?.length ? (
              <p style={{ fontSize: 13, color: "#9B9BC0" }}>No invoices yet.</p>
            ) : (
              <div>
                {sub.invoices.slice(0, 6).map((inv: any) => (
                  <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F3F4F6" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#180D62" }}>{inv.invoiceNo}</div>
                      <div style={{ fontSize: 11, color: "#9B9BC0" }}>{new Date(inv.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div style={{ textAlign: "right" as const }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#00C897" }}>${Number(inv.amount).toFixed(0)}</div>
                      <span style={{ fontSize: 11, color: inv.status === "PAID" ? "#00C897" : "#EF4444" }}>{inv.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Upgrade / Payment panel ── */}
      {showUpgrade && (
        <div style={{ background: "white", borderRadius: 16, border: "1px solid #E8E4FF", padding: 28, marginBottom: 24 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: "#180D62", margin: "0 0 20px" }}>Choose Plan & Pay</h2>

          {/* Billing cycle toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Billing cycle:</span>
            <div style={{ display: "flex", background: "#E8E4FF", borderRadius: 8, padding: 3, gap: 0 }}>
              {(["MONTHLY", "ANNUAL"] as const).map(c => (
                <button key={c} onClick={() => setBillingCycle(c)} style={{
                  padding: "6px 16px", borderRadius: 6, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  background: billingCycle === c ? "white" : "transparent",
                  color: billingCycle === c ? "#180D62" : "#9B9BC0",
                  boxShadow: billingCycle === c ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                }}>
                  {c === "MONTHLY" ? "Monthly" : "Annual (2 months free)"}
                </button>
              ))}
            </div>
          </div>

          {/* Plan selector */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
            {["STARTER", "PROFESSIONAL", "ENTERPRISE"].map(p => {
              const pi = PLAN_INFO[p];
              const isSelected = selectedPlan === p;
              const price = p === "ENTERPRISE" ? "Custom" : (billingCycle === "ANNUAL" ? pi.annual : pi.price);
              return (
                <div key={p} onClick={() => p !== "ENTERPRISE" && setSelectedPlan(p)} style={{
                  borderRadius: 12, padding: 18, border: `2px solid ${isSelected ? pi.color : "#E8E4FF"}`,
                  background: isSelected ? `${pi.color}10` : "white",
                  cursor: p === "ENTERPRISE" ? "default" : "pointer",
                  transition: "all 0.15s", position: "relative" as const,
                }}>
                  {p === "PROFESSIONAL" && (
                    <span style={{ position: "absolute" as const, top: -10, right: 12, background: "#00C897", color: "white", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>POPULAR</span>
                  )}
                  <div style={{ fontSize: 15, fontWeight: 800, color: pi.color, marginBottom: 4 }}>{pi.price !== "Custom" ? p : "ENTERPRISE"}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#180D62" }}>{price}<span style={{ fontSize: 12, fontWeight: 400, color: "#9B9BC0" }}>{p !== "ENTERPRISE" ? `/${billingCycle === "ANNUAL" ? "yr" : "mo"}` : ""}</span></div>
                  <ul style={{ marginTop: 10, padding: 0, listStyle: "none" }}>
                    {pi.features.map(f => (
                      <li key={f} style={{ fontSize: 12, color: "#374151", display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                        <span style={{ color: "#00C897" }}>✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  {p === "ENTERPRISE" && (
                    <div style={{ marginTop: 12, fontSize: 12, color: "#6B6B9A" }}>Contact us for pricing</div>
                  )}
                </div>
              );
            })}
          </div>

          {selectedPlan !== "ENTERPRISE" && (
            <>
              {/* Payment method */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 10 }}>Payment Method</div>
                <div style={{ display: "flex", gap: 10 }}>
                  {PAYMENT_METHODS.map(m => (
                    <button key={m.id} onClick={() => setMethod(m.id)} style={{
                      flex: 1, padding: "10px 8px", borderRadius: 10, border: `2px solid ${method === m.id ? m.color : "#E8E4FF"}`,
                      background: method === m.id ? `${m.color}10` : "white", cursor: "pointer", transition: "all 0.15s",
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: method === m.id ? m.color : "#374151" }}>{m.label}</div>
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: "#6B6B9A", background: "#F9FAFB", borderRadius: 8, padding: "8px 12px" }}>
                  📱 {selectedMethodInfo.hint} — Amount: <strong>{planPrice}/{ billingCycle === "ANNUAL" ? "year" : "month"}</strong>
                </div>
              </div>

              {/* Reference input */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Payment Reference Number</div>
                <input
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  placeholder="e.g. MP210528001234"
                  style={{
                    width: "100%", padding: "12px 14px", borderRadius: 10,
                    border: `1.5px solid ${reference ? "#2D1B8E" : "#E8E4FF"}`,
                    fontSize: 14, color: "#180D62", outline: "none", boxSizing: "border-box" as const,
                  }}
                />
                <p style={{ fontSize: 12, color: "#9B9BC0", margin: "6px 0 0" }}>
                  After sending payment via {selectedMethodInfo.label}, enter the transaction reference here.
                </p>
              </div>

              <button
                onClick={handlePay}
                disabled={payMutation.isPending || !reference.trim()}
                style={{
                  padding: "13px 32px", borderRadius: 10, border: "none",
                  background: payMutation.isPending || !reference.trim() ? "#9B9BC0" : "linear-gradient(90deg,#00C897,#009E78)",
                  color: "white", fontWeight: 700, fontSize: 15, cursor: payMutation.isPending || !reference.trim() ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: 8,
                }}
              >
                {payMutation.isPending ? "Processing…" : `Confirm Payment — ${planPrice}/${billingCycle === "ANNUAL" ? "yr" : "mo"}`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
