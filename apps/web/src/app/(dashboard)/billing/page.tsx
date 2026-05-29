"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import {
  CreditCard, TrendingUp, Users, Building2, Clock,
  CheckCircle2, AlertTriangle, FileText, Printer,
  ChevronRight, Loader2, XCircle,
} from "lucide-react";

// ── Constants ──────────────────────────────────────────────────────────────

const PLAN_META: Record<string, { color: string; gradient: string; badge: string }> = {
  STARTER:      { color: "#4A8FE5", gradient: "from-blue-500 to-blue-600",     badge: "bg-blue-100 text-blue-700" },
  PROFESSIONAL: { color: "#2D1B8E", gradient: "from-indigo-600 to-purple-700", badge: "bg-indigo-100 text-indigo-700" },
  ENTERPRISE:   { color: "#180D62", gradient: "from-slate-700 to-slate-900",   badge: "bg-slate-100 text-slate-700" },
};

const PLAN_FEATURES: Record<string, string[]> = {
  STARTER:      ["1 branch", "5 staff accounts", "Inventory + POS", "Expiry tracking", "Basic analytics"],
  PROFESSIONAL: ["Up to 5 branches", "50 staff accounts", "All Starter features", "Supplier & PO management", "Advanced analytics", "Priority support"],
  ENTERPRISE:   ["Unlimited branches", "Unlimited staff", "All Professional features", "API access", "Custom domain", "Dedicated SLA"],
};

const PLAN_PRICES: Record<string, { monthly: number; annual: number }> = {
  STARTER:      { monthly: 29,  annual: 290  },
  PROFESSIONAL: { monthly: 79,  annual: 790  },
  ENTERPRISE:   { monthly: 0,   annual: 0    },
};

const STATUS_VARIANT: Record<string, any> = {
  ACTIVE:   "success", TRIALING: "info",
  PAST_DUE: "danger",  CANCELLED: "muted", SUSPENDED: "danger",
};

const PAYMENT_METHODS = [
  { id: "EVC_PLUS",       label: "EVC Plus",       color: "#E34234", number: "+252-61-DAWOLINK" },
  { id: "ZAAD",           label: "Zaad",            color: "#009E52", number: "+252-63-DAWOLINK" },
  { id: "SAHAL",          label: "Sahal",           color: "#0071B9", number: "+252-90-DAWOLINK" },
  { id: "PREMIER_WALLET", label: "Premier Wallet",  color: "#8B5CF6", number: "+252-77-DAWOLINK" },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function UsageMeter({ label, icon, used, limit }: {
  label: string; icon: React.ReactNode; used: number; limit: number | null;
}) {
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const danger = limit && pct >= 90;
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {icon} {label}
        </div>
        <span className={`text-sm font-bold ${danger ? "text-red-600" : "text-gray-900"}`}>
          {used}{limit ? ` / ${limit}` : ""}
          {!limit && <span className="text-xs font-normal text-gray-400 ml-1">unlimited</span>}
        </span>
      </div>
      {limit && (
        <>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${danger ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">{pct}% of plan limit used</p>
        </>
      )}
    </div>
  );
}

function PlanCard({ plan, current, cycle, onSelect }: {
  plan: string; current: boolean; cycle: "MONTHLY" | "ANNUAL"; onSelect: () => void;
}) {
  const meta = PLAN_META[plan] ?? PLAN_META.STARTER;
  const prices = PLAN_PRICES[plan];
  const isEnterprise = plan === "ENTERPRISE";
  const price = cycle === "ANNUAL" ? prices.annual : prices.monthly;
  const features = PLAN_FEATURES[plan] ?? [];

  return (
    <div
      onClick={onSelect}
      className={`relative rounded-2xl border-2 p-5 transition cursor-pointer ${
        current
          ? "border-indigo-500 bg-indigo-50/50"
          : "border-gray-100 bg-white hover:border-indigo-200 hover:shadow-md"
      }`}
    >
      {plan === "PROFESSIONAL" && !current && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-emerald-500 text-white text-xs font-bold rounded-full">
          POPULAR
        </span>
      )}
      {current && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-indigo-600 text-white text-xs font-bold rounded-full">
          CURRENT PLAN
        </span>
      )}

      <div className="mb-4">
        <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${meta.badge.split(" ")[1]}`}
          style={{ color: meta.color }}>{plan}</p>
        {isEnterprise ? (
          <p className="text-2xl font-bold text-gray-900">Custom pricing</p>
        ) : (
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(price)}
            <span className="text-sm font-normal text-gray-400">
              /{cycle === "ANNUAL" ? "yr" : "mo"}
            </span>
          </p>
        )}
        {cycle === "ANNUAL" && !isEnterprise && (
          <p className="text-xs text-emerald-600 font-medium mt-0.5">
            {formatCurrency(prices.monthly * 12 - prices.annual)} saved vs monthly
          </p>
        )}
      </div>

      <ul className="space-y-2 mb-4">
        {features.map(f => (
          <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>

      {isEnterprise ? (
        <a href="mailto:sales@dawolink.com"
          className="block text-center py-2 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          onClick={e => e.stopPropagation()}>
          Contact Sales
        </a>
      ) : (
        <button
          className={`w-full py-2 rounded-xl text-sm font-semibold transition ${
            current
              ? "bg-indigo-100 text-indigo-700 cursor-default"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}
          onClick={onSelect}
          disabled={current}
        >
          {current ? "Current Plan" : `Select ${plan}`}
        </button>
      )}
    </div>
  );
}

