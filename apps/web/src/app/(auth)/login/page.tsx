"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPw, setShowPw] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await api.post("/v1/auth/login", data);
      setAuth(res.data.user, res.data.token);
      toast.success(`Welcome back, ${res.data.user.firstName}!`);
      router.push("/dashboard");
    } catch (err: any) {
      const msg = err.response?.data?.message ?? "Invalid email or password.";
      toast.error(msg);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#180D62", margin: "0 0 8px", lineHeight: 1.2 }}>
          Welcome back
        </h1>
        <p style={{ fontSize: 14, color: "#6B6B9A", margin: 0 }}>
          Sign in to your DawoLink account to continue.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, background: "#E8E4FF", borderRadius: 12, padding: 4, marginBottom: 32 }}>
        <div style={{ flex: 1, padding: "9px 16px", borderRadius: 9, background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", textAlign: "center", fontSize: 14, fontWeight: 700, color: "#180D62" }}>
          Sign In
        </div>
        <Link href="/register" style={{ flex: 1, padding: "9px 16px", borderRadius: 9, textAlign: "center", fontSize: 14, fontWeight: 500, color: "#9B9BC0", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
          Create Account
        </Link>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Email */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 7 }}>
            Email address
          </label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9B9BC0" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </span>
            <input
              {...register("email")}
              type="email"
              placeholder="pharmacist@clinic.so"
              autoComplete="email"
              style={{
                width: "100%",
                padding: "12px 14px 12px 42px",
                borderRadius: 10,
                border: errors.email ? "1.5px solid #EF4444" : "1.5px solid #E8E4FF",
                background: "white",
                fontSize: 14,
                color: "#180D62",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={e => (e.target.style.borderColor = "#2D1B8E")}
              onBlur={e => (e.target.style.borderColor = errors.email ? "#EF4444" : "#E8E4FF")}
            />
          </div>
          {errors.email && (
            <p style={{ fontSize: 12, color: "#EF4444", margin: "5px 0 0" }}>{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Password</label>
            <button
              type="button"
              style={{ fontSize: 12, color: "#2D1B8E", background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: 0 }}
            >
              Forgot password?
            </button>
          </div>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9B9BC0" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <input
              {...register("password")}
              type={showPw ? "text" : "password"}
              placeholder="Enter your password"
              autoComplete="current-password"
              style={{
                width: "100%",
                padding: "12px 44px 12px 42px",
                borderRadius: 10,
                border: errors.password ? "1.5px solid #EF4444" : "1.5px solid #E8E4FF",
                background: "white",
                fontSize: 14,
                color: "#180D62",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={e => (e.target.style.borderColor = "#2D1B8E")}
              onBlur={e => (e.target.style.borderColor = errors.password ? "#EF4444" : "#E8E4FF")}
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, color: "#9B9BC0" }}
            >
              {showPw ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                  <line x1="2" y1="2" x2="22" y2="22" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <p style={{ fontSize: 12, color: "#EF4444", margin: "5px 0 0" }}>{errors.password.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: "100%",
            padding: "13px",
            borderRadius: 10,
            border: "none",
            background: isSubmitting ? "#009E78" : "linear-gradient(90deg,#2D1B8E,#3D2AAD)",
            color: "white",
            fontSize: 15,
            fontWeight: 700,
            cursor: isSubmitting ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "opacity 0.15s",
          }}
        >
          {isSubmitting ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Signing in…
            </>
          ) : "Sign In"}
        </button>
      </form>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "28px 0" }}>
        <div style={{ flex: 1, height: 1, background: "#E8E4FF" }} />
        <span style={{ fontSize: 12, color: "#9B9BC0", fontWeight: 500 }}>or</span>
        <div style={{ flex: 1, height: 1, background: "#E8E4FF" }} />
      </div>

      {/* Create account link */}
      <p style={{ textAlign: "center", fontSize: 14, color: "#6B6B9A", margin: 0 }}>
        Don&apos;t have an account?{" "}
        <Link href="/register" style={{ color: "#2D1B8E", fontWeight: 700, textDecoration: "none" }}>
          Create one free →
        </Link>
      </p>

      {/* Role badges */}
      <div style={{ marginTop: 36, padding: "20px", background: "white", borderRadius: 14, border: "1px solid #E8E4FF" }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "#9B9BC0", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "center", margin: "0 0 14px" }}>
          All roles use the same portal
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
          {[
            { role: "Owner", icon: "🏪" },
            { role: "Pharmacist", icon: "💊" },
            { role: "Cashier", icon: "💳" },
            { role: "Manager", icon: "📊" },
          ].map(r => (
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
