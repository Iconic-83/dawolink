"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const PLANS = [
  { value: "STARTER", label: "Starter", monthly: 29, annual: 290 },
  { value: "PROFESSIONAL", label: "Professional", monthly: 79, annual: 790 },
  { value: "ENTERPRISE", label: "Enterprise (Custom)", monthly: 0, annual: 0 },
];

const PAYMENT_METHODS = [
  { value: "EVC_PLUS", label: "EVC Plus" },
  { value: "ZAAD", label: "Zaad" },
  { value: "SAHAL", label: "Sahal" },
  { value: "PREMIER_WALLET", label: "Premier Wallet" },
  { value: "BANK", label: "Bank Transfer" },
  { value: "CASH", label: "Cash" },
];

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  ACTIVE:    { bg: "rgba(0,200,151,0.1)",   color: "#00C897" },
  TRIALING:  { bg: "rgba(74,143,229,0.1)",  color: "#4A8FE5" },
  PAST_DUE:  { bg: "rgba(239,68,68,0.1)",   color: "#EF4444" },
  CANCELLED: { bg: "rgba(155,155,192,0.1)", color: "#9B9BC0" },
};

export default function AdminBillingPage() {
  const [overview, setOverview] = useState<any>(null);
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [assignTarget, setAssignTarget] = useState<any>(null);
  const [form, setForm] = useState({
    plan: "STARTER",
    billingCycle: "MONTHLY" as "MONTHLY" | "ANNUAL",
    amount: 29,
    paymentMethod: "EVC_PLUS",
    reference: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : "";
  const headers = { Authorization: `Bearer ${token}` };

  function loadAll(q = search) {
    setLoading(true);
    Promise.all([
      api.get("/v1/billing/admin/overview", { headers }),
      api.get(`/v1/billing/admin/pharmacies?limit=50&search=${q}`, { headers }),
    ]).then(([o, p]) => {
      setOverview(o.data);
      setPharmacies(p.data.pharmacies ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }

  useEffect(() => { loadAll(); }, []);

  function openAssign(pharmacy: any) {
    const currentPlan = pharmacy.subscription?.plan ?? pharmacy.plan ?? "STARTER";
    const planInfo = PLANS.find(p => p.value === currentPlan) ?? PLANS[0];
    setForm({
      plan: currentPlan,
      billingCycle: pharmacy.subscription?.billingCycle ?? "MONTHLY",
      amount: planInfo.monthly,
      paymentMethod: "EVC_PLUS",
      reference: "",
      notes: "",
    });
    setError("");
    setAssignTarget(pharmacy);
  }

  function onPlanChange(plan: string) {
    const info = PLANS.find(p => p.value === plan)!;
    const amount = form.billingCycle === "ANNUAL" ? info.annual : info.monthly;
    setForm(f => ({ ...f, plan, amount }));
  }

  function onCycleChange(billingCycle: "MONTHLY" | "ANNUAL") {
    const info = PLANS.find(p => p.value === form.plan)!;
    const amount = billingCycle === "ANNUAL" ? info.annual : info.monthly;
    setForm(f => ({ ...f, billingCycle, amount }));
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!form.reference.trim() && form.plan !== "ENTERPRISE") {
      setError("Payment reference is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.post(`/v1/billing/admin/pharmacies/${assignTarget.id}/assign-plan`, form, { headers });
      setAssignTarget(null);
      loadAll();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to assign plan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "#180D62" }}>Billing & Subscriptions</h1>
        <p className="text-sm mt-1" style={{ color: "#6B6B9A" }}>Assign plans after receiving payment</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[
          { label: "MRR", value: `$${(overview?.mrr ?? 0).toLocaleString()}`, color: "#00C897" },
          { label: "ARR", value: `$${(overview?.arr ?? 0).toLocaleString()}`, color: "#2D1B8E" },
          { label: "Active", value: overview?.active ?? 0, color: "#10B981" },
          { label: "Past Due", value: overview?.pastDue ?? 0, color: "#EF4444" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm" style={{ border: "1px solid #E8E4FF" }}>
            <div className="text-sm mb-1" style={{ color: "#6B6B9A" }}>{s.label}</div>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4 flex gap-3">
        <input
          type="text"
          placeholder="Search pharmacies..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === "Enter" && loadAll(search)}
          className="px-4 py-2 rounded-xl text-sm outline-none w-64"
          style={{ border: "1px solid #E8E4FF", background: "white" }}
        />
        <button onClick={() => loadAll(search)} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: "#E8E4FF", color: "#2D1B8E" }}>
          Search
        </button>
      </div>

      {/* Pharmacies + subscription table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{ border: "1px solid #E8E4FF" }}>
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "#E8E4FF" }}>
          <h2 className="font-semibold" style={{ color: "#2D1B8E" }}>All Pharmacies</h2>
          <span className="text-xs" style={{ color: "#9B9BC0" }}>{pharmacies.length} pharmacies</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #E8E4FF" }}>
                {["Pharmacy", "Current Plan", "Sub Status", "Amount", "Expires", "Last Payment", "Action"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "#2D1B8E" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-8 text-center" style={{ color: "#9B9BC0" }}>Loading...</td></tr>
              ) : !pharmacies.length ? (
                <tr><td colSpan={7} className="px-5 py-8 text-center" style={{ color: "#9B9BC0" }}>No pharmacies found</td></tr>
              ) : pharmacies.map((p: any) => {
                const sub = p.subscription;
                const statusStyle = STATUS_STYLE[sub?.status ?? ""] ?? { bg: "rgba(155,155,192,0.1)", color: "#9B9BC0" };
                const lastInvoice = sub?.invoices?.[0];
                return (
                  <tr key={p.id} className="border-b last:border-0" style={{ borderColor: "#E8E4FF" }}>
                    <td className="px-5 py-3">
                      <div className="font-medium" style={{ color: "#180D62" }}>{p.name}</div>
                      <div className="text-xs" style={{ color: "#9B9BC0" }}>{p.city}</div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "#E8E4FF", color: "#2D1B8E" }}>{p.plan}</span>
                    </td>
                    <td className="px-5 py-3">
                      {sub ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: statusStyle.bg, color: statusStyle.color }}>{sub.status}</span>
                      ) : (
                        <span className="text-xs" style={{ color: "#9B9BC0" }}>No subscription</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-sm font-medium" style={{ color: "#00C897" }}>
                      {sub ? `$${sub.amount}/${sub.billingCycle === "ANNUAL" ? "yr" : "mo"}` : "—"}
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: "#6B6B9A" }}>
                      {sub ? new Date(sub.currentPeriodEnd).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: "#6B6B9A" }}>
                      {lastInvoice ? (
                        <span>${lastInvoice.amount} · {new Date(lastInvoice.paidAt).toLocaleDateString()}</span>
                      ) : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => openAssign(p)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                        style={{ background: "linear-gradient(90deg, #2D1B8E, #4A8FE5)" }}
                      >
                        Assign Plan
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Plan Modal */}
      {assignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(24,13,98,0.6)" }}>
          <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-lg font-bold" style={{ color: "#180D62" }}>Assign Plan</h2>
              <p className="text-sm mt-1" style={{ color: "#6B6B9A" }}>{assignTarget.name}</p>
            </div>

            <form onSubmit={handleAssign} className="space-y-4">
              {/* Plan */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: "#2D1B8E" }}>Plan</label>
                <div className="grid grid-cols-3 gap-2">
                  {PLANS.map(plan => (
                    <button
                      key={plan.value}
                      type="button"
                      onClick={() => onPlanChange(plan.value)}
                      className="py-2.5 px-3 rounded-xl text-xs font-semibold border-2 transition-all"
                      style={form.plan === plan.value
                        ? { borderColor: "#2D1B8E", background: "#2D1B8E", color: "white" }
                        : { borderColor: "#E8E4FF", background: "white", color: "#6B6B9A" }}
                    >
                      {plan.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Billing Cycle */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: "#2D1B8E" }}>Billing Cycle</label>
                <div className="grid grid-cols-2 gap-2">
                  {[{ value: "MONTHLY", label: "Monthly" }, { value: "ANNUAL", label: "Annual (2 mo free)" }].map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => onCycleChange(c.value as "MONTHLY" | "ANNUAL")}
                      className="py-2 rounded-xl text-xs font-semibold border-2 transition-all"
                      style={form.billingCycle === c.value
                        ? { borderColor: "#00C897", background: "#00C897", color: "white" }
                        : { borderColor: "#E8E4FF", background: "white", color: "#6B6B9A" }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#2D1B8E" }}>Amount Received ($)</label>
                <input
                  type="number"
                  min={0}
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: +e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ border: "1px solid #E8E4FF" }}
                  required
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#2D1B8E" }}>Payment Method</label>
                <select
                  value={form.paymentMethod}
                  onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ border: "1px solid #E8E4FF" }}
                >
                  {PAYMENT_METHODS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* Reference */}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#2D1B8E" }}>
                  Payment Reference <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. MP210528001234"
                  value={form.reference}
                  onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ border: "1px solid #E8E4FF" }}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#2D1B8E" }}>Notes (optional)</label>
                <input
                  type="text"
                  placeholder="Any extra notes..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ border: "1px solid #E8E4FF" }}
                />
              </div>

              {/* Summary */}
              <div className="rounded-xl p-3 text-xs" style={{ background: "#F3F0FF", color: "#2D1B8E" }}>
                Activating <strong>{form.plan}</strong> ({form.billingCycle.toLowerCase()}) for <strong>{assignTarget.name}</strong> — ${form.amount} received
              </div>

              {error && <p className="text-xs font-medium" style={{ color: "#EF4444" }}>{error}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setAssignTarget(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ border: "1px solid #E8E4FF", color: "#6B6B9A" }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60" style={{ background: "linear-gradient(90deg, #2D1B8E, #4A8FE5)" }}>
                  {saving ? "Activating..." : "Activate Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
