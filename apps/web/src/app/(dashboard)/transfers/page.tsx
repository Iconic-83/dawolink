"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageSpinner } from "@/components/ui/Spinner";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { ArrowLeftRight, Plus, X, Trash2 } from "lucide-react";

// ── Create Transfer Modal ──────────────────────────────────────────────────

function CreateTransferModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const user = useAuthStore(s => s.user);

  const { data: branches = [] } = useQuery<any[]>({
    queryKey: ["branches"],
    queryFn: () => api.get("/v1/pharmacy/branches").then(r => r.data),
  });

  const [fromBranchId, setFromBranchId] = useState("");
  const [toBranchId, setToBranchId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<{ medicineId: string; name: string; quantity: number }[]>([]);
  const [saving, setSaving] = useState(false);

  // Load medicines for the source branch
  const { data: stockData } = useQuery<any>({
    queryKey: ["stock", fromBranchId],
    queryFn: () => api.get(`/v1/inventory/branches/${fromBranchId}/items?limit=200`).then(r => r.data),
    enabled: !!fromBranchId,
  });
  const stockItems: any[] = stockData?.items ?? [];

  function addItem() {
    setItems(prev => [...prev, { medicineId: "", name: "", quantity: 1 }]);
  }

  function removeItem(i: number) {
    setItems(prev => prev.filter((_, idx) => idx !== i));
  }

  function updateItem(i: number, medicineId: string) {
    const stock = stockItems.find(s => s.medicine?.id === medicineId);
    setItems(prev => prev.map((item, idx) =>
      idx === i
        ? { medicineId, name: stock?.medicine?.name ?? "", quantity: 1 }
        : item,
    ));
  }

  function updateQty(i: number, qty: number) {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, quantity: qty } : item));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fromBranchId || !toBranchId) { toast.error("Select both branches"); return; }
    if (fromBranchId === toBranchId) { toast.error("Source and destination must differ"); return; }
    if (items.length === 0) { toast.error("Add at least one item"); return; }
    if (items.some(i => !i.medicineId || i.quantity < 1)) { toast.error("All items need a medicine and quantity"); return; }

    setSaving(true);
    try {
      await api.post("/v1/transfers", {
        fromBranchId,
        toBranchId,
        notes: notes || undefined,
        items: items.map(i => ({ medicineId: i.medicineId, quantity: i.quantity })),
      });
      qc.invalidateQueries({ queryKey: ["transfers"] });
      qc.invalidateQueries({ queryKey: ["stock"] });
      toast.success("Stock transferred successfully");
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Transfer failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-semibold text-gray-900">New Stock Transfer</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Branches */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">From Branch</label>
              <select
                value={fromBranchId}
                onChange={e => { setFromBranchId(e.target.value); setItems([]); }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select…</option>
                {branches.map((b: any) => (
                  <option key={b.id} value={b.id} disabled={b.id === toBranchId}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">To Branch</label>
              <select
                value={toBranchId}
                onChange={e => setToBranchId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select…</option>
                {branches.map((b: any) => (
                  <option key={b.id} value={b.id} disabled={b.id === fromBranchId}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-600">Medicines to Transfer</label>
              <button
                type="button"
                onClick={addItem}
                disabled={!fromBranchId}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-40"
              >
                + Add Item
              </button>
            </div>
            {items.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-lg">
                {fromBranchId ? "Click \"+ Add Item\" to select medicines" : "Select source branch first"}
              </p>
            ) : (
              <div className="space-y-2">
                {items.map((item, i) => {
                  const selected = stockItems.find(s => s.medicine?.id === item.medicineId);
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <select
                        value={item.medicineId}
                        onChange={e => updateItem(i, e.target.value)}
                        className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select medicine…</option>
                        {stockItems
                          .filter(s => s.quantity > 0)
                          .map((s: any) => (
                            <option
                              key={s.medicine?.id}
                              value={s.medicine?.id}
                              disabled={items.some((it, j) => j !== i && it.medicineId === s.medicine?.id)}
                            >
                              {s.medicine?.name} (stock: {s.quantity})
                            </option>
                          ))}
                      </select>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={e => updateQty(i, parseInt(e.target.value) || 1)}
                        min={1}
                        max={selected?.quantity ?? 9999}
                        className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button type="button" onClick={() => removeItem(i)} className="text-gray-300 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Notes (optional)</label>
            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Reason for transfer…"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </form>

        <div className="p-5 pt-0 border-t">
          <button
            onClick={handleSubmit as any}
            disabled={saving}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-400 text-white font-semibold rounded-xl transition text-sm"
          >
            {saving ? "Transferring…" : "Confirm Transfer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function TransfersPage() {
  const [showCreate, setShowCreate] = useState(false);

  const { data: transfers = [], isLoading } = useQuery<any[]>({
    queryKey: ["transfers"],
    queryFn: () => api.get("/v1/transfers").then(r => r.data),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Transfers</h1>
          <p className="text-sm text-gray-500 mt-0.5">Move inventory between branches</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition"
        >
          <Plus className="h-4 w-4" />
          New Transfer
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? <PageSpinner /> : transfers.length === 0 ? (
          <EmptyState icon="↔️" title="No stock transfers yet" sub="Transfer stock between your branches to balance inventory" />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">Transfer #</th>
                <th className="px-4 py-3">From</th>
                <th className="px-4 py-3">To</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transfers.map((t: any) => (
                <tr key={t.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-semibold text-gray-700">{t.transferNo}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-800">{t.fromBranch?.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <ArrowLeftRight className="h-3 w-3 text-gray-400" />
                      <span className="font-medium text-gray-800">{t.toBranch?.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      {t.items?.slice(0, 2).map((item: any, i: number) => (
                        <p key={i} className="text-xs text-gray-600">{item.medicineName} × {item.quantity}</p>
                      ))}
                      {t.items?.length > 2 && (
                        <p className="text-xs text-gray-400">+{t.items.length - 2} more</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={t.status === "COMPLETED" ? "success" : t.status === "PENDING" ? "warning" : "danger"}>
                      {t.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {formatDate(t.requestedAt)}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 max-w-[120px] truncate">
                    {t.notes ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && <CreateTransferModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
