"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "◉" },
  { href: "/admin/pharmacies", label: "Pharmacies", icon: "🏥" },
  { href: "/admin/medicines", label: "Medicine DB", icon: "💊" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pathname === "/admin-login") { setLoading(false); return; }
    const token = localStorage.getItem("admin_token");
    if (!token) { router.push("/admin-login"); return; }

    api.get("/v1/admin/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { setAdmin(r.data); setLoading(false); })
      .catch(() => { localStorage.removeItem("admin_token"); router.push("/admin-login"); });
  }, [pathname, router]);

  if (pathname === "/admin-login") return <>{children}</>;
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0F0845" }}>
        <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: "#00C897" }} />
      </div>
    );
  }

  return (
    <div className="flex h-screen" style={{ background: "#F4F2FF" }}>
      {/* Sidebar */}
      <aside className="w-56 flex flex-col h-screen" style={{ background: "linear-gradient(180deg, #0F0845 0%, #180D62 100%)" }}>
        <div className="px-5 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: "linear-gradient(135deg, #00C897, #4A8FE5)" }}>D</div>
            <div>
              <div className="text-white text-sm font-bold">Dawo<span style={{ color: "#00C897" }}>Link</span></div>
              <div className="text-xs" style={{ color: "#7DEBCE" }}>Platform Admin</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(item => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition"
                style={active
                  ? { background: "linear-gradient(90deg, #00C897, #009E78)", color: "#fff" }
                  : { color: "rgba(255,255,255,0.6)" }
                }>
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Signed in as</div>
          <div className="text-white text-sm font-medium truncate">{admin?.firstName} {admin?.lastName}</div>
          <button onClick={() => { localStorage.removeItem("admin_token"); router.push("/admin-login"); }}
            className="mt-2 text-xs" style={{ color: "#00C897" }}>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
