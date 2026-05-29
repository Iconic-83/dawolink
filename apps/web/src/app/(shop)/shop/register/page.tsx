"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { customerApi, setCustomerToken } from "@/lib/customer-auth";

const SOMALI_CITIES = [
  "Mogadishu", "Hargeisa", "Bosaso", "Kismayo", "Baidoa",
  "Garowe", "Beledweyne", "Marka", "Jilib", "Gaalkacyo",
];

export default function ShopRegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "", phone: "", password: "", confirmPassword: "",
    email: "", city: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: "" }));
    setApiError("");
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    else if (!/^\+?[0-9]{7,15}$/.test(form.phone.replace(/\s/g, ""))) e.phone = "Enter a valid phone number";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8) e.password = "At least 8 characters";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setApiError("");
    try {
      const payload: any = {
        name: form.name.trim(),
        phone: form.phone.trim().replace(/\s/g, ""),
        password: form.password,
      };
      if (form.email.trim()) payload.email = form.email.trim();
      if (form.city) payload.city = form.city;

      const { data } = await customerApi.post("/v1/marketplace/auth/register", payload);
      setCustomerToken(data.token);
      router.push("/shop");
    } catch (err: any) {
      setApiError(err.response?.data?.message ?? "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inp = (field: string): React.CSSProperties => ({
    width: "100%", padding: "13px 14px", borderRadius: 12,
    border: `1.5px solid ${errors[field] ? "#EF4444" : "#E8E4FF"}`,
    background: "#fff", fontSize: 15, color: "#180D62",
    outline: "none", boxSizing: "border-box",
  });

  const sel: React.CSSProperties = {
    width: "100%", padding: "13px 14px", borderRadius: 12,
    border: "1.5px solid #E8E4FF", background: "#fff",
    fontSize: 15, color: "#180D62", outline: "none",
    boxSizing: "border-box", appearance: "none",
  };

  return (
    <div style={{
      minHeight: "calc(100vh - 56px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 16px",
    }}>
      <div style={{
        width: "100%", maxWidth: 420,
        background: "#fff", borderRadius: 20,
        padding: "36px 32px",
        boxShadow: "0 8px 32px rgba(24,13,98,0.1)",
        border: "1px solid #EDE9FF",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>💊</div>
          <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, color: "#180D62" }}>
            Create your account
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "#6B6B9A" }}>
            Find medicines near you across Somalia
          </p>
        </div>

        {/* Tab toggle */}
        <div style={{
          display: "flex", background: "#F3F0FF", borderRadius: 12,
          padding: 4, marginBottom: 28,
        }}>
          <Link href="/shop/login" style={{
            flex: 1, textAlign: "center", padding: "9px 0", borderRadius: 9,
            fontSize: 14, fontWeight: 500, color: "#9B9BC0",
            textDecoration: "none", display: "block",
          }}>
            Sign In
          </Link>
          <div style={{
            flex: 1, textAlign: "center", padding: "9px 0",
            borderRadius: 9, background: "#fff",
            boxShadow: "0 1px 6px rgba(24,13,98,0.08)",
            fontSize: 14, fontWeight: 700, color: "#180D62",
          }}>
            Register
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Full name */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Full Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => set("name", e.target.value)}
              placeholder="e.g. Axmed Cabdi"
              style={inp("name")}
              autoFocus
              autoComplete="name"
            />
            {errors.name && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#EF4444" }}>{errors.name}</p>}
          </div>

          {/* Phone */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Phone Number *
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => set("phone", e.target.value)}
              placeholder="+252 61 234 5678"
              style={inp("phone")}
              autoComplete="tel"
            />
            {errors.phone && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#EF4444" }}>{errors.phone}</p>}
          </div>

          {/* Password */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Password *
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={e => set("password", e.target.value)}
                placeholder="At least 8 characters"
                style={{ ...inp("password"), paddingRight: 44 }}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#9B9BC0",
                }}
                tabIndex={-1}
              >
                {showPw ? "🙈" : "👁️"}
              </button>
            </div>
            {errors.password && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#EF4444" }}>{errors.password}</p>}
          </div>

          {/* Confirm password */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Confirm Password *
            </label>
            <input
              type={showPw ? "text" : "password"}
              value={form.confirmPassword}
              onChange={e => set("confirmPassword", e.target.value)}
              placeholder="Repeat your password"
              style={inp("confirmPassword")}
              autoComplete="new-password"
            />
            {errors.confirmPassword && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#EF4444" }}>{errors.confirmPassword}</p>}
          </div>

          {/* Divider — optional fields */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0" }}>
            <div style={{ flex: 1, height: 1, background: "#EDE9FF" }} />
            <span style={{ fontSize: 12, color: "#9B9BC0", whiteSpace: "nowrap" }}>Optional</span>
            <div style={{ flex: 1, height: 1, background: "#EDE9FF" }} />
          </div>

          {/* Email (optional) */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => set("email", e.target.value)}
              placeholder="your@email.com"
              style={inp("email")}
              autoComplete="email"
            />
            {errors.email && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#EF4444" }}>{errors.email}</p>}
          </div>

          {/* City (optional) */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              City
            </label>
            <div style={{ position: "relative" }}>
              <select value={form.city} onChange={e => set("city", e.target.value)} style={sel}>
                <option value="">Select your city…</option>
                {SOMALI_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <span style={{
                position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                pointerEvents: "none", color: "#9B9BC0", fontSize: 12,
              }}>▼</span>
            </div>
          </div>

          {/* API error */}
          {apiError && (
            <div style={{
              background: "#FEE2E2", borderRadius: 10, padding: "10px 14px",
              fontSize: 13, color: "#DC2626", fontWeight: 500,
            }}>
              {apiError}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "14px 0", borderRadius: 12, marginTop: 4,
              background: "linear-gradient(90deg, #00C897, #009E78)",
              color: "#fff", border: "none", fontSize: 15, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>

          <p style={{ textAlign: "center", margin: "4px 0 0", fontSize: 12, color: "#9B9BC0", lineHeight: 1.6 }}>
            By registering you agree to use DawoLink responsibly.<br />
            Always consult a pharmacist or doctor for medical advice.
          </p>
        </form>

        <p style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: "#9B9BC0" }}>
          Already have an account?{" "}
          <Link href="/shop/login" style={{ color: "#00C897", fontWeight: 600, textDecoration: "none" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
