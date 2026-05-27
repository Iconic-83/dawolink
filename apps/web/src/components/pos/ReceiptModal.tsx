"use client";

import { formatCurrency, formatDate } from "@/lib/utils";
import { X, Printer, RotateCcw } from "lucide-react";

interface Props {
  receipt: any;
  onClose: () => void;
  onNewSale: () => void;
}

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Cash",
  EVC_PLUS: "EVC Plus",
  ZAAD: "Zaad",
  SAHAL: "Sahal",
  PREMIER_WALLET: "Premier Wallet",
  CREDIT: "Credit",
};

export function ReceiptModal({ receipt, onClose, onNewSale }: Props) {
  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-semibold text-gray-900">Receipt</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Receipt body */}
        <div className="p-5" id="receipt-print">
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold">DawoLink</h3>
            <p className="text-xs text-gray-500">Pharmacy Management Platform</p>
            <p className="text-xs text-gray-400 mt-1">{formatDate(receipt.createdAt)}</p>
          </div>

          <div className="border-t border-dashed border-gray-200 my-3" />

          <div className="flex justify-between text-xs text-gray-500 mb-3">
            <span>Receipt #{receipt.receiptNo}</span>
            <span>{PAYMENT_LABELS[receipt.paymentMethod] ?? receipt.paymentMethod}</span>
          </div>

          {/* Items */}
          <div className="space-y-2 text-sm">
            {receipt.items?.map((item: any) => (
              <div key={item.id} className="flex justify-between gap-2">
                <div className="flex-1">
                  <span className="font-medium">{item.medicine?.name ?? "Medicine"}</span>
                  <span className="text-gray-500 ml-1">× {item.quantity}</span>
                </div>
                <span>{formatCurrency(Number(item.total))}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-gray-200 my-3" />

          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(Number(receipt.subtotal))}</span>
            </div>
            {Number(receipt.discount) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-{formatCurrency(Number(receipt.discount))}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span>{formatCurrency(Number(receipt.total))}</span>
            </div>
            {Number(receipt.change) > 0 && (
              <div className="flex justify-between text-blue-600">
                <span>Change</span>
                <span>{formatCurrency(Number(receipt.change))}</span>
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-gray-200 my-3" />
          <p className="text-center text-xs text-gray-400">Thank you for your purchase!</p>
        </div>

        <div className="p-5 pt-0 flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
          <button
            onClick={onNewSale}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition"
          >
            <RotateCcw className="h-4 w-4" />
            New Sale
          </button>
        </div>
      </div>
    </div>
  );
}
