"use client";

import { usePosStore } from "@/store/pos.store";
import { formatCurrency } from "@/lib/utils";
import { Trash2, Minus, Plus, AlertTriangle } from "lucide-react";

export function CartTable() {
  const { items, updateQty, updateDiscount, updatePrice, removeItem } = usePosStore();

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-16">
        <div className="text-5xl mb-3">🛒</div>
        <p className="font-medium">Cart is empty</p>
        <p className="text-sm mt-1">Search a medicine or scan a barcode to start</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-gray-50 border-b border-gray-100">
          <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <th className="px-3 py-2.5">Medicine</th>
            <th className="px-3 py-2.5 text-center w-28">Qty</th>
            <th className="px-3 py-2.5 text-right w-28">Price</th>
            <th className="px-3 py-2.5 text-right w-24">Disc.</th>
            <th className="px-3 py-2.5 text-right w-24">Total</th>
            <th className="px-3 py-2.5 w-8" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {items.map((item) => {
            const lineTotal = item.unitPrice * item.quantity - item.discount;
            const noPrice = item.unitPrice === 0;
            const noStock = item.stock === 0;

            return (
              <tr
                key={item.medicineId}
                className={`transition-colors ${noPrice ? "bg-amber-50/50" : "hover:bg-indigo-50/30"}`}
              >
                {/* Medicine name */}
                <td className="px-3 py-3">
                  <div className="flex items-start gap-1.5">
                    {(noPrice || noStock) && (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      {item.batchNo && (
                        <p className="text-xs text-gray-400">Batch: {item.batchNo}</p>
                      )}
                      <p className={`text-xs ${noStock ? "text-amber-600 font-semibold" : "text-gray-400"}`}>
                        {noStock ? "⚠ No stock recorded" : `${item.stock} in stock`}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Quantity */}
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1 justify-center">
                    <button
                      onClick={() => updateQty(item.medicineId, item.quantity - 1)}
                      className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={e => updateQty(item.medicineId, parseInt(e.target.value) || 1)}
                      className="w-10 text-center text-sm font-medium border border-gray-200 rounded-md py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      min={1}
                    />
                    <button
                      onClick={() => updateQty(item.medicineId, item.quantity + 1)}
                      disabled={item.stock > 0 && item.quantity >= item.stock}
                      className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-40 flex items-center justify-center transition"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </td>

                {/* Unit price — editable if zero */}
                <td className="px-3 py-3 text-right">
                  {noPrice ? (
                    <input
                      type="number"
                      value={item.unitPrice || ""}
                      onChange={e => updatePrice(item.medicineId, parseFloat(e.target.value) || 0)}
                      placeholder="Enter price"
                      className="w-24 text-right text-sm border border-amber-300 rounded-md py-0.5 px-2 focus:outline-none focus:ring-1 focus:ring-amber-400 bg-amber-50"
                      min={0}
                      step={0.25}
                      autoFocus
                    />
                  ) : (
                    <span className="text-gray-700 font-medium">{formatCurrency(item.unitPrice)}</span>
                  )}
                </td>

                {/* Discount */}
                <td className="px-3 py-3">
                  <input
                    type="number"
                    value={item.discount || ""}
                    onChange={e => updateDiscount(item.medicineId, parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-20 text-right text-sm border border-gray-200 rounded-md py-0.5 px-2 focus:outline-none focus:ring-1 focus:ring-indigo-400 ml-auto block"
                    min={0}
                    step={0.5}
                  />
                </td>

                {/* Line total */}
                <td className="px-3 py-3 text-right font-semibold text-gray-900">
                  {formatCurrency(Math.max(0, lineTotal))}
                </td>

                {/* Remove */}
                <td className="px-3 py-3">
                  <button
                    onClick={() => removeItem(item.medicineId)}
                    className="text-gray-300 hover:text-red-500 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
