"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  // 2FA step
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [verifying, setVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = "Enter a valid email address";
    if (!password) errs.password = "Password is required";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    try {
      const res = await api.post("/v1/auth/login", { email: email.trim(), password });
      if (res.data.requires2FA) {
        setTempToken(res.data.tempToken);
        setRequires2FA(true);
        toast.info("A verification code was sent to your email.");
        return;
      }
      setAuth(res.data.user, res.data.token);
      toast.success(`Welcome back, ${res.data.user.firstName}!`);
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { setOtpError("Enter the 6-digit code"); return; }
    setOtpError("");
    setVerifying(true);
    try {
      const res = await api.post("/v1/auth/verify-otp", { tempToken, otp });
      setAuth(res.data.user, res.data.token);
      toast.success(`Welcome back, ${res.data.user.firstName}!`);
      router.push("/dashboard");
    } catch (err: any) {
      setOtpError(err.response?.data?.message ?? "Invalid or expired code.");
    } finally {
      setVerifying(false);
    }
  };

  const inputStyle = (hasError?: string): React.CSSProperties => ({
    width: "100%", padding: "12px 14px", borderRadius: 10,
    border: `1.5px solid ${hasError ? "#EF4444" : "#E8E4FF"}`,
    background: "white", fontSize: 14, color: "#180D62",
    outline: "none", boxSizing: "border-box", transition: "border-color 0.15s",
  });

  // ── 2FA OTP screen ────────────────────────────────────────────────────────
  if (requires2FA) {
    return (
      <div>
        <div style={{ marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#180D62,#2D1B8E)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00C897" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#180D62", margin: "0 0 8px" }}>Check your email</h1>
          <p style={{ fontSize: 14, color: "#6B6B9A", margin: 0 }}>
            We sent a 6-digit code to <strong style={{ color: "#180D62" }}>{email}</strong>. Enter it below to sign in.
          </p>
        </div>

        <form onSubmit={handleVerifyOtp} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 7 }}>Verification Code</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={e => { setOtp(e.target.value.replace(/\D/g, "")); setOtpError(""); }}
              placeholder="000000"
              autoFocus
              style={{
                width: "100%", padding: "14px", borderRadius: 10, textAlign: "center",
                fontSize: 28, fontWeight: 800, letterSpacing: 12, fontFamily: "monospace",
                border: `1.5px solid ${otpError ? "#EF4444" : "#E8E4FF"}`,
                outline: "none", boxSizing: "border-box" as const, color: "#180D62",
              }}
            />
            {otpError && <p style={{ fontSize: 12, color: "#EF4444", margin: "5px 0 0" }}>{otpError}</p>}
          </div>

          <button
            type="submit"
            disabled={verifying || otp.length !== 6}
            style={{
              width: "100%", padding: "13px", borderRadius: 10, border: "none",
              background: "linear-gradient(90deg,#00C897,#009E78)",
              color: "white", fontSize: 15, fontWeight: 700,
              cursor: verifying ? "not-allowed" : "pointer", opacity: otp.length !== 6 ? 0.6 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {verifying ? "Verifying…" : "Verify & Sign In"}
          </button>

          <button
            type="button"
            onClick={() => { setRequires2FA(false); setOtp(""); setOtpError(""); }}
            style={{ background: "none", border: "none", color: "#6B6B9A", fontSize: 13, cursor: "pointer", textAlign: "center" }}
          >
            ← Back to sign in
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#180D62", margin: "0 0 8px", lineHeight: 1.2 }}>Welcome back</h1>
        <p style={{ fontSize: 14, color: "#6B6B9A", margin: 0 }}>Sign in to your DawoLink account to continue.</p>
      </div>

      <div style={{ display: "flex", background: "#E8E4FF", borderRadius: 12, padding: 4, marginBottom: 32 }}>
        <div style={{ flex: 1, padding: "9px 16px", borderRadius: 9, background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", textAlign: "center", fontSize: 14, fontWeight: 700, color: "#180D62" }}>Sign In</div>
        <Link href="/register" style={{ flex: 1, padding: "9px 16px", borderRadius: 9, textAlign: "center", fontSize: 14, fontWeight: 500, color: "#9B9BC0", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>Create Account</Link>
      </div>

      <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 7 }}>Email address</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9B9BC0" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
            </span>
            <input
              type="email"
              name="email"
              placeholder="pharmacist@clinic.so"
              autoComplete="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })); }}
              style={{ ...inputStyle(errors.email), paddingLeft: 42 }}
              onFocus={e => (e.target.style.borderColor = "#2D1B8E")}
              onBlur={e => (e.target.style.borderColor = errors.email ? "#EF4444" : "#E8E4FF")}
            />
          </div>
          {errors.email && <p style={{ fontSize: 12, color: "#EF4444", margin: "5px 0 0" }}>{errors.email}</p>}
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Password</label>
            <button type="button" style={{ fontSize: 12, color: "#2D1B8E", background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: 0 }}>Forgot password?</button>
          </div>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9B9BC0" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            </span>
            <input
              type={showPw ? "text" : "password"}
              name="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })); }}
              style={{ ...inputStyle(errors.password), paddingLeft: 42, paddingRight: 44 }}
              onFocus={e => (e.target.style.borderColor = "#2D1B8E")}
              onBlur={e => (e.target.style.borderColor = errors.password ? "#EF4444" : "#E8E4FF")}
            />
            <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, color: "#9B9BC0" }}>
              {showPw
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" /></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
              }
            </button>
          </div>
          {errors.password && <p style={{ fontSize: 12, color: "#EF4444", margin: "5px 0 0" }}>{errors.password}</p>}
        </div>

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: "100%", padding: "13px", borderRadius: 10, border: "none",
            background: submitting ? "#1e1260" : "linear-gradient(90deg,#2D1B8E,#3D2AAD)",
            color: "white", fontSize: 15, fontWeight: 700,
            cursor: submitting ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          {submitting
            ? <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>Signing in…</>
            : "Sign In"
          }
        </button>
      </form>

      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "28px 0" }}>
        <div style={{ flex: 1, height: 1, background: "#E8E4FF" }} />
        <span style={{ fontSize: 12, color: "#9B9BC0", fontWeight: 500 }}>or</span>
        <div style={{ flex: 1, height: 1, background: "#E8E4FF" }} />
      </div>

      <p style={{ textAlign: "center", fontSize: 14, color: "#6B6B9A", margin: 0 }}>
        Don&apos;t have an account?{" "}
        <Link href="/register" style={{ color: "#2D1B8E", fontWeight: 700, textDecoration: "none" }}>Create one free →</Link>
      </p>

      <div style={{ marginTop: 36, padding: "20px", background: "white", borderRadius: 14, border: "1px solid #E8E4FF" }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "#9B9BC0", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "center", margin: "0 0 14px" }}>All roles use the same portal</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
          {[{ role: "Owner", icon: "🏪" }, { role: "Pharmacist", icon: "💊" }, { role: "Cashier", icon: "💳" }, { role: "Manager", icon: "📊" }].map(r => (
            <div key={r.role} style={{ background: "#F4F2FF", borderRadius: 10, padding: "10px 6px", textAlign: "center", border: "1px solid #E8E4FF" }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{r.icon}</div>
              <div style={{ fontSize: 11, color: "#6B6B9A", fontWeight: 500 }}>{r.role}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
