"use client";

export function LowStockWidget() {
  return (
    <div className="bg-white border rounded-xl p-4">
      <h3 className="font-semibold text-sm mb-3">Low Stock</h3>
      <p className="text-xs text-muted-foreground">Select a branch to view low stock items.</p>
    </div>
  );
}
