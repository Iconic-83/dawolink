"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePosStore } from "@/store/pos.store";
import { useAuthStore } from "@/store/auth.store";
import { MedicineSearch } from "@/components/pos/MedicineSearch";
import { CartTable } from "@/components/pos/CartTable";
import { PaymentModal } from "@/components/pos/PaymentModal";
import { ReceiptModal } from "@/components/pos/ReceiptModal";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { ShoppingCart, Trash2, ChevronDown, Tag } from "lucide-react";
import { useCachePrimer } from "@/hooks/useCachePrimer";

export default function PosPage() {
  const user = useAuthStore((s) => s.user);
  const { items, discount, setDiscount, clearCart, subtotal, total } = usePosStore();
  const [showPayment, setShowPayment] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>("");

  const { data: branches = [] } = useQuery<any[]>({
    queryKey: ["branches", user?.pharmacyId],
    queryFn: () => api.get("/v1/pharmacy/branches").then((r) => r.data),
    enabled: !!user,
  });

  // Auto-select first branch when branches load
  useEffect(() => {
    if (branches.length > 0 && !selectedBranch) {
      setSelectedBranch(branches[0].id);
    }
  }, [branches, selectedBranch]);

  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  useCachePrimer(selectedBranch);

  return (
    <div className="flex gap-0 -m-6 h-[calc(100vh-0px)] min-h-0">
      {/* Left — Product search area */}
      <div className="flex-1 flex flex-col bg-gray-50 border-r border-gray-200 overflow-hidden">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-bold text-gray-900 text-lg">Point of Sale</h1>
            <p className="text-xs text-gray-400">Fast checkout — search or scan barcode</p>
          </div>

          {/* Branch selector */}
          <div className="relative">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {branches.map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Search */}
        <div className="px-6 pt-4 pb-3">
          <MedicineSearch branchId={selectedBranch} />
        </div>

        {/* Quick stats */}
        <div className="px-6 py-2 grid grid-cols-3 gap-3">
          {[
            { label: "Items in cart", value: itemCount },
            { label: "Subtotal", value: formatCurrency(subtotal()) },
            { label: "Total", value: formatCurrency(total()) },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 px-4 py-3">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="font-bold text-gray-900 mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Cart table */}
        <div className="flex-1 px-6 overflow-hidden flex flex-col min-h-0 py-2">
          <div className="bg-white rounded-xl border border-gray-100 flex-1 flex flex-col overflow-hidden">
            <CartTable />
          </div>
        </div>

        <div className="px-6 py-3 text-xs text-gray-400 text-center">
          Press Enter after typing a numeric barcode to auto-add
        </div>
      </div>

      {/* Right — Order summary & payment */}
      <div className="w-80 flex flex-col bg-white">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Order Summary</h2>
            {itemCount > 0 && (
              <span className="ml-auto bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {itemCount}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 p-5 space-y-4 overflow-y-auto">
          {/* Items list summary */}
          {items.length > 0 ? (
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.medicineId} className="flex justify-between text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{item.name}</p>
                    <p className="text-gray-400 text-xs">{item.quantity} × {formatCurrency(item.unitPrice)}</p>
                  </div>
                  <span className="font-semibold text-gray-900 ml-2">
                    {formatCurrency(item.unitPrice * item.quantity - item.discount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-4">No items yet</p>
          )}

          {/* Order discount */}
          <div className="pt-3 border-t border-gray-100">
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
              <Tag className="h-3 w-3" />
              Order Discount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                value={discount || ""}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={0}
                step={0.5}
              />
            </div>
          </div>

          {/* Totals */}
          <div className="pt-3 border-t border-gray-100 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal())}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 text-lg pt-1">
              <span>Total</span>
              <span>{formatCurrency(total())}</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-5 space-y-2 border-t border-gray-100">
          <button
            onClick={() => setShowPayment(true)}
            disabled={items.length === 0 || !selectedBranch}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-400 text-white font-bold rounded-xl transition text-lg"
          >
            Charge {items.length > 0 ? formatCurrency(total()) : ""}
          </button>
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="w-full py-2.5 text-sm text-gray-500 hover:text-red-500 flex items-center justify-center gap-1.5 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear cart
            </button>
          )}
        </div>
      </div>

      {/* Payment modal */}
      {showPayment && (
        <PaymentModal
          branchId={selectedBranch}
          onClose={() => setShowPayment(false)}
          onSuccess={(r) => {
            setShowPayment(false);
            setReceipt(r);
          }}
        />
      )}

      {/* Receipt modal */}
      {receipt && (
        <ReceiptModal
          receipt={receipt}
          onClose={() => setReceipt(null)}
          onNewSale={() => setReceipt(null)}
        />
      )}
    </div>
  );
}
