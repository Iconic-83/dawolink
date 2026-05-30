"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supplierApi, clearSupplierToken, getSupplierToken } from "@/lib/supplier-auth";

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:            { label: "Pending — Awaiting Your Response", color: "#D97706", bg: "#FEF3C7" },
  CONFIRMED:          { label: "Confirmed",                        color: "#2563EB", bg: "#DBEAFE" },
  PARTIALLY_RECEIVED: { label: "Partially Received",              color: "#7C3AED", bg: "#EDE9FE" },
  RECEIVED:           { label: "Received",                        color: "#059669", bg: "#D1FAE5" },
  CANCELLED:          { label: "Cancelled",                       color: "#DC2626", bg: "#FEE2E2" },
};

export default function SupplierOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [acting, setActing] = useState<"confirm" | "reject" | "">("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getSupplierToken()) { router.push("/supplier/login"); return; }
    supplierApi.get(`/v1/supplier-portal/orders/${id}`)
      .then(r => { setOrder(r.data); setLoading(false); })
      .catch(() => { clearSupplierToken(); router.push("/supplier/login"); });
  }, [id]);

  async function handleConfirm() {
    setActing("confirm"); setError("");
    try {
      const { data } = await supplierApi.patch(`/v1/supplier-portal/orders/${id}/confirm`, { note: note || undefined });
      setOrder(data);
    } catch (e: any) { setError(e.response?.data?.message ?? "Failed"); }
    finally { setActing(""); }
  }

  async function handleReject() {
    if (!note.trim()) { setError("Please provide a reason for rejection"); return; }
    setActing("reject"); setError("");
    try {
      const { data } = await supplierApi.patch(`/v1/supplier-portal/orders/${id}/reject`, { note });
      setOrder(data);
    } catch (e: any) { setError(e.response?.data?.message ?? "Failed"); }
    finally { setActing(""); }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 rounded-full border-2 border-transparent border-t-emerald-500 animate-spin" />
    </div>
  );
  if (!order) return null;

  const meta = STATUS_META[order.status] ?? STATUS_META.PENDING;
  const isPending = order.status === "PENDING";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <Link href="/supplier/dashboard" className="text-sm text-gray-500 hover:text-gray-800">← Back to Orders</Link>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
        {/* Status */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-bold text-gray-900 text-lg">#{order.orderNo}</p>
              <p className="text-xs text-gray-400 mt-0.5">{new Date(order.orderedAt).toLocaleDateString()}</p>
            </div>
            <span className="px-3 py-1.5 rounded-full text-sm font-semibold"
              style={{ background: meta.bg, color: meta.color }}>{meta.label}</span>
          </div>

          {order.notes && (
            <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600 mb-4">
              <p className="text-xs font-semibold text-gray-400 mb-1">Pharmacy Note</p>
              {order.notes}
            </div>
          )}

          {order.supplierNote && (
            <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-700 mb-4">
              <p className="text-xs font-semibold text-blue-400 mb-1">Your Note</p>
              {order.supplierNote}
            </div>
          )}

          {order.expectedDeliveryDate && (
            <p className="text-sm text-gray-500">
              Expected delivery: <strong>{new Date(order.expectedDeliveryDate).toLocaleDateString()}</strong>
            </p>
          )}
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="font-semibold text-gray-900 mb-4">Order Items</p>
          <div className="space-y-3">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.medicineName}</p>
                  <p className="text-xs text-gray-400">Qty: {item.quantity} · Unit: ${Number(item.unitCost).toFixed(2)}</p>
                </div>
                <p className="font-semibold text-gray-900">${(item.quantity * Number(item.unitCost)).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between">
            <span className="font-bold text-gray-900">Total</span>
            <span className="font-black text-gray-900 text-lg">${Number(order.totalAmount).toFixed(2)}</span>
          </div>
        </div>

        {/* Action panel */}
        {isPending && (
          <div className="bg-white rounded-2xl border border-amber-200 p-5 space-y-4">
            <p className="font-semibold text-amber-800">Respond to this order</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Note (optional for confirm, required for reject)</label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
                placeholder="Add a note for the pharmacy…"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={!!acting}
                className="flex-1 py-3 rounded-xl text-sm font-bold border-2 border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-50"
              >
                {acting === "reject" ? "Rejecting…" : "Reject Order"}
              </button>
              <button
                onClick={handleConfirm}
                disabled={!!acting}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                style={{ background: "linear-gradient(90deg,#00C897,#009E78)" }}
              >
                {acting === "confirm" ? "Confirming…" : "Confirm Order"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
