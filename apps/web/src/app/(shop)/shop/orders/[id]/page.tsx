"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { customerApi, useCustomerAuth } from "@/lib/customer-auth";

const STATUS_STEPS = [
  { key: "PENDING",          label: "Pending",           icon: "⏳" },
  { key: "CONFIRMED",        label: "Confirmed",          icon: "✅" },
  { key: "PREPARING",        label: "Preparing",          icon: "👨‍⚕️" },
  { key: "READY_FOR_PICKUP", label: "Ready for Pickup",   icon: "📦" },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery",   icon: "🚚" },
  { key: "DELIVERED",        label: "Delivered",          icon: "🎉" },
];

const PAYMENT_LABEL: Record<string, string> = {
  CASH: "Cash on Delivery", EVC_PLUS: "EVC Plus",
  ZAAD: "Zaad", SAHAL: "Sahal",
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useCustomerAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/shop/login"); return; }
    if (!id) return;

    customerApi.get(`/v1/marketplace/orders/${id}`)
      .then(r => setOrder(r.data))
      .catch(() => router.push("/shop/orders"))
      .finally(() => setLoading(false));
  }, [user, authLoading, id]);

  async function handleCancel() {
    if (!confirm("Cancel this order?")) return;
    setCancelling(true);
    setCancelError("");
    try {
      const { data } = await customerApi.patch(`/v1/marketplace/orders/${id}/cancel`);
      setOrder(data);
    } catch (err: any) {
      setCancelError(err.response?.data?.message ?? "Could not cancel order");
    } finally {
      setCancelling(false);
    }
  }

  if (authLoading || loading) return (
    <div style={{ textAlign: "center", padding: "80px 16px" }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #EDE9FF", borderTopColor: "#00C897", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!order) return null;

  const isCancelled = order.status === "CANCELLED";
  const isDelivery = order.deliveryType === "DELIVERY";
  const currentStepIdx = isCancelled ? -1 : STATUS_STEPS.findIndex(s => s.key === order.status);
  const canCancel = order.status === "PENDING";

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px 64px" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ padding: "20px 0 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => router.push("/shop/orders")} style={{ background: "none", border: "none", color: "#6B6B9A", fontSize: 14, cursor: "pointer", padding: 0 }}>
          ← My Orders
        </button>
      </div>

      {/* Order header */}
      <div style={{ background: "#fff", borderRadius: 18, padding: "20px", border: "1px solid #EDE9FF", marginBottom: 16, boxShadow: "0 2px 10px rgba(24,13,98,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 13, color: "#9B9BC0" }}>Order number</p>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#180D62" }}>{order.orderNo}</p>
          </div>
          {isCancelled ? (
            <span style={{ background: "#FEE2E2", color: "#DC2626", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 700 }}>Cancelled</span>
          ) : (
            <span style={{ background: "#E6FAF4", color: "#007A5E", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 700 }}>
              {STATUS_STEPS[currentStepIdx]?.icon} {STATUS_STEPS[currentStepIdx]?.label}
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#6B6B9A", flexWrap: "wrap" }}>
          <span>🏪 {order.pharmacy?.name}</span>
          <span>{isDelivery ? "🚚 Delivery" : "📦 Pickup"}</span>
          <span>💳 {PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod ?? "—"}</span>
          <span>{new Date(order.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Progress tracker (only if not cancelled) */}
      {!isCancelled && (
        <div style={{ background: "#fff", borderRadius: 18, padding: "20px", border: "1px solid #EDE9FF", marginBottom: 16 }}>
          <p style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 700, color: "#180D62", textTransform: "uppercase", letterSpacing: "0.06em" }}>Order Progress</p>
          <div style={{ position: "relative" }}>
            {/* Track line */}
            <div style={{ position: "absolute", left: 15, top: 16, bottom: 16, width: 2, background: "#EDE9FF", zIndex: 0 }} />
            <div style={{ position: "absolute", left: 15, top: 16, width: 2, background: "#00C897", zIndex: 1, transition: "height 0.4s", height: currentStepIdx >= 0 ? `${(currentStepIdx / (STATUS_STEPS.length - 1)) * 100}%` : "0%" }} />

            <div style={{ display: "flex", flexDirection: "column", gap: 20, position: "relative", zIndex: 2 }}>
              {STATUS_STEPS.filter(s => isDelivery || s.key !== "OUT_FOR_DELIVERY").map((step, idx) => {
                const adjustedIdx = isDelivery ? idx : (idx >= 4 ? idx + 1 : idx);
                const done = adjustedIdx <= currentStepIdx;
                const active = adjustedIdx === currentStepIdx;
                return (
                  <div key={step.key} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: done ? (active ? "#00C897" : "#E6FAF4") : "#F3F0FF",
                      border: active ? "2px solid #00C897" : "2px solid transparent",
                      fontSize: 14, boxShadow: active ? "0 0 0 4px rgba(0,200,151,0.15)" : "none",
                      transition: "all 0.3s",
                    }}>
                      {done ? (active ? step.icon : "✓") : "○"}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: active ? 700 : 500, color: active ? "#180D62" : done ? "#374151" : "#9B9BC0" }}>
                        {step.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Order items */}
      <div style={{ background: "#fff", borderRadius: 18, padding: "20px", border: "1px solid #EDE9FF", marginBottom: 16 }}>
        <p style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: "#180D62", textTransform: "uppercase", letterSpacing: "0.06em" }}>Items</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {order.items?.map((item: any) => (
            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 600, color: "#180D62" }}>{item.medicineName}</p>
                <p style={{ margin: 0, fontSize: 12, color: "#9B9BC0" }}>Qty: {item.quantity} × ${Number(item.unitPrice).toFixed(2)}</p>
              </div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#180D62" }}>${Number(item.total).toFixed(2)}</p>
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px solid #EDE9FF", marginTop: 14, paddingTop: 12 }}>
          {Number(order.deliveryFee) > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6B6B9A", marginBottom: 6 }}>
              <span>Delivery fee</span><span>${Number(order.deliveryFee).toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, color: "#180D62" }}>
            <span>Total</span><span>${Number(order.total).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Delivery / pickup info */}
      {isDelivery && order.deliveryAddress && (
        <div style={{ background: "#fff", borderRadius: 18, padding: "20px", border: "1px solid #EDE9FF", marginBottom: 16 }}>
          <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#180D62", textTransform: "uppercase", letterSpacing: "0.06em" }}>Delivery Address</p>
          <p style={{ margin: "0 0 4px", fontSize: 14, color: "#374151" }}>{order.deliveryAddress}</p>
          {order.deliveryCity && <p style={{ margin: 0, fontSize: 13, color: "#6B6B9A" }}>{order.deliveryCity}</p>}
        </div>
      )}

      {/* Pharmacy contact */}
      {order.pharmacy?.phone && (
        <div style={{ background: "#E6FAF4", borderRadius: 18, padding: "16px 20px", border: "1px solid #A7F3D0", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: "#065F46" }}>Contact pharmacy</p>
            <p style={{ margin: 0, fontSize: 13, color: "#047857" }}>{order.pharmacy.name}</p>
          </div>
          <a href={`tel:${order.pharmacy.phone}`} style={{
            background: "#00C897", color: "#fff", borderRadius: 10,
            padding: "9px 16px", fontSize: 13, fontWeight: 700, textDecoration: "none",
          }}>
            📞 Call
          </a>
        </div>
      )}

      {/* Notes */}
      {order.notes && (
        <div style={{ background: "#F7F5FF", borderRadius: 14, padding: "14px 16px", border: "1px solid #EDE9FF", marginBottom: 16 }}>
          <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#6B6B9A", textTransform: "uppercase", letterSpacing: "0.06em" }}>Notes</p>
          <p style={{ margin: 0, fontSize: 14, color: "#374151" }}>{order.notes}</p>
        </div>
      )}

      {/* Cancel */}
      {canCancel && (
        <div style={{ marginTop: 8 }}>
          {cancelError && (
            <p style={{ fontSize: 13, color: "#DC2626", marginBottom: 8, textAlign: "center" }}>{cancelError}</p>
          )}
          <button
            onClick={handleCancel}
            disabled={cancelling}
            style={{
              width: "100%", padding: "13px 0", borderRadius: 14,
              background: "#FEE2E2", border: "none", color: "#DC2626",
              fontSize: 14, fontWeight: 700, cursor: cancelling ? "not-allowed" : "pointer",
              opacity: cancelling ? 0.6 : 1,
            }}
          >
            {cancelling ? "Cancelling…" : "Cancel Order"}
          </button>
        </div>
      )}

      {isCancelled && (
        <Link href="/shop" style={{
          display: "block", textAlign: "center", padding: "13px 0", borderRadius: 14, marginTop: 8,
          background: "linear-gradient(90deg, #00C897, #009E78)",
          color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none",
        }}>
          Browse Medicines
        </Link>
      )}
    </div>
  );
}
