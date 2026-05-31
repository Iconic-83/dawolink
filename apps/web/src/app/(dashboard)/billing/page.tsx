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
  ChevronRight, Loader2, XCircle, RefreshCw, Info,
} from "lucide-react";

// ── Constants ──────────────────────────────────────────────────────────────

const PLAN_META: Record<string, { color: string; gradient: string; badge: string }> = {
  STARTER:      { color: "#4A8FE5", gradient: "from-blue-500 to-blue-600",     badge: "bg-blue-100 text-blue-700" },
  PROFESSIONAL: { color: "#2D1B8E", gradient: "from-indigo-600 to-purple-700", badge: "bg-indigo-100 text-indigo-700" },
  ENTERPRISE:   { color: "#180D62", gradient: "from-slate-700 to-slate-900",   badge: "bg-slate-100 text-slate-700" },
};

const PLAN_FEATURES: Record<string, string[]> = {
  STARTER:      ["1 branch", "5 staff accounts", "Inventory + POS", "Expiry tracking", "Basic analytics"],
  PROFESSIONAL: ["Up to 5 branches", "50 staff accounts", "All Starter features", "Customer marketplace", "Delivery system", "Advanced analytics", "Priority support"],
  ENTERPRISE:   ["Unlimited branches", "Unlimited staff", "All Professional features", "AI features", "National analytics", "Custom pricing", "Dedicated SLA"],
};

const PLAN_PRICES: Record<string, { monthly: number; annual: number }> = {
  STARTER:      { monthly: 29,  annual: 290  },
  PROFESSIONAL: { monthly: 79,  annual: 790  },
  ENTERPRISE:   { monthly: 0,   annual: 0    },
};

const STATUS_VARIANT: Record<string, any> = {
  ACTIVE:    "success",
  TRIALING:  "info",
  PAST_DUE:  "danger",
  EXPIRED:   "danger",
  CANCELLED: "muted",
  SUSPENDED: "danger",
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE:    "Active",
  TRIALING:  "Free Trial",
  PAST_DUE:  "Expired",
  EXPIRED:   "Expired",
  CANCELLED: "Cancelled",
  SUSPENDED: "Suspended",
};

const PAYMENT_METHODS = [
  { id: "EVC_PLUS",       label: "EVC Plus",       color: "#E34234", number: "25261XXXXXXX" },
  { id: "ZAAD",           label: "Zaad",            color: "#009E52", number: "25263XXXXXXX" },
  { id: "SAHAL",          label: "Sahal",           color: "#0071B9", number: "25290XXXXXXX" },
  { id: "WAAFI",          label: "Waafi",           color: "#7C3AED", number: "25277XXXXXXX" },
  { id: "PREMIER_WALLET", label: "Premier Wallet",  color: "#8B5CF6", number: "25277XXXXXXX" },
  { id: "BANK_TRANSFER",  label: "Bank Transfer",   color: "#374151", number: "Account on file" },
];

