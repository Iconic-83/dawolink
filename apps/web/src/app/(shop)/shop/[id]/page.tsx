"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { customerApi, useCustomerAuth } from "@/lib/customer-auth";

const FORM_LABEL: Record<string, string> = {
  TABLET: "Tablet", CAPSULE: "Capsule", SYRUP: "Syrup", INJECTION: "Injection",
  CREAM: "Cream", DROPS: "Drops", INHALER: "Inhaler", POWDER: "Powder",
  SUPPOSITORY: "Suppository", PATCH: "Patch", OTHER: "Other",
};

const AVAIL: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  available:    { label: "Available",    color: "#007A5E", bg: "#E6FAF4", dot: "#00C897" },
  low_stock:    { label: "Low Stock",    color: "#92400E", bg: "#FEF3C7", dot: "#F59E0B" },
  out_of_stock: { label: "Out of Stock", color: "#991B1B", bg: "#FEE2E2", dot: "#EF4444" },
};

const PAYMENT_METHODS = [
  { value: "CASH", label: "💵 Cash on Delivery" },
  { value: "EVC_PLUS", label: "📱 EVC Plus" },
  { value: "ZAAD", label: "📱 Zaad" },
  { value: "SAHAL", label: "📱 Sahal" },
];

const SOMALI_CITIES = [
  "Mogadishu","Hargeisa","Bosaso","Kismayo","Baidoa",
  "Garowe","Beledweyne","Marka","Jilib","Gaalkacyo",
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 13, fontWeight: 700, color: "#180D62", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

interface OrderModalProps {
  medicine: any;
  pharmacy: any;
  onClose: () => void;
  onSuccess: (order: any) => void;
}

function OrderModal({ medicine, pharmacy, onClose, onSuccess }: OrderModalProps) {
  const [qty, setQty] = useState(1);
  const [deliveryType, setDeliveryType] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState(pharmacy.city ?? "");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const price = pharmacy.price ?? 0;
  const deliveryFee = deliveryType === "DELIVERY" ? 2.0 : 0;
  const subtotal = price * qty;
  const total = subtotal + deliveryFee;

  async function submit() {
    if (deliveryType === "DELIVERY" && !address.trim()) {
      setError("Enter your delivery address"); return;
    }
    setError("");
    setLoading(true);
    try {
      const { data } = await customerApi.post("/v1/marketplace/orders", {
        pharmacyId: pharmacy.id,
        branchId: pharmacy.branchId,
        items: [{ medicineName: medicine.name + (medicine.strength ? ` ${medicine.strength}` : ""), quantity: qty, unitPrice: price }],
        deliveryType,
        deliveryAddress: deliveryType === "DELIVERY" ? address.trim() : undefined,
        deliveryCity: deliveryType === "DELIVERY" ? city : undefined,
        paymentMethod,
        notes: notes.trim() || undefined,
      });
      onSuccess(data);
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inp: React.CSSProperties = {
    width: "100%", padding: "11px 13px", borderRadius: 10,
    border: "1.5px solid #E8E4FF", background: "#fff",
    fontSize: 14, color: "#180D62", outline: "none", boxSizing: "border-box",
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(24,13,98,0.55)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "100%", maxWidth: 520, background: "#fff",
        borderRadius: "20px 20px 0 0", padding: "24px 24px 32px",
        maxHeight: "92vh", overflowY: "auto",
      }}>
        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "#E8E4FF", margin: "0 auto 20px" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div>
            <h2 style={{ margin: "0 0 2px", fontSize: 17, fontWeight: 800, color: "#180D62" }}>Place Order</h2>
            <p style={{ margin: 0, fontSize: 13, color: "#6B6B9A" }}>{pharmacy.name}</p>
          </div>
          <button onClick={onClose} style={{ background: "#F3F0FF", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: "#6B6B9A" }}>✕</button>
        </div>

        {/* Medicine summary */}
        <div style={{ background: "#F7F5FF", borderRadius: 12, padding: "12px 14px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 14, color: "#180D62" }}>
              {medicine.name}{medicine.strength ? ` ${medicine.strength}` : ""}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "#9B9BC0" }}>{FORM_LABEL[medicine.form] ?? medicine.form}</p>
          </div>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: "#180D62" }}>${price.toFixed(2)}</p>
        </div>

        {medicine.requiresPrescription && (
          <div style={{ background: "#FEE2E2", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#DC2626", fontWeight: 500 }}>
            ⚕️ This medicine requires a prescription. Please bring it when collecting your order.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Quantity */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Quantity</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                style={{ width: 36, height: 36, borderRadius: 10, border: "1.5px solid #E8E4FF", background: "#fff", fontSize: 18, cursor: "pointer", color: "#180D62", fontWeight: 700 }}
              >−</button>
              <span style={{ fontSize: 18, fontWeight: 800, color: "#180D62", minWidth: 28, textAlign: "center" }}>{qty}</span>
              <button
                onClick={() => setQty(q => Math.min(20, q + 1))}
                style={{ width: 36, height: 36, borderRadius: 10, border: "1.5px solid #E8E4FF", background: "#fff", fontSize: 18, cursor: "pointer", color: "#180D62", fontWeight: 700 }}
              >+</button>
            </div>
          </div>

          {/* Delivery type */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Delivery</label>
            <div style={{ display: "flex", gap: 8 }}>
              {(["DELIVERY", "PICKUP"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setDeliveryType(t)}
                  style={{
                    flex: 1, padding: "11px 0", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer",
                    border: deliveryType === t ? "2px solid #00C897" : "1.5px solid #E8E4FF",
                    background: deliveryType === t ? "#E6FAF4" : "#fff",
                    color: deliveryType === t ? "#007A5E" : "#6B6B9A",
                  }}
                >
                  {t === "DELIVERY" ? "🚚 Delivery" : "🏪 Pickup"}
                </button>
              ))}
            </div>
          </div>

          {/* Delivery address */}
          {deliveryType === "DELIVERY" && (
            <>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Delivery Address *</label>
                <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Street, area, landmark…" style={inp} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>City</label>
                <div style={{ position: "relative" }}>
                  <select value={city} onChange={e => setCity(e.target.value)} style={{ ...inp, appearance: "none" }}>
                    <option value="">Select city…</option>
                    {SOMALI_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#9B9BC0", fontSize: 11 }}>▼</span>
                </div>
              </div>
            </>
          )}

          {/* Payment method */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Payment</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {PAYMENT_METHODS.map(pm => (
                <button
                  key={pm.value}
                  onClick={() => setPaymentMethod(pm.value)}
                  style={{
                    padding: "10px 8px", borderRadius: 12, fontSize: 12, fontWeight: 700,
                    cursor: "pointer", textAlign: "left",
                    border: paymentMethod === pm.value ? "2px solid #00C897" : "1.5px solid #E8E4FF",
                    background: paymentMethod === pm.value ? "#E6FAF4" : "#fff",
                    color: paymentMethod === pm.value ? "#007A5E" : "#6B6B9A",
                  }}
                >
                  {pm.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any special instructions or information for the pharmacy…"
              rows={2}
              style={{ ...inp, resize: "none" }}
            />
          </div>

          {/* Order total */}
          <div style={{ background: "#F7F5FF", borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6B6B9A", marginBottom: 4 }}>
              <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
            </div>
            {deliveryFee > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6B6B9A", marginBottom: 4 }}>
                <span>Delivery fee</span><span>${deliveryFee.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, color: "#180D62", borderTop: "1px solid #E8E4FF", paddingTop: 8, marginTop: 4 }}>
              <span>Total</span><span>${total.toFixed(2)}</span>
            </div>
          </div>

          {error && (
            <div style={{ background: "#FEE2E2", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#DC2626", fontWeight: 500 }}>
              {error}
            </div>
          )}

          <button
            onClick={submit}
            disabled={loading}
            style={{
              width: "100%", padding: "15px 0", borderRadius: 14,
              background: "linear-gradient(90deg, #00C897, #009E78)",
              color: "#fff", border: "none", fontSize: 15, fontWeight: 800,
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Placing order…" : `Confirm Order · $${total.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderSuccess({ order, onClose }: { order: any; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(24,13,98,0.55)", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "36px 28px", maxWidth: 380, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
        <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 800, color: "#180D62" }}>Order Placed!</h2>
        <p style={{ margin: "0 0 4px", fontSize: 14, color: "#6B6B9A" }}>
          Your order <strong style={{ color: "#180D62" }}>{order.orderNo}</strong> has been sent to
        </p>
        <p style={{ margin: "0 0 20px", fontWeight: 700, color: "#180D62" }}>{order.pharmacy?.name}</p>

        <div style={{ background: "#F7F5FF", borderRadius: 12, padding: "12px 16px", marginBottom: 24, fontSize: 13, color: "#6B6B9A", textAlign: "left" }}>
          <p style={{ margin: "0 0 4px" }}>Status: <strong style={{ color: "#F59E0B" }}>Pending confirmation</strong></p>
          <p style={{ margin: "0 0 4px" }}>Total: <strong style={{ color: "#180D62" }}>${Number(order.total).toFixed(2)}</strong></p>
          <p style={{ margin: 0 }}>The pharmacy will contact you shortly.</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Link href="/shop/orders" style={{
            display: "block", padding: "13px 0", borderRadius: 12,
            background: "linear-gradient(90deg, #00C897, #009E78)",
            color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none",
          }}>
            View My Orders
          </Link>
          <button onClick={onClose} style={{
            width: "100%", padding: "13px 0", borderRadius: 12,
            background: "#F3F0FF", border: "none", color: "#6B6B9A",
            fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>
            Continue Browsing
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MedicineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useCustomerAuth();
  const [med, setMed] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [orderTarget, setOrderTarget] = useState<any>(null);
  const [successOrder, setSuccessOrder] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    api.get(`/v1/marketplace/medicines/${id}`)
      .then(r => setMed(r.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  function handleOrderClick(pharmacy: any) {
    if (!user) { router.push("/shop/login"); return; }
    setOrderTarget(pharmacy);
  }

  if (loading) return (
    <div style={{ textAlign: "center", padding: "80px 16px", color: "#9B9BC0" }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #EDE9FF", borderTopColor: "#00C897", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (notFound || !med) return (
    <div style={{ textAlign: "center", padding: "80px 16px" }}>
      <p style={{ fontSize: 48 }}>💊</p>
      <p style={{ fontWeight: 700, color: "#180D62", fontSize: 18 }}>Medicine not found</p>
      <Link href="/shop" style={{ color: "#00C897", fontSize: 14 }}>← Back to search</Link>
    </div>
  );

  const availablePharmacies = med.pharmacies?.filter((p: any) => p.availability !== "out_of_stock") ?? [];
  const overallAvailability = availablePharmacies.length > 0
    ? (availablePharmacies.some((p: any) => p.availability === "available") ? "available" : "low_stock")
    : "out_of_stock";
  const lowestPrice = med.pharmacies?.length ? Math.min(...med.pharmacies.map((p: any) => p.price)) : null;
  const availStyle = AVAIL[overallAvailability];

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 16px 64px" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ padding: "16px 0 8px" }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "#6B6B9A", fontSize: 14, cursor: "pointer", padding: 0 }}>
          ← Back
        </button>
      </div>

      {/* TOP: image + identity + price + availability */}
      <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", border: "1px solid #EDE9FF", marginBottom: 20, boxShadow: "0 4px 16px rgba(24,13,98,0.07)" }}>
        <div style={{ background: "linear-gradient(135deg, #EDE9FF 0%, #F0FDFA 100%)", height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {med.imageUrl ? (
            <img src={med.imageUrl} alt={med.name} style={{ maxHeight: 170, maxWidth: "80%", objectFit: "contain" }} />
          ) : (
            <span style={{ fontSize: 72 }}>💊</span>
          )}
        </div>
        <div style={{ padding: "20px 20px 24px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div>
              <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "#180D62", lineHeight: 1.2 }}>{med.name}</h1>
              {med.strength && <p style={{ margin: 0, fontSize: 15, color: "#6B6B9A", fontWeight: 500 }}>{med.strength}</p>}
              {med.genericName && <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9B9BC0" }}>Generic: {med.genericName}</p>}
            </div>
            <span style={{ background: "#EDE9FF", color: "#2D1B8E", borderRadius: 8, padding: "5px 10px", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>
              {FORM_LABEL[med.form] ?? med.form}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18, flexWrap: "wrap", gap: 12 }}>
            <div>
              {lowestPrice !== null ? (
                <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#180D62" }}>
                  ${lowestPrice.toFixed(2)}
                  {med.pharmacies?.length > 1 && <span style={{ fontSize: 13, fontWeight: 400, color: "#9B9BC0", marginLeft: 4 }}>starting from</span>}
                </p>
              ) : <p style={{ margin: 0, fontSize: 16, color: "#9B9BC0" }}>Price not available</p>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
              <span style={{ background: availStyle.bg, color: availStyle.color, borderRadius: 20, padding: "6px 14px", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: availStyle.dot, display: "inline-block" }} />
                {availStyle.label}
              </span>
              {med.requiresPrescription
                ? <span style={{ background: "#FEE2E2", color: "#DC2626", borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 700 }}>Prescription Required</span>
                : <span style={{ background: "#E6FAF4", color: "#007A5E", borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 600 }}>Over-the-Counter</span>}
            </div>
          </div>
        </div>
      </div>

      {/* MIDDLE: medical info */}
      {med.description && (
        <Section title="About this medicine">
          <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1px solid #EDE9FF" }}>
            <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.7 }}>{med.description}</p>
          </div>
        </Section>
      )}

      <Section title="How to use">
        <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1px solid #EDE9FF" }}>
          <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.7 }}>
            Take as directed by your pharmacist or doctor.
            {med.form === "TABLET" && " Swallow with a full glass of water."}
            {med.form === "SYRUP" && " Shake well before use. Use the measuring cup provided."}
            {med.form === "INJECTION" && " Administered by a healthcare professional only."}
            {med.form === "CREAM" && " Apply a thin layer to the affected area."}
          </p>
        </div>
      </Section>

      {(med.contraindications || true) && (
        <Section title="Warnings">
          <div style={{ background: "#FFF9EC", border: "1px solid #FDE68A", borderRadius: 12, padding: "14px 16px", display: "flex", gap: 10 }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
            <span style={{ fontSize: 14, color: "#78350F", lineHeight: 1.6 }}>
              {med.contraindications ?? "Do not use without consulting a pharmacist or doctor if you are pregnant, breastfeeding, or taking other medications."}
            </span>
          </div>
        </Section>
      )}

      {med.sideEffects && (
        <Section title="Possible side effects">
          <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1px solid #EDE9FF" }}>
            <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.7 }}>{med.sideEffects}</p>
          </div>
        </Section>
      )}

      {med.storageConditions && (
        <Section title="Storage">
          <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1px solid #EDE9FF" }}>
            <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.7 }}>{med.storageConditions}</p>
          </div>
        </Section>
      )}

      <div style={{ background: "#F0F9FF", border: "1px solid #BAE6FD", borderRadius: 12, padding: "14px 16px", marginBottom: 28, display: "flex", gap: 10 }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>ℹ️</span>
        <p style={{ margin: 0, fontSize: 13, color: "#0369A1", lineHeight: 1.6 }}>
          <strong>Important:</strong> Always consult a licensed pharmacist or doctor before using any medicine. This information is for general guidance only.
        </p>
      </div>

      {/* BOTTOM: pharmacy list with Order buttons */}
      <Section title={`Available at ${med.pharmacies?.length ?? 0} ${med.pharmacies?.length === 1 ? "pharmacy" : "pharmacies"}`}>
        {!med.pharmacies?.length ? (
          <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1px solid #EDE9FF" }}>
            <p style={{ margin: 0, color: "#9B9BC0", fontSize: 14 }}>Currently not available at any nearby pharmacy.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {med.pharmacies.map((p: any) => {
              const a = AVAIL[p.availability] ?? AVAIL.out_of_stock;
              const canOrder = p.availability !== "out_of_stock";
              return (
                <div key={p.id} style={{ background: "#fff", borderRadius: 14, padding: "14px 16px", border: "1px solid #EDE9FF", opacity: canOrder ? 1 : 0.55 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 14, color: "#180D62" }}>{p.name}</p>
                      <p style={{ margin: 0, fontSize: 12, color: "#9B9BC0" }}>{p.branchName} · {p.city}</p>
                      {p.branchAddress && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9B9BC0" }}>{p.branchAddress}</p>}
                      {p.phone && (
                        <p style={{ margin: "4px 0 0", fontSize: 12 }}>
                          <a href={`tel:${p.phone}`} style={{ color: "#00C897", textDecoration: "none" }}>📞 {p.phone}</a>
                        </p>
                      )}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 800, color: "#180D62" }}>${p.price.toFixed(2)}</p>
                      <span style={{ background: a.bg, color: a.color, borderRadius: 20, padding: "3px 9px", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: a.dot, display: "inline-block" }} />
                        {a.label}
                      </span>
                    </div>
                  </div>

                  {canOrder && (
                    <button
                      onClick={() => handleOrderClick(p)}
                      style={{
                        width: "100%", marginTop: 12, padding: "11px 0", borderRadius: 12,
                        background: "linear-gradient(90deg, #00C897, #009E78)",
                        color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer",
                      }}
                    >
                      {authLoading ? "…" : user ? "Order from this pharmacy" : "Sign in to order"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Section>

      <Section title="Generic Alternatives">
        <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1px solid #EDE9FF" }}>
          <p style={{ margin: 0, fontSize: 14, color: "#6B6B9A" }}>
            Ask your pharmacist about lower-cost generic alternatives that contain the same active ingredient.
          </p>
        </div>
      </Section>

      {/* Order modal */}
      {orderTarget && !successOrder && (
        <OrderModal
          medicine={med}
          pharmacy={orderTarget}
          onClose={() => setOrderTarget(null)}
          onSuccess={order => { setOrderTarget(null); setSuccessOrder(order); }}
        />
      )}

      {/* Success overlay */}
      {successOrder && (
        <OrderSuccess order={successOrder} onClose={() => setSuccessOrder(null)} />
      )}
    </div>
  );
}
