"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { customerApi, useCustomerAuth } from "@/lib/customer-auth";

const STATUS: Record<string, { label: string; bg: string; color: string; icon: string }> = {
  PENDING:          { label: "Pending",          bg: "#FEF3C7", color: "#92400E", icon: "⏳" },
  CONFIRMED:        { label: "Confirmed",         bg: "#DBEAFE", color: "#1E40AF", icon: "✅" },
  PREPARING:        { label: "Preparing",         bg: "#EDE9FF", color: "#2D1B8E", icon: "👨‍⚕️" },
  READY_FOR_PICKUP: { label: "Ready for Pickup",  bg: "#E6FAF4", color: "#007A5E", icon: "📦" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery",  bg: "#E0F2FE", color: "#0369A1", icon: "🚚" },
  DELIVERED:        { label: "Delivered",         bg: "#DCFCE7", color: "#166534", icon: "🎉" },
  CANCELLED:        { label: "Cancelled",         bg: "#FEE2E2", color: "#991B1B", icon: "✕" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useCustomerAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/shop/login"); return; }

    customerApi.get("/v1/marketplace/orders")
      .then(r => setOrders(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  if (authLoading || loading) return (
    <div style={{ textAlign: "center", padding: "80px 16px", color: "#9B9BC0" }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #EDE9FF", borderTopColor: "#00C897", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 16px 64px" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ padding: "24px 0 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "#180D62" }}>My Orders</h1>
          <p style={{ margin: 0, fontSize: 13, color: "#9B9BC0" }}>
            {orders.length === 0 ? "No orders yet" : `${orders.length} order${orders.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link href="/shop/loyalty" style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "#F4F2FF", borderRadius: 10, padding: "6px 12px",
            fontSize: 13, fontWeight: 600, color: "#2D1B8E", textDecoration: "none",
          }}>
            🏆 Points
          </Link>
          <Link href="/shop" style={{ color: "#00C897", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
            ← Browse
          </Link>
        </div>
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 16px" }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🛍️</div>
          <p style={{ fontWeight: 700, color: "#180D62", fontSize: 18, margin: "0 0 8px" }}>No orders yet</p>
          <p style={{ color: "#9B9BC0", fontSize: 14, margin: "0 0 24px" }}>Find medicines at nearby pharmacies</p>
          <Link href="/shop" style={{
            display: "inline-block", padding: "12px 28px", borderRadius: 12,
            background: "linear-gradient(90deg, #00C897, #009E78)",
            color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none",
          }}>
            Browse Medicines
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {orders.map((order: any) => {
            const s = STATUS[order.status] ?? STATUS.PENDING;
            return (
              <Link key={order.id} href={`/shop/orders/${order.id}`} style={{ textDecoration: "none" }}>
                <div style={{
                  background: "#fff", borderRadius: 16, padding: "16px 18px",
                  border: "1px solid #EDE9FF", cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(24,13,98,0.05)",
                  transition: "box-shadow 0.15s",
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(24,13,98,0.1)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(24,13,98,0.05)"}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 14 }}>{s.icon}</span>
                        <span style={{ background: s.bg, color: s.color, borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700 }}>
                          {s.label}
                        </span>
                      </div>
                      <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 14, color: "#180D62" }}>
                        {order.orderNo}
                      </p>
                      <p style={{ margin: "0 0 4px", fontSize: 13, color: "#6B6B9A" }}>{order.pharmacy?.name}</p>
                      <p style={{ margin: 0, fontSize: 12, color: "#9B9BC0" }}>
                        {order.items?.map((i: any) => `${i.medicineName} ×${i.quantity}`).join(", ")}
                      </p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 800, color: "#180D62" }}>
                        ${Number(order.total).toFixed(2)}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: "#9B9BC0" }}>{timeAgo(order.createdAt)}</p>
                      <p style={{ margin: "4px 0 0", fontSize: 11, color: "#B0A8D4" }}>
                        {order.deliveryType === "DELIVERY" ? "🚚 Delivery" : "🏪 Pickup"}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
