"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Truck,
  AlertTriangle,
  BarChart3,
  LogOut,
  Building2,
  ChevronRight,
  Pill,
  ShieldCheck,
  CreditCard,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pos", label: "Point of Sale", icon: ShoppingCart },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/expiry", label: "Expiry Alerts", icon: AlertTriangle },
  { href: "/suppliers", label: "Suppliers", icon: Truck },
  { href: "/staff", label: "Staff", icon: Users },
  { href: "/roles", label: "Roles", icon: ShieldCheck },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/audit-logs", label: "Audit Logs", icon: ClipboardList },
  { href: "/pharmacy", label: "Pharmacy", icon: Building2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside
      className="w-64 flex flex-col h-screen sticky top-0 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #180D62 0%, #2D1B8E 100%)" }}
    >
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #00C897, #4A8FE5)" }}
          >
            <Pill className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none tracking-tight">
              <span className="text-white">Dawo</span>
              <span style={{ color: "#00C897" }}>Link</span>
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "#00C89766" }}>
              Pharmacy Platform
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                active
                  ? "text-white shadow-lg"
                  : "text-white/60 hover:text-white hover:bg-white/10",
              )}
              style={
                active
                  ? { background: "linear-gradient(90deg, #00C897, #009E78)" }
                  : undefined
              }
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="h-3 w-3 opacity-70" />}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        {user && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #00C897, #4A8FE5)" }}
            >
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs truncate" style={{ color: "#00C89799" }}>
                {user.role.replace(/_/g, " ")}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-white/60 hover:bg-red-500/20 hover:text-red-300 transition"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
