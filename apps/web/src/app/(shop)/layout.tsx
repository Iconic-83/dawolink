import Link from "next/link";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#F7F5FF" }}>
      <header style={{
        background: "linear-gradient(90deg, #0F0845 0%, #180D62 100%)",
        padding: "0 24px",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}>
        <Link href="/shop" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <img src="/logo.png" alt="DawoLink" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "contain" }} />
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>
            Dawo<span style={{ color: "#00C897" }}>Link</span>
          </span>
        </Link>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>Find medicines near you</p>
      </header>
      <main>{children}</main>
      <footer style={{ textAlign: "center", padding: "32px 16px", color: "#9B9BC0", fontSize: 12 }}>
        © {new Date().getFullYear()} DawoLink · Somalia
      </footer>
    </div>
  );
}
