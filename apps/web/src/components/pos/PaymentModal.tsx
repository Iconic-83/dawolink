"use client";

import { useState } from "react";
import { usePosStore } from "@/store/pos.store";
import { formatCurrency } from "@/lib/utils";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";

const PAYMENT_METHODS = [
  { id: "CASH", label: "Cash", icon: "💵" },
  { id: "EVC_PLUS", label: "EVC Plus", icon: "📱" },
  { id: "ZAAD", label: "Zaad", icon: "💚" },
  { id: "SAHAL", label: "Sahal", icon: "🔵" },
  { id: "PREMIER_WALLET", label: "Premier", icon: "🟣" },
  { id: "CREDIT", label: "Credit", icon: "📋" },
];

interface Props {
  branchId: string;
  onClose: () => void;
  onSuccess: (receipt: any) => void;
}

export function PaymentModal({ branchId, onClose, onSuccess }: Props) {
  const { items, discount, paymentMethod, setPaymentMethod, subtotal, total, clearCart } = usePosStore();
  const user = useAuthStore((s) => s.user);
  const [amountPaid, setAmountPaid] = useState("");
  const [loading, setLoading] = useState(false);

  const totalAmount = total();
  const paid = parseFloat(amountPaid) || 0;
  const change = Math.max(0, paid - totalAmount);

  const handleCharge = async () => {
    if (paymentMethod === "CASH" && paid < totalAmount) {
      toast.error("Amount paid is less than total");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        type: "SALE",
        paymentMethod,
        items: items.map((i) => ({
          medicineId: i.medicineId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discount: i.discount,
          batchNo: i.batchNo,
        })),
        discount,
        amountPaid: paymentMethod === "CASH" ? paid : totalAmount,
      };

      const res = await api.post(`/v1/pos/branches/${branchId}/transactions`, payload);
      clearCart();
      onSuccess(res.data);
      toast.success(`Sale complete — Receipt ${res.data.receiptNo}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">Complete Payment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Order summary */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal ({items.length} items)</span>
              <span>{formatCurrency(subtotal())}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-200">
              <span>Total</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          {/* Payment method */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Payment Method</p>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id)}
                  className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-xs font-medium transition ${
                    paymentMethod === m.id
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <span className="text-xl">{m.icon}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount paid (cash only) */}
          {paymentMethod === "CASH" && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Amount Received
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder={totalAmount.toFixed(2)}
                  className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                  min={0}
                  step={0.5}
                />
              </div>
              {paid >= totalAmount && (
                <div className="flex justify-between text-sm mt-2 text-green-600 font-medium">
                  <span>Change</span>
                  <span>{formatCurrency(change)}</span>
                </div>
              )}
            </div>
          )}

          {/* Quick amounts */}
          {paymentMethod === "CASH" && (
            <div className="flex gap-2 flex-wrap">
              {[Math.ceil(totalAmount), Math.ceil(totalAmount / 5) * 5 + 5, Math.ceil(totalAmount / 10) * 10].map((v) => (
                <button
                  key={v}
                  onClick={() => setAmountPaid(v.toString())}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
                >
                  {formatCurrency(v)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Charge button */}
        <div className="p-5 pt-0">
          <button
            onClick={handleCharge}
            disabled={loading || (paymentMethod === "CASH" && paid < totalAmount)}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold text-lg rounded-xl transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Processing…</>
            ) : (
              <><CheckCircle2 className="h-5 w-5" /> Charge {formatCurrency(totalAmount)}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