// Reference codes per plan+cycle, shown to pharmacy owner
function getReferenceCode(pharmacyId: string, plan: string, cycle: string) {
  const tag = cycle === "ANNUAL" ? "YR" : "MO";
  return `DWL-${plan.slice(0, 3)}-${tag}-${(pharmacyId ?? "000000").slice(-6).toUpperCase()}`;
}

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
        <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: meta.color }}>{plan}</p>
        {isEnterprise ? (
          <p className="text-2xl font-bold text-gray-900">Custom pricing</p>
        ) : (
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(price)}
            <span className="text-sm font-normal text-gray-400">/{cycle === "ANNUAL" ? "yr" : "mo"}</span>
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

// ── Payment form — submits to admin verification queue ─────────────────────

function PaymentForm({ plan, cycle, pharmacyId, onClose }: {
  plan: string; cycle: "MONTHLY" | "ANNUAL"; pharmacyId?: string; onClose: () => void;
}) {
  const qc = useQueryClient();
  const [method, setMethod] = useState("EVC_PLUS");
  const [phone, setPhone] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [payMode, setPayMode] = useState<"gateway" | "manual">("gateway");
  const [payResult, setPayResult] = useState<any>(null);
  const selectedMethod = PAYMENT_METHODS.find(m => m.id === method)!;
  const price = cycle === "ANNUAL" ? PLAN_PRICES[plan].annual : PLAN_PRICES[plan].monthly;
  const refCode = getReferenceCode(pharmacyId ?? "", plan, cycle);

  const canUseGateway = ["EVC_PLUS", "ZAAD", "SAHAL"].includes(method);

  // Check if EVC gateway is live
  const { data: gatewayStatus } = useQuery<{ enabled: boolean }>({
    queryKey: ["gateway-status"],
    queryFn: () => api.get("/v1/payments/gateway/status").then(r => r.data),
    staleTime: 60_000,
  });
  const gatewayEnabled = (gatewayStatus?.enabled ?? false) && canUseGateway;

  // Gateway payment (EVC push) — auto-activates on success
  const { mutate: payGateway, isPending: gatewayPending } = useMutation({
    mutationFn: () => api.post("/v1/billing/pay/evc", { phone, plan, billingCycle: cycle, method }).then(r => r.data),
    onSuccess: (data) => {
      setPayResult(data);
      if (data.success) {
        toast.success("Payment successful! Subscription activated.");
        qc.invalidateQueries({ queryKey: ["subscription"] });
        qc.invalidateQueries({ queryKey: ["billing-usage"] });
        setTimeout(onClose, 2000);
      }
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Payment failed"),
  });

  // Manual payment — submits proof, awaits admin approval
  const { mutate: submitRequest, isPending: requestPending } = useMutation({
    mutationFn: () => api.post("/v1/billing/pay/request", {
      plan,
      billingCycle: cycle,
      amount: price,
      paymentMethod: method,
      transactionId: transactionId.trim(),
      phone: phone.trim() || undefined,
      referenceCode: refCode,
    }).then(r => r.data),
    onSuccess: () => {
      toast.success("Payment submitted! Our team will verify and activate your subscription within 24 hours.");
      qc.invalidateQueries({ queryKey: ["subscription"] });
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Submission failed"),
  });

  const isPending = gatewayPending || requestPending;
  const isBankTransfer = method === "BANK_TRANSFER";

  return (
    <div className="space-y-5">
      <div className="bg-indigo-50 rounded-xl p-4 flex items-center justify-between">
        <p className="text-sm text-indigo-700">
          <strong>{plan}</strong> plan · <strong>{cycle === "ANNUAL" ? "Annual" : "Monthly"}</strong>
        </p>
        <p className="text-lg font-bold text-indigo-900">{formatCurrency(price)}</p>
      </div>

      {/* Payment method grid */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Payment method</label>
        <div className="grid grid-cols-3 gap-2">
          {PAYMENT_METHODS.map(m => (
            <button key={m.id} type="button" onClick={() => { setMethod(m.id); setPayResult(null); }}
              className={`p-3 rounded-xl border-2 text-left transition ${method === m.id ? "border-indigo-500 bg-indigo-50" : "border-gray-100 bg-white hover:border-gray-200"}`}>
              <p className="text-sm font-semibold" style={{ color: m.color }}>{m.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Gateway toggle (only for EVC/Zaad/Sahal when enabled) */}
      {gatewayEnabled && !isBankTransfer && (
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {[
            { key: "gateway", label: "Pay instantly" },
            { key: "manual",  label: "Manual transfer" },
          ].map(opt => (
            <button key={opt.key} onClick={() => { setPayMode(opt.key as any); setPayResult(null); }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${payMode === opt.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Gateway push payment */}
      {gatewayEnabled && payMode === "gateway" && !isBankTransfer ? (
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-sm">
            <p className="font-semibold text-emerald-800 mb-1">Instant payment</p>
            <p className="text-emerald-700 text-xs">Enter your {selectedMethod.label} number. You'll receive a prompt on your phone to confirm.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{selectedMethod.label} phone number *</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="0615000000" maxLength={15}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          {payResult && (
            <div className={`rounded-xl p-4 text-sm ${payResult.success ? "bg-emerald-50 border border-emerald-200 text-emerald-800" : "bg-red-50 border border-red-200 text-red-700"}`}>
              <p className="font-semibold">{payResult.success ? "✓ Payment Successful" : "✗ Payment Failed"}</p>
              <p className="mt-1 text-xs">{payResult.message}</p>
              {payResult.transactionId && <p className="text-xs mt-1 font-mono">Tx: {payResult.transactionId}</p>}
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600">Cancel</button>
            <button onClick={() => payGateway()} disabled={isPending || !phone.trim() || !!payResult?.success}
              className="flex-1 py-2.5 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition"
              style={{ background: "linear-gradient(90deg,#00C897,#009E78)" }}>
              {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</> : `Pay ${formatCurrency(price)}`}
            </button>
          </div>
        </div>
      ) : (
        /* Manual / bank transfer — admin verification flow */
        <div className="space-y-4">
          {/* Payment instructions */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm space-y-2">
            <p className="font-semibold text-amber-900">How to pay:</p>
            {isBankTransfer ? (
              <ol className="text-amber-800 space-y-1.5 text-xs list-decimal pl-4">
                <li>Transfer <strong>{formatCurrency(price)}</strong> to our bank account</li>
                <li>Use reference: <code className="bg-amber-100 px-1 rounded font-mono">{refCode}</code></li>
                <li>Enter your transaction ID below</li>
                <li>Our team will verify and activate your plan within 24h</li>
              </ol>
            ) : (
              <ol className="text-amber-800 space-y-1.5 text-xs list-decimal pl-4">
                <li>Send <strong>{formatCurrency(price)}</strong> via <strong>{selectedMethod.label}</strong></li>
                <li>To number: <strong>{selectedMethod.number}</strong></li>
                <li>Use reference: <code className="bg-amber-100 px-1 rounded font-mono">{refCode}</code></li>
                <li>Enter the transaction ID you receive</li>
                <li>Our team verifies and activates within 24h</li>
              </ol>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Transaction ID / Reference *
            </label>
            <input value={transactionId} onChange={e => setTransactionId(e.target.value)}
              placeholder={isBankTransfer ? "Bank transfer reference" : "e.g. MP210528001234"}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          {!isBankTransfer && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Your {selectedMethod.label} phone number (optional)
              </label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="0615000000" maxLength={15}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          )}

          <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-xl p-3">
            <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <span>After clicking <strong>"I Have Paid"</strong>, an admin will review your payment and activate your subscription. You'll receive an email confirmation.</span>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600">Cancel</button>
            <button onClick={() => submitRequest()} disabled={isPending || !transactionId.trim()}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition">
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              I Have Paid — Submit for Review
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pending payment request banner ─────────────────────────────────────────

function PendingRequestBanner({ request, onCancel }: { request: any; onCancel?: () => void }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
      <Clock className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-blue-900">Payment submitted — awaiting admin verification</p>
        <p className="text-xs text-blue-700 mt-0.5">
          {request.plan} · {request.billingCycle === "ANNUAL" ? "Annual" : "Monthly"} · {formatCurrency(Number(request.amount))}
          {request.paymentMethod && <> · via {request.paymentMethod.replace(/_/g, " ")}</>}
        </p>
        <p className="text-xs text-blue-500 mt-1">Submitted {formatDate(request.createdAt)} · Usually approved within 24 hours</p>
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

  const isExpired = sub?.status === "EXPIRED" || sub?.status === "PAST_DUE";
  const isTrial = sub?.status === "TRIALING";
  const isActive = sub?.status === "ACTIVE";

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

      {/* ── Alert banners ── */}

      {/* Expired */}
      {isExpired && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-2xl">
          <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-red-900">Subscription expired — Read-only mode</p>
            <p className="text-xs text-red-700 mt-0.5">You can view your data but new sales, orders, and inventory changes are blocked until you renew.</p>
          </div>
          <button onClick={() => { setTab("plans"); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition flex-shrink-0">
            <RefreshCw className="h-3.5 w-3.5" /> Renew Now
          </button>
        </div>
      )}

      {/* Trial — 1 day */}
      {isTrial && daysLeft === 1 && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800 flex-1">
            <strong>Trial expires today!</strong> Subscribe now to avoid interruption.
          </p>
          <button onClick={() => { setTab("plans"); setCycle("ANNUAL"); }}
            className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition flex-shrink-0">
            Subscribe Now
          </button>
        </div>
      )}

      {/* Trial — 3 days */}
      {isTrial && daysLeft > 1 && daysLeft <= 3 && (
        <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-2xl">
          <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0" />
          <p className="text-sm text-orange-800 flex-1">
            <strong>Trial expires in {daysLeft} days.</strong> Renew now to avoid interruption.
          </p>
          <button onClick={() => { setTab("plans"); }}
            className="px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-xl hover:bg-orange-600 transition flex-shrink-0">
            Choose Plan
          </button>
        </div>
      )}

      {/* Trial — 7 days */}
      {isTrial && daysLeft > 3 && daysLeft <= 7 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800 flex-1">
            <strong>Free trial ends in {daysLeft} days.</strong> Activate a paid plan to keep uninterrupted access.
          </p>
          <button onClick={() => { setTab("plans"); setCycle("MONTHLY"); }}
            className="px-4 py-2 bg-amber-500 text-white text-xs font-bold rounded-xl hover:bg-amber-600 transition flex-shrink-0">
            Choose Plan
          </button>
        </div>
      )}

      {/* Paid subscription — renewal warnings */}
      {isActive && daysLeft <= 30 && daysLeft > 0 && (
        <div className={`flex items-center gap-3 p-4 rounded-2xl border ${
          daysLeft <= 3  ? "bg-orange-50 border-orange-200" :
          daysLeft <= 7  ? "bg-amber-50 border-amber-200"  :
                           "bg-blue-50 border-blue-200"
        }`}>
          <Clock className={`h-5 w-5 flex-shrink-0 ${
            daysLeft <= 3 ? "text-orange-600" : daysLeft <= 7 ? "text-amber-600" : "text-blue-500"
          }`} />
          <p className={`text-sm flex-1 ${
            daysLeft <= 3 ? "text-orange-800" : daysLeft <= 7 ? "text-amber-800" : "text-blue-800"
          }`}>
            <strong>Subscription expires in {daysLeft} day{daysLeft !== 1 ? "s" : ""}.</strong>{" "}
            {daysLeft <= 7 ? "Renew now to avoid interruption." : "Plan ahead and renew early."}
          </p>
          <button onClick={() => { setTab("plans"); setCycle(sub?.billingCycle ?? "MONTHLY"); }}
            className={`px-4 py-2 text-white text-xs font-bold rounded-xl transition flex-shrink-0 ${
              daysLeft <= 3 ? "bg-orange-500 hover:bg-orange-600" :
              daysLeft <= 7 ? "bg-amber-500 hover:bg-amber-600" :
                              "bg-blue-500 hover:bg-blue-600"
            }`}>
            Renew
          </button>
        </div>
      )}

      {/* Pending payment request */}
      {sub?.pendingRequest && <PendingRequestBanner request={sub.pendingRequest} />}

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
              {/* Subscription hero card */}
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
                    {STATUS_LABEL[sub.status] ?? sub.status}
                  </Badge>
                </div>

                {/* Key dates row */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <p className="text-white/60 text-xs mb-1">Start Date</p>
                    <p className="text-white text-sm font-semibold">{formatDate(sub.currentPeriodStart)}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <p className="text-white/60 text-xs mb-1">Expiry Date</p>
                    <p className="text-white text-sm font-semibold">{formatDate(sub.currentPeriodEnd)}</p>
                  </div>
                  <div className={`rounded-xl p-3 text-center ${
                    isExpired ? "bg-red-500/40" :
                    daysLeft <= 7 ? "bg-amber-400/30" : "bg-white/10"
                  }`}>
                    <p className="text-white/60 text-xs mb-1">Days Remaining</p>
                    <p className={`text-sm font-bold ${
                      isExpired ? "text-red-200" : daysLeft <= 7 ? "text-amber-200" : "text-white"
                    }`}>
                      {isExpired ? "Expired" : `${daysLeft} day${daysLeft !== 1 ? "s" : ""}`}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 mb-5">
                  <div className="flex justify-between text-xs text-white/60">
                    <span>Billing period</span>
                    <span>{Math.round(periodPct)}% remaining</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/20">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isExpired ? "bg-red-400" :
                        daysLeft <= 7 ? "bg-amber-300" : "bg-white/80"
                      }`}
                      style={{ width: `${periodPct}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setTab("plans")}
                    className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition">
                    {isExpired ? <><RefreshCw className="h-3.5 w-3.5" /> Renew Now</> : <><TrendingUp className="h-3.5 w-3.5" /> Upgrade Plan</>}
                  </button>
                  <button onClick={() => setTab("invoices")}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition">
                    <FileText className="h-3.5 w-3.5" /> Invoices
                  </button>
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

              {/* Cancel (only for active non-expired) */}
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
                current={sub?.plan === plan && !isExpired}
                cycle={cycle}
                onSelect={() => plan !== "ENTERPRISE" && setPayingPlan(plan)}
              />
            ))}
          </div>

          {/* Info about payment flow */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-600">
            <Info className="h-4 w-4 flex-shrink-0 mt-0.5 text-gray-400" />
            <div>
              <p className="font-medium text-gray-700 mb-1">How payments work</p>
              <p className="text-xs">Pay via EVC Plus, Zaad, Sahal, Waafi, Premier Wallet, or Bank Transfer. Submit your transaction ID and an admin will verify and activate your subscription within 24 hours. For instant activation, use the EVC gateway if available.</p>
            </div>
          </div>
        </div>
      )}

      {/* Payment modal */}
      {payingPlan && (
        <Modal open onClose={() => setPayingPlan(null)} title={`Subscribe — ${payingPlan} Plan`} size="md">
          <PaymentForm
            plan={payingPlan}
            cycle={cycle}
            pharmacyId={sub?.pharmacyId}
            onClose={() => setPayingPlan(null)}
          />
        </Modal>
      )}

      {/* Cancel confirm modal */}
      {cancelConfirm && (
        <Modal open onClose={() => setCancelConfirm(false)} title="Cancel Subscription" size="sm">
          <div className="space-y-4">
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
              <p className="font-semibold mb-1">Are you sure?</p>
              <p>You'll keep full access until <strong>{sub ? formatDate(sub.currentPeriodEnd) : "—"}</strong>. After that, your account switches to read-only mode.</p>
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
