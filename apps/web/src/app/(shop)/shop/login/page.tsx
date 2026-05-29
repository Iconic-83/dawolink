"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { customerApi, setCustomerToken } from "@/lib/customer-auth";

export default function ShopLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!phone.trim()) { setError("Enter your phone number"); return; }
    if (!password) { setError("Enter your password"); return; }

    setLoading(true);
    try {
      const { data } = await customerApi.post("/v1/marketplace/auth/login", {
        phone: phone.trim(),
        password,
      });
      setCustomerToken(data.token);
      router.push("/shop");
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Invalid phone number or password");
    } finally {
      setLoading(false);
    }
  }

  const inp: React.CSSProperties = {
    width: "100%", padding: "13px 14px", borderRadius: 12,
    border: "1.5px solid #E8E4FF", background: "#fff",
    fontSize: 15, color: "#180D62", outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={{
      minHeight: "calc(100vh - 56px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 16px",
    }}>
      <div style={{
        width: "100%", maxWidth: 400,
        background: "#fff", borderRadius: 20,
        padding: "36px 32px",
        boxShadow: "0 8px 32px rgba(24,13,98,0.1)",
        border: "1px solid #EDE9FF",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>👋</div>
          <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, color: "#180D62" }}>
            Welcome back
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "#6B6B9A" }}>
            Sign in to your DawoLink account
          </p>
        </div>

        {/* Tab toggle */}
        <div style={{
          display: "flex", background: "#F3F0FF", borderRadius: 12,
          padding: 4, marginBottom: 28,
        }}>
          <div style={{
            flex: 1, textAlign: "center", padding: "9px 0",
            borderRadius: 9, background: "#fff",
            boxShadow: "0 1px 6px rgba(24,13,98,0.08)",
            fontSize: 14, fontWeight: 700, color: "#180D62",
          }}>
            Sign In
          </div>
          <Link href="/shop/register" style={{
            flex: 1, textAlign: "center", padding: "9px 0", borderRadius: 9,
            fontSize: 14, fontWeight: 500, color: "#9B9BC0",
            textDecoration: "none", display: "block",
          }}>
            Register
          </Link>
        </div>

        <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Phone */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+252 61 234 5678"
              style={inp}
              autoFocus
              autoComplete="tel"
            />
          </div>

          {/* Password */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your password"
                style={{ ...inp, paddingRight: 44 }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 16, color: "#9B9BC0",
                }}
                tabIndex={-1}
              >
                {showPw ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: "#FEE2E2", borderRadius: 10, padding: "10px 14px",
              fontSize: 13, color: "#DC2626", fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "14px 0", borderRadius: 12,
              background: "linear-gradient(90deg, #00C897, #009E78)",
              color: "#fff", border: "none", fontSize: 15, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1, marginTop: 4,
            }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#9B9BC0" }}>
          Don't have an account?{" "}
          <Link href="/shop/register" style={{ color: "#00C897", fontWeight: 600, textDecoration: "none" }}>
            Register free
          </Link>
        </p>
      </div>
    </div>
  );
}
