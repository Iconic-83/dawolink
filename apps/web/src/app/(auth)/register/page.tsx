"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

function validate(f: Record<string, string>) {
  const e: Record<string, string> = {};
  if (f.pharmacyName.trim().length < 2) e.pharmacyName = "Pharmacy name must be at least 2 characters";
  if (!f.firstName.trim()) e.firstName = "First name is required";
  if (!f.lastName.trim()) e.lastName = "Last name is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = "Enter a valid email address";
  if (f.password.length < 8) e.password = "Password must be at least 8 characters";
  if (f.password !== f.confirmPassword) e.confirmPassword = "Passwords do not match";
  return e;
}

const EyeIcon = ({ open }: { open: boolean }) => open ? (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9B9BC0" strokeWidth="2">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
) : (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9B9BC0" strokeWidth="2">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({
    pharmacyName: "", firstName: "", lastName: "",
    email: "", phone: "", password: "", confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      const res = await api.post("/v1/auth/signup", {
        pharmacyName: form.pharmacyName.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone || undefined,
        password: form.password,
      });
      setAuth(res.data.user, res.data.token);
      toast.success(`Welcome to DawoLink, ${res.data.user.firstName}! Your 14-day trial has started.`);
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const field = (name: string, opts: {
    label: string; placeholder: string; type?: string;
    icon: React.ReactNode; rightSlot?: React.ReactNode; optional?: boolean;
  }) => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{opts.label}</label>
        {opts.optional && <span style={{ fontSize: 11, color: "#9B9BC0", fontWeight: 500 }}>Optional</span>}
      </div>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
          {opts.icon}
        </span>
        <input
          name={name}
          type={opts.type ?? "text"}
          placeholder={opts.placeholder}
          autoComplete={name === "confirmPassword" ? "new-password" : name === "password" ? "new-password" : name === "email" ? "email" : "off"}
          value={form[name as keyof typeof form]}
          onChange={set(name)}
          style={{
            width: "100%",
            padding: `12px ${opts.rightSlot ? "44px" : "14px"} 12px 42px`,
            borderRadius: 10,
            border: `1.5px solid ${errors[name] ? "#EF4444" : "#E8E4FF"}`,
            background: "white",
            fontSize: 14,
            color: "#180D62",
            outline: "none",
            boxSizing: "border-box" as const,
            transition: "border-color 0.15s",
          }}
          onFocus={e => (e.target.style.borderColor = errors[name] ? "#EF4444" : "#2D1B8E")}
          onBlur={e => (e.target.style.borderColor = errors[name] ? "#EF4444" : "#E8E4FF")}
        />
        {opts.rightSlot && (
          <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)" }}>
            {opts.rightSlot}
          </span>
        )}
      </div>
      {errors[name] && <p style={{ fontSize: 12, color: "#EF4444", margin: "5px 0 0" }}>{errors[name]}</p>}
    </div>
  );

  const pwToggle = (show: boolean, toggle: () => void) => (
    <button type="button" onClick={toggle} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
      <EyeIcon open={show} />
    </button>
  );

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#180D62", margin: "0 0 8px", lineHeight: 1.2 }}>
          Create your pharmacy account
        </h1>
        <p style={{ fontSize: 14, color: "#6B6B9A", margin: 0 }}>14-day free trial. No credit card required.</p>
      </div>

      <div style={{ display: "flex", background: "#E8E4FF", borderRadius: 12, padding: 4, marginBottom: 28 }}>
        <Link href="/login" style={{ flex: 1, padding: "9px 16px", borderRadius: 9, textAlign: "center", fontSize: 14, fontWeight: 500, color: "#9B9BC0", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>Sign In</Link>
        <div style={{ flex: 1, padding: "9px 16px", borderRadius: 9, background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", textAlign: "center", fontSize: 14, fontWeight: 700, color: "#180D62" }}>Create Account</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#D1FAE5", borderRadius: 10, padding: "10px 14px", marginBottom: 24, border: "1px solid #6EE7B7" }}>
        <span style={{ fontSize: 16 }}>🎉</span>
        <span style={{ fontSize: 13, color: "#065F46", fontWeight: 500 }}>You get <strong>14 days free</strong> to explore DawoLink — no payment needed to start.</span>
      </div>

      <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {field("pharmacyName", {
          label: "Pharmacy Name", placeholder: "e.g. Al-Noor Pharmacy",
          icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9B9BC0" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
        })}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {field("firstName", { label: "First Name", placeholder: "Ahmed", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9B9BC0" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg> })}
          {field("lastName",  { label: "Last Name",  placeholder: "Hassan", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9B9BC0" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg> })}
        </div>

        {field("email", {
          label: "Email Address", placeholder: "owner@pharmacy.so", type: "email",
          icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9B9BC0" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>,
        })}

        {field("phone", {
          label: "Phone Number", placeholder: "+252 61 XXX XXXX", optional: true,
          icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9B9BC0" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 3.07 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>,
        })}

        {field("password", {
          label: "Password", placeholder: "Min. 8 characters", type: showPw ? "text" : "password",
          icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9B9BC0" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
          rightSlot: pwToggle(showPw, () => setShowPw(v => !v)),
        })}

        {field("confirmPassword", {
          label: "Confirm Password", placeholder: "Repeat your password", type: showConfirm ? "text" : "password",
          icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9B9BC0" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
          rightSlot: pwToggle(showConfirm, () => setShowConfirm(v => !v)),
        })}

        <p style={{ fontSize: 12, color: "#9B9BC0", textAlign: "center", margin: "4px 0 0", lineHeight: 1.6 }}>
          By creating an account you agree to DawoLink&apos;s{" "}
          <span style={{ color: "#2D1B8E", fontWeight: 600, cursor: "pointer" }}>Terms of Service</span>{" "}
          and <span style={{ color: "#2D1B8E", fontWeight: 600, cursor: "pointer" }}>Privacy Policy</span>.
        </p>

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: "100%", padding: "13px", borderRadius: 10, border: "none",
            background: submitting ? "#009E78" : "linear-gradient(90deg,#00C897,#009E78)",
            color: "white", fontSize: 15, fontWeight: 700,
            cursor: submitting ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: "0 4px 16px rgba(0,200,151,0.3)",
          }}
        >
          {submitting ? (
            <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>Creating account…</>
          ) : "Create Account — Free"}
        </button>
      </form>

      <p style={{ textAlign: "center", fontSize: 14, color: "#6B6B9A", margin: "24px 0 0" }}>
        Already have an account?{" "}
        <Link href="/login" style={{ color: "#2D1B8E", fontWeight: 700, textDecoration: "none" }}>Sign in →</Link>
      </p>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
