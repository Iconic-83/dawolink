"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
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
      const msg = err.response?.data?.message ?? "Login failed. Check your credentials.";
      toast.error(msg);
    }
  };

  return (
    <div
      className="rounded-2xl p-8 shadow-2xl border border-white/15"
      style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(20px)" }}
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">Sign in to your account</h2>
        <p className="text-sm mt-1" style={{ color: "#00C89799" }}>
          Enter your credentials to continue
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-1.5">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              {...register("email")}
              type="email"
              placeholder="pharmacist@clinic.so"
              autoComplete="email"
              className="w-full pl-10 pr-4 py-3 rounded-xl text-white placeholder:text-white/30 outline-none transition"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#00C897")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.15)")}
            />
          </div>
          {errors.email && <p className="text-red-300 text-xs mt-1">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-1.5">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              {...register("password")}
              type={showPw ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full pl-10 pr-12 py-3 rounded-xl text-white placeholder:text-white/30 outline-none transition"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#00C897")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.15)")}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-red-300 text-xs mt-1">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 font-semibold text-white rounded-xl transition-all flex items-center justify-center gap-2 mt-2 shadow-lg"
          style={{
            background: isSubmitting
              ? "linear-gradient(90deg, #009E78, #007A5E)"
              : "linear-gradient(90deg, #00C897, #009E78)",
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { role: "Owner", icon: "🏪" },
            { role: "Pharmacist", icon: "💊" },
            { role: "Cashier", icon: "💳" },
          ].map((r) => (
            <div key={r.role} className="rounded-lg py-2 px-1" style={{ background: "rgba(0,200,151,0.08)", border: "1px solid rgba(0,200,151,0.15)" }}>
              <div className="text-lg">{r.icon}</div>
              <div className="text-xs" style={{ color: "#00C89799" }}>{r.role}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-center mt-3" style={{ color: "rgba(255,255,255,0.3)" }}>
          All roles use the same login portal
        </p>
      </div>
    </div>
  );
}
