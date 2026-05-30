"use client";

import { formatCurrency } from "@/lib/utils";
import { X, Printer, RotateCcw, WifiOff } from "lucide-react";

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
  MIXED: "Mixed",
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, "") ?? "http://localhost:4001";

function resolveUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_BASE}${url}`;
}

function formatDateTime(d: string | undefined) {
  if (!d) return "";
  return new Date(d).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function ReceiptModal({ receipt, onClose, onNewSale }: Props) {
  const pharmacy = receipt.branch?.pharmacy;
  const branch   = receipt.branch;
  const cashier  = receipt.user
    ? `${receipt.user.firstName} ${receipt.user.lastName}`.trim()
    : undefined;
  const logoUrl  = resolveUrl(pharmacy?.logoUrl);

  // Pharmacy initials fallback
  const initials = pharmacy?.name
    ?.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase() ?? "PH";

  // ── Build receipt HTML for print window ───────────────────────────────────
  const buildPrintHtml = () => {
    const itemRows = (receipt.items ?? []).map((item: any) => `
      <tr>
        <td style="padding:2px 0">${item.medicine?.name ?? "Medicine"}</td>
        <td style="text-align:center;padding:2px 4px">×${item.quantity}</td>
        <td style="text-align:right;padding:2px 0">${formatCurrency(Number(item.total))}</td>
      </tr>`).join("");

    const logoHtml = logoUrl
      ? `<img src="${logoUrl}" style="max-width:64px;max-height:64px;object-fit:contain;margin-bottom:6px;border-radius:8px" />`
      : `<div style="width:64px;height:64px;border-radius:12px;background:linear-gradient(135deg,#180D62,#2D1B8E);display:flex;align-items:center;justify-content:center;margin:0 auto 6px;color:#fff;font-size:22px;font-weight:900;font-family:sans-serif">${initials}</div>`;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Receipt ${receipt.receiptNo}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      width: 80mm;
      padding: 6mm;
      color: #000;
    }
    .center  { text-align: center; }
    .bold    { font-weight: bold; }
    .divider { border-top: 1px dashed #000; margin: 6px 0; }
    .row     { display: flex; justify-content: space-between; padding: 1px 0; }
    table    { width: 100%; border-collapse: collapse; }
    .total-row { font-weight: bold; font-size: 13px; }
    .small   { font-size: 10px; color: #555; }
  </style>
</head>
<body>
  <div class="center">
    ${logoHtml}
    <div class="bold" style="font-size:15px">${pharmacy?.name ?? "DawoLink"}</div>
    ${pharmacy?.city ? `<div class="small">${pharmacy.city}</div>` : ""}
    ${pharmacy?.phone ? `<div class="small">Tel: ${pharmacy.phone}</div>` : ""}
    ${branch && branch.name !== pharmacy?.name ? `<div class="small">Branch: ${branch.name}</div>` : ""}
  </div>

  <div class="divider"></div>

  <div class="row small">
    <span>Receipt: ${receipt.receiptNo ?? "—"}</span>
    <span>${formatDateTime(receipt.createdAt)}</span>
  </div>
  ${cashier ? `<div class="small">Cashier: ${cashier}</div>` : ""}
  <div class="small">Payment: ${PAYMENT_LABELS[receipt.paymentMethod] ?? receipt.paymentMethod}</div>

  <div class="divider"></div>

  <table>
    <thead>
      <tr class="small">
        <th style="text-align:left">Item</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="divider"></div>

  <div class="row"><span>Subtotal</span><span>${formatCurrency(Number(receipt.subtotal))}</span></div>
  ${Number(receipt.discount) > 0 ? `<div class="row"><span>Discount</span><span>-${formatCurrency(Number(receipt.discount))}</span></div>` : ""}
  <div class="row total-row"><span>TOTAL</span><span>${formatCurrency(Number(receipt.total))}</span></div>
  ${Number(receipt.amountPaid) > 0 ? `<div class="row small"><span>Paid</span><span>${formatCurrency(Number(receipt.amountPaid))}</span></div>` : ""}
  ${Number(receipt.change) > 0 ? `<div class="row small"><span>Change</span><span>${formatCurrency(Number(receipt.change))}</span></div>` : ""}

  <div class="divider"></div>
  <div class="center small">Thank you for your purchase!</div>
  <div class="center small" style="margin-top:4px">Powered by DawoLink</div>
</body>
</html>`;
  };

  const handlePrint = () => {
    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) {
      alert("Pop-up blocked. Please allow pop-ups for this site to print receipts.");
      return;
    }
    win.document.write(buildPrintHtml());
    win.document.close();
    // Wait for images (logo) to load before printing
    win.onload = () => {
      win.focus();
      win.print();
      win.close();
    };
    // Fallback if onload doesn't fire (logo already cached)
    setTimeout(() => {
      try { win.print(); win.close(); } catch {}
    }, 600);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Receipt</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Receipt preview — scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4 font-mono text-xs" id="receipt-print">

          {receipt.offline && (
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4 font-sans">
              <WifiOff className="h-3.5 w-3.5 flex-shrink-0" />
              Saved offline — will sync when internet returns
            </div>
          )}

          {/* Pharmacy header */}
          <div className="text-center mb-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="w-14 h-14 object-contain mx-auto mb-2 rounded-xl shadow-sm"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <div
                className="w-14 h-14 rounded-xl mx-auto mb-2 flex items-center justify-center text-white font-black text-xl shadow-sm"
                style={{ background: "linear-gradient(135deg, #180D62, #2D1B8E)" }}
              >
                {initials}
              </div>
            )}
            <p className="font-bold text-sm text-gray-900">{pharmacy?.name ?? "DawoLink"}</p>
            {pharmacy?.city && <p className="text-gray-500 text-xs">{pharmacy.city}</p>}
            {pharmacy?.phone && <p className="text-gray-400 text-xs">Tel: {pharmacy.phone}</p>}
            {branch && branch.name !== pharmacy?.name && (
              <p className="text-gray-400 text-xs">Branch: {branch.name}</p>
            )}
            {!logoUrl && (
              <a
                href="/pharmacy"
                className="inline-block mt-1 text-xs text-indigo-500 hover:text-indigo-700 underline font-sans"
              >
                Upload logo →
              </a>
            )}
          </div>

          <div className="border-t border-dashed border-gray-300 my-2" />

          {/* Meta */}
          <div className="flex justify-between text-gray-500 mb-1">
            <span>#{receipt.receiptNo}</span>
            <span>{formatDateTime(receipt.createdAt)}</span>
          </div>
          {cashier && <p className="text-gray-400 mb-0.5">Cashier: {cashier}</p>}
          <p className="text-gray-400 mb-1">
            Payment: {PAYMENT_LABELS[receipt.paymentMethod] ?? receipt.paymentMethod}
          </p>

          <div className="border-t border-dashed border-gray-300 my-2" />

          {/* Items */}
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400">
                <th className="text-left font-normal pb-1">Item</th>
                <th className="text-center font-normal pb-1 w-8">Qty</th>
                <th className="text-right font-normal pb-1 w-16">Total</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items?.map((item: any) => (
                <tr key={item.id}>
                  <td className="py-0.5 text-gray-800">{item.medicine?.name ?? "Medicine"}</td>
                  <td className="py-0.5 text-center text-gray-500">×{item.quantity}</td>
                  <td className="py-0.5 text-right text-gray-800">{formatCurrency(Number(item.total))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-dashed border-gray-300 my-2" />

          {/* Totals */}
          <div className="space-y-0.5">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(Number(receipt.subtotal))}</span>
            </div>
            {Number(receipt.discount) > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Discount</span>
                <span>-{formatCurrency(Number(receipt.discount))}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 text-sm pt-0.5">
              <span>TOTAL</span>
              <span>{formatCurrency(Number(receipt.total))}</span>
            </div>
            {Number(receipt.amountPaid) > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>Paid</span>
                <span>{formatCurrency(Number(receipt.amountPaid))}</span>
              </div>
            )}
            {Number(receipt.change) > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>Change</span>
                <span>{formatCurrency(Number(receipt.change))}</span>
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-gray-300 my-2" />
          <p className="text-center text-gray-400">Thank you for your purchase!</p>
          <p className="text-center text-gray-300 text-xs mt-0.5">Powered by DawoLink</p>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 flex gap-3 border-t border-gray-100">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
          <button
            onClick={onNewSale}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
          >
            <RotateCcw className="h-4 w-4" />
            New Sale
          </button>
        </div>
      </div>
    </div>
  );
}
