"use client";

import { Package } from "lucide-react";

export function LowStockWidget() {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-brand-purple-100">
      <div className="flex items-center gap-2 mb-3">
        <Package className="h-4 w-4" style={{ color: "#2D1B8E" }} />
        <h3 className="font-semibold text-sm" style={{ color: "#2D1B8E" }}>Low Stock</h3>
      </div>
      <p className="text-xs text-muted-foreground">Select a branch to view low stock items.</p>
    </div>
  );
}
