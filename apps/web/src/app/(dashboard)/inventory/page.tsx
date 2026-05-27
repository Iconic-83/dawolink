"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { AddMedicineModal } from "@/components/inventory/AddMedicineModal";
import { AddStockModal } from "@/components/inventory/AddStockModal";
import { AdjustStockModal } from "@/components/inventory/AdjustStockModal";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageSpinner } from "@/components/ui/Spinner";
import { formatCurrency } from "@/lib/utils";
import {
  Plus, Search, Package, Layers, SlidersHorizontal,
  Barcode, ChevronDown, Edit2, PlusCircle,
} from "lucide-react";

type Tab = "catalog" | "stock";

const FORM_COLORS: Record<string, string> = {
  TABLET: "info", CAPSULE: "info", SYRUP: "success", INJECTION: "danger",
  CREAM: "warning", DROPS: "muted", INHALER: "warning", OTHER: "default",
};

export default function InventoryPage() {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<Tab>("catalog");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [showAddMed, setShowAddMed] = useState(false);
  const [showAddStock, setShowAddStock] = useState(false);
  const [adjustItem, setAdjustItem] = useState<any>(null);
  const [prefillMedId, setPrefillMedId] = useState<string | undefined>();

  const { data: medicines = [], isLoading: loadingMeds } = useQuery<any[]>({
    queryKey: ["medicines", search],
    queryFn: () => api.get(`/v1/medicines?search=${encodeURIComponent(search)}`).then(r => r.data),
  });

  const { data: branches = [] } = useQuery<any[]>({
    queryKey: ["branches"],
    queryFn: () => api.get("/v1/pharmacy/branches").then(r => r.data),
  });

  const { data: stockItems = [], isLoading: loadingStock } = useQuery<any[]>({
    queryKey: ["stock", selectedBranch],
    queryFn: () => api.get(`/v1/inventory/branches/${selectedBranch}/items`).then(r => r.data),
    enabled: !!selectedBranch,
  });

  const { data: stockValue } = useQuery<any>({
    queryKey: ["stock-value", selectedBranch],
    queryFn: () => api.get(`/v1/inventory/branches/${selectedBranch}/value`).then(r => r.data),
    enabled: !!selectedBranch,
  });

  const categories = Array.from(new Set(medicines.map((m: any) => m.category as string))).sort();
  const filteredMeds = medicines.filter((m: any) =>
    (!categoryFilter || m.category === categoryFilter)
  );

  const filteredStock = stockItems.filter((item: any) =>
    !search || item.medicine?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = stockItems.filter((i: any) => i.quantity <= i.reorderLevel).length;
  const outOfStockCount = stockItems.filter((i: any) => i.quantity === 0).length;

  function stockBadge(qty: number, reorder: number) {
    if (qty === 0) return <Badge variant="danger">Out of stock</Badge>;
    if (qty <= reorder) return <Badge variant="warning">Low stock</Badge>;
    return <Badge variant="success">In stock</Badge>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500 mt-0.5">Medicine catalog & stock management</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setPrefillMedId(undefined); setShowAddStock(true); }} className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition">
            <Layers className="h-4 w-4" />
            Add Stock
          </button>
          <button onClick={() => setShowAddMed(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition">
            <Plus className="h-4 w-4" />
            Add Medicine
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Medicines", value: medicines.length, icon: "💊" },
          { label: "Stock Items", value: stockItems.length, icon: "📦" },
          { label: "Low Stock", value: lowStockCount, icon: "⚠️" },
          { label: "Stock Value", value: formatCurrency(stockValue?.totalValue ?? 0), icon: "💰" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">{s.icon}</span>
            <div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="font-bold text-gray-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center gap-0 border-b border-gray-100 px-1 pt-1">
          {(["catalog", "stock"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-medium rounded-t-lg transition capitalize ${
                tab === t ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {t === "catalog" ? "Medicine Catalog" : "Stock Items"}
            </button>
          ))}

          {/* Filters */}
          <div className="ml-auto flex items-center gap-2 px-4 py-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search…"
                className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
              />
            </div>

            {tab === "catalog" && (
              <div className="relative">
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="appearance-none pl-3 pr-8 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">All categories</option>
                  {categories.map((c: any) => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              </div>
            )}

            {tab === "stock" && (
              <div className="relative">
                <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} className="appearance-none pl-3 pr-8 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              </div>
            )}
          </div>
        </div>

        {/* ── CATALOG TAB ── */}
        {tab === "catalog" && (
          <>
            {loadingMeds ? <PageSpinner /> : filteredMeds.length === 0 ? (
              <EmptyState icon="💊" title="No medicines found" sub="Add your first medicine to the catalog" />
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="px-4 py-3">Medicine</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Form</th>
                    <th className="px-4 py-3">Barcode</th>
                    <th className="px-4 py-3">Rx</th>
                    <th className="px-4 py-3 w-24" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredMeds.map((med: any) => (
                    <tr key={med.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <Package className="h-4 w-4 text-blue-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{med.name}</p>
                            {med.genericName && <p className="text-xs text-gray-400">{med.genericName}</p>}
                            {med.strength && <p className="text-xs text-gray-400">{med.strength}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="default">{med.category}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={(FORM_COLORS[med.form] ?? "default") as any}>{med.form}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {med.barcode ? (
                          <span className="flex items-center gap-1 text-gray-500 font-mono text-xs">
                            <Barcode className="h-3 w-3" />{med.barcode}
                          </span>
                        ) : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {med.requiresPrescription
                          ? <Badge variant="danger">Rx</Badge>
                          : <Badge variant="muted">OTC</Badge>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => { setPrefillMedId(med.id); setShowAddStock(true); }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Add stock"
                          >
                            <PlusCircle className="h-4 w-4" />
                          </button>
                          <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition" title="Edit">
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {/* ── STOCK TAB ── */}
        {tab === "stock" && (
          <>
            {loadingStock ? <PageSpinner /> : filteredStock.length === 0 ? (
              <EmptyState icon="📦" title="No stock items" sub="Add stock for this branch" />
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="px-4 py-3">Medicine</th>
                    <th className="px-4 py-3 text-center">Qty</th>
                    <th className="px-4 py-3 text-center">Reorder</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Cost</th>
                    <th className="px-4 py-3">Selling</th>
                    <th className="px-4 py-3">Expiry</th>
                    <th className="px-4 py-3">Batch</th>
                    <th className="px-4 py-3 w-16" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredStock.map((item: any) => {
                    const expiring = item.expiryDate && new Date(item.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                    return (
                      <tr key={item.id} className={`hover:bg-gray-50/60 transition-colors ${item.quantity === 0 ? "opacity-60" : ""}`}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{item.medicine?.name}</p>
                          <p className="text-xs text-gray-400">{item.medicine?.category}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-bold text-lg ${item.quantity === 0 ? "text-red-500" : item.quantity <= item.reorderLevel ? "text-orange-500" : "text-gray-900"}`}>
                            {item.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-500">{item.reorderLevel}</td>
                        <td className="px-4 py-3">{stockBadge(item.quantity, item.reorderLevel)}</td>
                        <td className="px-4 py-3 text-gray-600">{formatCurrency(Number(item.costPrice))}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(Number(item.sellingPrice))}</td>
                        <td className="px-4 py-3">
                          {item.expiryDate ? (
                            <span className={`text-xs font-medium ${expiring ? "text-red-600" : "text-gray-600"}`}>
                              {new Date(item.expiryDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                              {expiring && " ⚠️"}
                            </span>
                          ) : <span className="text-gray-300 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 font-mono">{item.batchNo ?? "—"}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setAdjustItem({ id: item.id, medicineName: item.medicine?.name, quantity: item.quantity, branchId: selectedBranch })}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Adjust stock"
                          >
                            <SlidersHorizontal className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>

      <AddMedicineModal open={showAddMed} onClose={() => setShowAddMed(false)} />
      <AddStockModal open={showAddStock} onClose={() => setShowAddStock(false)} prefillMedicineId={prefillMedId} />
      <AdjustStockModal open={!!adjustItem} onClose={() => setAdjustItem(null)} item={adjustItem} />
    </div>
  );
}