// ── Payment form ───────────────────────────────────────────────────────────

function PaymentForm({ plan, cycle, onClose }: {
  plan: string; cycle: "MONTHLY" | "ANNUAL"; onClose: () => void;
}) {
  const qc = useQueryClient();
  const [method, setMethod] = useState("EVC_PLUS");
  const [reference, setReference] = useState("");
  const selectedMethod = PAYMENT_METHODS.find(m => m.id === method)!;
  const price = cycle === "ANNUAL" ? PLAN_PRICES[plan].annual : PLAN_PRICES[plan].monthly;

  const { mutate, isPending } = useMutation({
    mutationFn: () => api.post("/v1/billing/pay", { method, reference, amount: price, plan, billingCycle: cycle }).then(r => r.data),
    onSuccess: (data) => {
      toast.success(data.message ?? "Payment submitted! Subscription activated.");
      qc.invalidateQueries({ queryKey: ["subscription"] });
      qc.invalidateQueries({ queryKey: ["billing-usage"] });
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Payment failed"),
  });

  return (
    <div className="space-y-5">
      <div className="bg-indigo-50 rounded-xl p-4">
        <p className="text-sm text-indigo-700">
          Paying for <strong>{plan}</strong> plan · <strong>{cycle}</strong> · <strong>{formatCurrency(price)}</strong>
        </p>
      </div>

      {/* Method */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Payment method</label>
        <div className="grid grid-cols-2 gap-2">
          {PAYMENT_METHODS.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMethod(m.id)}
              className={`p-3 rounded-xl border-2 text-left transition ${
                method === m.id ? "border-indigo-500 bg-indigo-50" : "border-gray-100 bg-white hover:border-gray-200"
              }`}
            >
              <p className="text-sm font-semibold" style={{ color: m.color }}>{m.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{m.number}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm">
        <p className="font-semibold text-amber-800 mb-1">How to pay:</p>
        <ol className="text-amber-700 space-y-1 text-xs list-decimal pl-4">
          <li>Send <strong>{formatCurrency(price)}</strong> via {selectedMethod.label}</li>
          <li>To: <strong>{selectedMethod.number}</strong></li>
          <li>Copy the transaction reference number</li>
          <li>Paste it below and click Confirm</li>
        </ol>
      </div>

      {/* Reference */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Transaction reference *</label>
        <input
          value={reference}
          onChange={e => setReference(e.target.value)}
          placeholder="e.g. MP210528001234"
          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onClose} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">
          Cancel
        </button>
        <button
          onClick={() => mutate()}
          disabled={isPending || !reference.trim()}
          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Confirm Payment — {formatCurrency(price)}
        </button>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

type Tab = "overview" | "invoices" | "plans";

export default function BillingPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");
  const [cycle, setCycle] = useState<"MONTHLY" | "ANNUAL">("MONTHLY");
  const [payingPlan, setPayingPlan] = useState<string | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState(false);

  const { data: sub, isLoading } = useQuery<any>({
    queryKey: ["subscription"],
    queryFn: () => api.get("/v1/billing/subscription").then(r => r.data),
  });

  const { data: usage } = useQuery<any>({
    queryKey: ["billing-usage"],
    queryFn: () => api.get("/v1/billing/usage").then(r => r.data),
  });

  const { data: invoicesData } = useQuery<any>({
    queryKey: ["invoices"],
    queryFn: () => api.get("/v1/billing/invoices?limit=50").then(r => r.data),
    enabled: tab === "invoices",
  });

  const { mutate: cancelSub, isPending: cancelling } = useMutation({
    mutationFn: () => api.patch("/v1/billing/subscription/cancel").then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscription"] });
      toast.success("Subscription cancelled");
      setCancelConfirm(false);
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading billing…
      </div>
    );
  }

  const daysLeft = sub ? Math.ceil((new Date(sub.currentPeriodEnd).getTime() - Date.now()) / 86400000) : 0;
  const periodDays = sub?.billingCycle === "ANNUAL" ? 365 : 30;
  const periodPct = sub ? Math.max(2, Math.min(100, (daysLeft / periodDays) * 100)) : 0;
  const urgency = daysLeft <= 3 ? "text-red-600" : daysLeft <= 7 ? "text-amber-600" : "text-emerald-600";

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview",  icon: <CreditCard className="h-4 w-4" /> },
    { key: "invoices", label: "Invoices",  icon: <FileText className="h-4 w-4" /> },
    { key: "plans",    label: "Plans",     icon: <TrendingUp className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your plan, payments, and invoices</p>
      </div>

      {/* Alert banners */}
      {sub?.status === "TRIALING" && daysLeft <= 7 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800 flex-1">
            <strong>Trial ending soon.</strong> Your free trial expires in <strong>{daysLeft} day{daysLeft !== 1 ? "s" : ""}</strong>.
            Activate a plan to keep uninterrupted access.
          </p>
          <button onClick={() => { setTab("plans"); setCycle("MONTHLY"); }}
            className="px-4 py-2 bg-amber-500 text-white text-xs font-bold rounded-xl hover:bg-amber-600 transition flex-shrink-0">
            Choose Plan
          </button>
        </div>
      )}
      {sub?.status === "PAST_DUE" && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800 flex-1">
            <strong>Subscription expired.</strong> Some features may be restricted. Renew now to restore full access.
          </p>
          <button onClick={() => { setTab("plans"); }}
            className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition flex-shrink-0">
            Renew
          </button>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview tab ── */}
      {tab === "overview" && (
        <div className="space-y-5">
          {!sub ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-gray-900 mb-1">No Active Subscription</h2>
              <p className="text-sm text-gray-500 mb-4">Choose a plan to get started.</p>
              <button onClick={() => setTab("plans")} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
                Browse Plans
              </button>
            </div>
          ) : (
            <>
              {/* Subscription card */}
              <div className={`bg-gradient-to-br ${PLAN_META[sub.plan]?.gradient ?? "from-indigo-600 to-purple-700"} rounded-2xl p-6 text-white`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-white/70 text-sm font-medium mb-1">Current Plan</p>
                    <h2 className="text-3xl font-bold">{sub.plan}</h2>
                    <p className="text-white/70 text-sm mt-1">
                      {sub.billingCycle === "ANNUAL" ? "Annual billing" : "Monthly billing"} · {formatCurrency(Number(sub.amount))}/{sub.billingCycle === "ANNUAL" ? "yr" : "mo"}
                    </p>
                  </div>
                  <Badge variant={STATUS_VARIANT[sub.status] ?? "muted"} className="text-sm">
                    {sub.status.replace("_", " ")}
                  </Badge>
                </div>

                {/* Period progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-white/80">
                    <span>Billing period</span>
                    <span className={`font-semibold ${daysLeft <= 7 ? "text-red-300" : "text-white"}`}>
                      {daysLeft > 0 ? `${daysLeft} days remaining` : "Expired"}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/20">
                    <div className="h-full rounded-full bg-white/80 transition-all" style={{ width: `${periodPct}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-white/50">
                    <span>{formatDate(sub.currentPeriodStart)}</span>
                    <span>{formatDate(sub.currentPeriodEnd)}</span>
                  </div>
                </div>

                <div className="flex gap-3 mt-5">
                  <button onClick={() => setTab("plans")}
                    className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition">
                    Upgrade Plan <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                  {sub.status !== "CANCELLED" && (
                    <button onClick={() => setTab("invoices")}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition">
                      View Invoices
                    </button>
                  )}
                </div>
              </div>

              {/* Plan features */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <p className="text-sm font-semibold text-gray-700 mb-3">What's included in your plan</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(PLAN_FEATURES[sub.plan] ?? []).map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>

              {/* Usage meters */}
              {usage && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <UsageMeter
                    label="Branches"
                    icon={<Building2 className="h-4 w-4" />}
                    used={usage.branches.used}
                    limit={usage.branches.limit}
                  />
                  <UsageMeter
                    label="Staff accounts"
                    icon={<Users className="h-4 w-4" />}
                    used={usage.staff.used}
                    limit={usage.staff.limit}
                  />
                </div>
              )}

              {/* Cancel */}
              {sub.status === "ACTIVE" && (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Cancel subscription</p>
                    <p className="text-xs text-gray-400 mt-0.5">You'll keep access until {formatDate(sub.currentPeriodEnd)}</p>
                  </div>
                  <button onClick={() => setCancelConfirm(true)}
                    className="px-4 py-2 border border-red-200 text-red-600 text-sm font-medium rounded-xl hover:bg-red-50 transition">
                    Cancel Plan
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Invoices tab ── */}
      {tab === "invoices" && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Invoice History</h2>
            <p className="text-sm text-gray-400">{invoicesData?.total ?? 0} invoices</p>
          </div>
          {!invoicesData?.invoices?.length ? (
            <div className="py-12 text-center text-gray-400">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>No invoices yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-left">
                  <th className="px-5 py-3">Invoice #</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Notes</th>
                  <th className="px-5 py-3 w-16" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoicesData.invoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-gray-50/60 transition">
                    <td className="px-5 py-3 font-mono text-sm font-medium text-gray-800">{inv.invoiceNo}</td>
                    <td className="px-5 py-3 text-gray-500">{formatDate(inv.createdAt)}</td>
                    <td className="px-5 py-3 font-semibold text-gray-900">{formatCurrency(Number(inv.amount))}</td>
                    <td className="px-5 py-3">
                      <Badge variant={inv.status === "PAID" ? "success" : inv.status === "OVERDUE" ? "danger" : "warning"}>
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400 max-w-xs truncate">{inv.notes ?? "—"}</td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => router.push(`/billing/invoice/${inv.id}`)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="View / Print"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Plans tab ── */}
      {tab === "plans" && (
        <div className="space-y-5">
          {/* Cycle toggle */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Billing cycle</span>
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              {(["MONTHLY", "ANNUAL"] as const).map(c => (
                <button key={c} onClick={() => setCycle(c)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                    cycle === c ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}>
                  {c === "MONTHLY" ? "Monthly" : "Annual · 2 months free"}
                </button>
              ))}
            </div>
          </div>

          {/* Plan grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {["STARTER", "PROFESSIONAL", "ENTERPRISE"].map(plan => (
              <PlanCard
                key={plan}
                plan={plan}
                current={sub?.plan === plan}
                cycle={cycle}
                onSelect={() => plan !== "ENTERPRISE" && setPayingPlan(plan)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Payment modal */}
      {payingPlan && (
        <Modal open onClose={() => setPayingPlan(null)} title={`Activate ${payingPlan} Plan`} size="md">
          <PaymentForm plan={payingPlan} cycle={cycle} onClose={() => setPayingPlan(null)} />
        </Modal>
      )}

      {/* Cancel confirm modal */}
      {cancelConfirm && (
        <Modal open onClose={() => setCancelConfirm(false)} title="Cancel Subscription" size="sm">
          <div className="space-y-4">
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
              <p className="font-semibold mb-1">Are you sure?</p>
              <p>You'll keep full access until <strong>{sub ? formatDate(sub.currentPeriodEnd) : "—"}</strong>. After that, your account will be downgraded.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setCancelConfirm(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600">Keep Plan</button>
              <button
                onClick={() => cancelSub()}
                disabled={cancelling}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cancelling && <Loader2 className="h-4 w-4 animate-spin" />}
                Yes, Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
