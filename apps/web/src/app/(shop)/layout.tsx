"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCustomerAuth } from "@/lib/customer-auth";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useCustomerAuth();

  const isAuthPage = pathname === "/shop/login" || pathname === "/shop/register";

  function handleLogout() {
    logout();
    router.push("/shop");
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F7F5FF" }}>
      <header style={{
        background: "linear-gradient(90deg, #0F0845 0%, #180D62 100%)",
        padding: "0 20px",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}>
        {/* Logo */}
        <Link href="/shop" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <img src="/logo.png" alt="DawoLink" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "contain" }} />
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>
            Dawo<span style={{ color: "#00C897" }}>Link</span>
          </span>
        </Link>

        {/* Auth area */}
        {!loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {user ? (
              <>
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
                  Hi, <strong style={{ color: "#fff" }}>{user.name.split(" ")[0]}</strong>
                </span>
                <button
                  onClick={handleLogout}
                  style={{
                    background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.75)", borderRadius: 8, padding: "5px 12px",
                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  Sign out
                </button>
              </>
            ) : !isAuthPage ? (
              <>
                <Link href="/shop/login" style={{
                  color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: 600,
                  textDecoration: "none", padding: "5px 10px",
                }}>
                  Sign in
                </Link>
                <Link href="/shop/register" style={{
                  background: "linear-gradient(90deg, #00C897, #009E78)",
                  color: "#fff", borderRadius: 8, padding: "6px 14px",
                  fontSize: 12, fontWeight: 700, textDecoration: "none",
                }}>
                  Register
                </Link>
              </>
            ) : null}
          </div>
        )}
      </header>

      <main>{children}</main>

      <footer style={{ textAlign: "center", padding: "32px 16px", color: "#9B9BC0", fontSize: 12 }}>
        © {new Date().getFullYear()} DawoLink · Somalia
      </footer>
    </div>
  );
}
