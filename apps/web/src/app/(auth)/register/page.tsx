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
  pharmacyName: z.string().min(2, "Pharmacy name must be at least 2 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p style={{ fontSize: 12, color: "#EF4444", margin: "5px 0 0" }}>{msg}</p>;
}

function Label({ children }: { children: string }) {
  return <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 7 }}>{children}</label>;
}

function Input({ hasError, icon, rightSlot, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean; icon?: React.ReactNode; rightSlot?: React.ReactNode }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      {icon && (
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
          {icon}
        </span>
      )}
      <input
        {...props}
        style={{
          width: "100%",
          padding: `12px ${rightSlot ? "44px" : "14px"} 12px ${icon ? "42px" : "14px"}`,
          borderRadius: 10,
          border: `1.5px solid ${hasError ? "#EF4444" : focused ? "#2D1B8E" : "#E8E4FF"}`,
          background: "white",
          fontSize: 14,
          color: "#180D62",
          outline: "none",
          boxSizing: "border-box" as const,
          transition: "border-color 0.15s",
          ...(props.style || {}),
        }}
        onFocus={e => { setFocused(true); props.onFocus?.(e); }}
        onBlur={e => { setFocused(false); props.onBlur?.(e); }}
      />
      {rightSlot && (
        <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)" }}>
          {rightSlot}
        </span>
      )}
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await api.post("/v1/auth/signup", {
        pharmacyName: data.pharmacyName,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });
      setAuth(res.data.user, res.data.token);
      toast.success(`Welcome to DawoLink, ${res.data.user.firstName}! Your 14-day trial has started.`);
      router.push("/dashboard");
    } catch (err: any) {
      const msg = err.response?.data?.message ?? "Registration failed. Please try again.";
      toast.error(msg);
    }
  };

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

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#180D62", margin: "0 0 8px", lineHeight: 1.2 }}>
          Create your pharmacy account
        </h1>
        <p style={{ fontSize: 14, color: "#6B6B9A", margin: 0 }}>
          14-day free trial. No credit card required.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, background: "#E8E4FF", borderRadius: 12, padding: 4, marginBottom: 28 }}>
        <Link href="/login" style={{ flex: 1, padding: "9px 16px", borderRadius: 9, textAlign: "center", fontSize: 14, fontWeight: 500, color: "#9B9BC0", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
          Sign In
        </Link>
        <div style={{ flex: 1, padding: "9px 16px", borderRadius: 9, background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", textAlign: "center", fontSize: 14, fontWeight: 700, color: "#180D62" }}>
          Create Account
        </div>
      </div>

      {/* Free trial banner */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#D1FAE5", borderRadius: 10, padding: "10px 14px", marginBottom: 24, border: "1px solid #6EE7B7" }}>
        <span style={{ fontSize: 16 }}>🎉</span>
        <span style={{ fontSize: 13, color: "#065F46", fontWeight: 500 }}>
          You get <strong>14 days free</strong> to explore DawoLink — no payment needed to start.
        </span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Pharmacy Name */}
        <div style={{ marginBottom: 18 }}>
          <Label>Pharmacy Name</Label>
          <Input
            {...register("pharmacyName")}
            placeholder="e.g. Al-Noor Pharmacy"
            hasError={!!errors.pharmacyName}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9B9BC0" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            }
          />
          <FieldError msg={errors.pharmacyName?.message} />
        </div>

        {/* First + Last name */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
          <div>
            <Label>First Name</Label>
            <Input
              {...register("firstName")}
              placeholder="Ahmed"
              hasError={!!errors.firstName}
            />
            <FieldError msg={errors.firstName?.message} />
          </div>
          <div>
            <Label>Last Name</Label>
            <Input
              {...register("lastName")}
              placeholder="Hassan"
              hasError={!!errors.lastName}
            />
            <FieldError msg={errors.lastName?.message} />
          </div>
        </div>

        {/* Email */}
        <div style={{ marginBottom: 18 }}>
          <Label>Email Address</Label>
          <Input
            {...register("email")}
            type="email"
            placeholder="owner@pharmacy.so"
            hasError={!!errors.email}
            autoComplete="email"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9B9BC0" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            }
          />
          <FieldError msg={errors.email?.message} />
        </div>

        {/* Phone (optional) */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Phone Number</label>
            <span style={{ fontSize: 11, color: "#9B9BC0", fontWeight: 500 }}>Optional</span>
          </div>
          <Input
            {...register("phone")}
            type="tel"
            placeholder="+252 61 XXX XXXX"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9B9BC0" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 3.07 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            }
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: 18 }}>
          <Label>Password</Label>
          <Input
            {...register("password")}
            type={showPw ? "text" : "password"}
            placeholder="Min. 8 characters"
            hasError={!!errors.password}
            autoComplete="new-password"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9B9BC0" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            }
            rightSlot={
              <button type="button" onClick={() => setShowPw(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                <EyeIcon open={showPw} />
              </button>
            }
          />
          <FieldError msg={errors.password?.message} />
        </div>

        {/* Confirm Password */}
        <div style={{ marginBottom: 28 }}>
          <Label>Confirm Password</Label>
          <Input
            {...register("confirmPassword")}
            type={showConfirm ? "text" : "password"}
            placeholder="Repeat your password"
            hasError={!!errors.confirmPassword}
            autoComplete="new-password"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9B9BC0" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            }
            rightSlot={
              <button type="button" onClick={() => setShowConfirm(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                <EyeIcon open={showConfirm} />
              </button>
            }
          />
          <FieldError msg={errors.confirmPassword?.message} />
        </div>

        {/* Terms notice */}
        <p style={{ fontSize: 12, color: "#9B9BC0", textAlign: "center", margin: "0 0 20px", lineHeight: 1.6 }}>
          By creating an account you agree to DawoLink&apos;s{" "}
          <span style={{ color: "#2D1B8E", fontWeight: 600, cursor: "pointer" }}>Terms of Service</span>{" "}
          and{" "}
          <span style={{ color: "#2D1B8E", fontWeight: 600, cursor: "pointer" }}>Privacy Policy</span>.
        </p>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: "100%",
            padding: "13px",
            borderRadius: 10,
            border: "none",
            background: isSubmitting ? "#009E78" : "linear-gradient(90deg,#00C897,#009E78)",
            color: "white",
            fontSize: 15,
            fontWeight: 700,
            cursor: isSubmitting ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            boxShadow: "0 4px 16px rgba(0,200,151,0.3)",
          }}
        >
          {isSubmitting ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Creating account…
            </>
          ) : "Create Account — Free"}
        </button>
      </form>

      {/* Sign in link */}
      <p style={{ textAlign: "center", fontSize: 14, color: "#6B6B9A", margin: "24px 0 0" }}>
        Already have an account?{" "}
        <Link href="/login" style={{ color: "#2D1B8E", fontWeight: 700, textDecoration: "none" }}>
          Sign in →
        </Link>
      </p>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
