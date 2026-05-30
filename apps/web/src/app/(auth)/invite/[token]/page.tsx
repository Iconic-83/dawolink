"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

const ROLE_LABEL: Record<string, string> = {
  PHARMACY_OWNER:  "Pharmacy Owner",
  BRANCH_MANAGER:  "Branch Manager",
  PHARMACIST:      "Pharmacist",
  CASHIER:         "Cashier",
  INVENTORY_STAFF: "Inventory Staff",
  AUDITOR:         "Auditor",
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, "") ?? "http://localhost:4001";

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const setAuth = useAuthStore(s => s.setAuth);

  const [invite, setInvite] = useState<any>(null);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    api.get(`/v1/auth/invite/${token}`)
      .then(r => setInvite(r.data))
      .catch(e => setLoadError(e.response?.data?.message ?? "Invalid or expired invite link"));
  }, [token]);

  function set(k: string, v: string) {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: "" }));
    setApiError("");
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim()) e.lastName = "Required";
    if (form.password.length < 8) e.password = "Minimum 8 characters";
    if (form.password !== form.confirm) e.confirm = "Passwords do not match";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    setApiError("");
    try {
      const { data } = await api.post("/v1/auth/accept-invite", {
        token,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
      });
      setAuth(data.user, data.token);
      router.push("/dashboard");
    } catch (err: any) {
      setApiError(err.response?.data?.message ?? "Failed to create account");
    } finally {
      setSubmitting(false);
    }
  }

  const inp = (k: string) => ({
    className: `w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      errors[k] ? "border-red-300" : "border-gray-200"
    }`,
  });

  // ── Loading / error states ──────────────────────────────────────────────

  if (!invite && !loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🔗</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Invite</h1>
          <p className="text-gray-500 text-sm mb-6">{loadError}</p>
          <Link href="/login" className="text-blue-600 text-sm font-medium hover:underline">
            Go to login →
          </Link>
        </div>
      </div>
    );
  }

  // ── Accept form ─────────────────────────────────────────────────────────

  const logoSrc = invite.pharmacy.logoUrl ? `${API_BASE}${invite.pharmacy.logoUrl}` : null;
  const initials = invite.pharmacy.name?.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase() ?? "PH";

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#F4F2FF" }}>
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 overflow-hidden"
              style={{ background: logoSrc ? undefined : "linear-gradient(135deg, #180D62, #2D1B8E)" }}>
              {logoSrc
                ? <img src={logoSrc} alt="" className="w-full h-full object-cover" />
                : <span className="text-white text-xl font-bold">{initials}</span>}
            </div>
            <h1 className="text-lg font-bold text-gray-900">{invite.pharmacy.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{invite.pharmacy.city}</p>
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-xl">
              <span className="text-sm text-blue-700">
                You're invited as <strong>{ROLE_LABEL[invite.role] ?? invite.role}</strong>
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <p className="text-sm text-gray-500">
              Creating account for <strong className="text-gray-700">{invite.email}</strong>
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First name *</label>
                <input value={form.firstName} onChange={e => set("firstName", e.target.value)} placeholder="Ahmed" {...inp("firstName")} />
                {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last name *</label>
                <input value={form.lastName} onChange={e => set("lastName", e.target.value)} placeholder="Hassan" {...inp("lastName")} />
                {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+252 61 xxx xxxx" type="tel" {...inp("phone")} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input value={form.password} onChange={e => set("password", e.target.value)} type="password" placeholder="At least 8 characters" {...inp("password")} />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password *</label>
              <input value={form.confirm} onChange={e => set("confirm", e.target.value)} type="password" placeholder="Repeat your password" {...inp("confirm")} />
              {errors.confirm && <p className="text-xs text-red-500 mt-1">{errors.confirm}</p>}
            </div>

            {apiError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {apiError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Create Account & Join
            </button>

            <p className="text-center text-xs text-gray-400">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
