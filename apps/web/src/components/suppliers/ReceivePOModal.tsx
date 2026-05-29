"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import {
  Loader2, Package, ChevronDown, Search, Plus, CheckCircle2, Clock, X,
} from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  order: any;
}

const MEDICINE_FORMS = [
  "TABLET","CAPSULE","SYRUP","INJECTION","CREAM","DROPS",
  "INHALER","POWDER","SUPPOSITORY","PATCH","OTHER",
];

const CATEGORIES = [
  "Analgesics","Antibiotics","Antivirals","Antifungals","Antihistamines",
  "Antacids","Vitamins & Supplements","Cardiovascular","Diabetes","Respiratory",
  "Dermatology","Eye & Ear","Herbal","OTC","Other",
];

type ItemMode = "search" | "found" | "new";

interface ItemState {
  mode: ItemMode;
  search: string;
  medicineId: string;
  medicineName: string;
  receivedQty: number;
  costPrice: number;
  sellingPrice: number;
  batchNo: string;
  expiryDate: string;
  // inline new medicine fields
  newName: string;
  newCategory: string;
  newForm: string;
  newGenericName: string;
  newStrength: string;
  newUnit: string;
  newRequiresPrescription: boolean;
}

export function ReceivePOModal({ open, onClose, order }: Props) {
  const qc = useQueryClient();

  const { data: branches = [] } = useQuery<any[]>({
    queryKey: ["branches"],
    queryFn: () => api.get("/v1/pharmacy/branches").then(r => r.data),
  });

  const { data: medicines = [] } = useQuery<any[]>({
    queryKey: ["medicines"],
    queryFn: () => api.get("/v1/medicines").then(r => r.data),
  });

  const [branchId, setBranchId] = useState("");

  const [items, setItems] = useState<Record<string, ItemState>>(() => {
    const init: Record<string, ItemState> = {};
    order?.items?.forEach((item: any) => {
      init[item.id] = {
        mode: "search",
        search: "",
        medicineId: "",
        medicineName: "",
        receivedQty: item.quantity,
        costPrice: Number(item.unitCost),
        sellingPrice: 0,
        batchNo: "",
        expiryDate: "",
        newName: item.medicineName ?? "",
        newCategory: "",
        newForm: "TABLET",
        newGenericName: "",
        newStrength: "",
        newUnit: "pcs",
        newRequiresPrescription: false,
      };
    });
    return init;
  });

  const set = (itemId: string, patch: Partial<ItemState>) =>
    setItems(prev => ({ ...prev, [itemId]: { ...prev[itemId], ...patch } }));

  const searchResults = useMemo(() => {
    const result: Record<string, any[]> = {};
    order?.items?.forEach((item: any) => {
      const q = items[item.id]?.search.toLowerCase().trim();
      if (!q) { result[item.id] = []; return; }
      result[item.id] = medicines
        .filter((m: any) =>
          m.name.toLowerCase().includes(q) ||
          (m.genericName ?? "").toLowerCase().includes(q) ||
          (m.barcode ?? "").includes(q)
        )
        .slice(0, 6);
    });
    return result;
  }, [items, medicines, order?.items]);

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      const payload = {
        branchId,
        items: order.items.map((item: any) => {
          const s = items[item.id];
          const base = {
            poItemId: item.id,
            receivedQty: Number(s.receivedQty),
            costPrice: Number(s.costPrice),
            sellingPrice: Number(s.sellingPrice),
            batchNo: s.batchNo || undefined,
            expiryDate: s.expiryDate || undefined,
          };
          if (s.mode === "new") {
            return {
              ...base,
              newMedicine: {
                name: s.newName,
                category: s.newCategory,
                form: s.newForm,
                genericName: s.newGenericName || undefined,
                strength: s.newStrength || undefined,
                unit: s.newUnit || "pcs",
                requiresPrescription: s.newRequiresPrescription,
              },
            };
          }
          return { ...base, medicineId: s.medicineId };
        }),
      };
      return api.post(`/v1/suppliers/purchase-orders/${order.id}/receive`, payload).then(r => r.data);
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
      qc.invalidateQueries({ queryKey: ["stock"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["medicines"] });
      const msg = data.fullyReceived
        ? "All goods received — inventory updated"
        : "Partial receipt recorded";
      const extra = data.newMedicinesCreated?.length
        ? ` · ${data.newMedicinesCreated.length} new medicine(s) added (pending verification)`
        : "";
      toast.success(msg + extra);
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Failed to receive order"),
  });

  const canSubmit = useMemo(() => {
    if (!branchId) return false;
    return order?.items?.every((item: any) => {
      const s = items[item.id];
      if (!s || s.sellingPrice <= 0) return false;
      if (s.mode === "found") return !!s.medicineId;
      if (s.mode === "new") return !!(s.newName && s.newCategory && s.newForm);
      return false;
    });
  }, [branchId, items, order?.items]);

  const inp = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const sel = inp + " appearance-none bg-white";

  if (!order) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Receive Goods — ${order.orderNo}`} size="xl">
      <div className="space-y-5">

        {/* Branch */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Receive into Branch *</label>
          <div className="relative">
            <select value={branchId} onChange={e => setBranchId(e.target.value)} className={sel}>
              <option value="">Select branch</option>
              {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Items */}
        <div className="space-y-4">
          {order.items?.map((item: any) => {
            const s = items[item.id];
            if (!s) return null;
            const results = searchResults[item.id] ?? [];

            return (
              <div key={item.id} className="border border-gray-200 rounded-xl overflow-hidden">
                {/* Item header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <Package className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <p className="font-semibold text-gray-800 text-sm">{item.medicineName}</p>
                  <span className="ml-auto text-xs text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-lg">
                    Ordered {item.quantity} × {formatCurrency(Number(item.unitCost))}
                  </span>
                </div>

                <div className="p-4 space-y-4">
                  {/* Medicine resolution */}
                  {s.mode === "search" && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Search medicine catalog *
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Type name, generic name, or barcode…"
                          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={s.search}
                          onChange={e => set(item.id, { search: e.target.value })}
                          autoFocus
                        />
                      </div>

                      {s.search.length > 0 && (
                        <div className="mt-1 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                          {results.length > 0 ? (
                            <>
                              {results.map((m: any) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => set(item.id, {
                                    mode: "found",
                                    medicineId: m.id,
                                    medicineName: m.name,
                                    search: "",
                                  })}
                                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-blue-50 border-b border-gray-100 last:border-0 text-left transition"
                                >
                                  <div>
                                    <span className="font-medium text-gray-800">{m.name}</span>
                                    {m.strength && <span className="text-gray-500 ml-1">{m.strength}</span>}
                                    {m.genericName && (
                                      <span className="block text-xs text-gray-400">{m.genericName}</span>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                                    {m.form}
                                  </span>
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={() => set(item.id, { mode: "new", search: "" })}
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-blue-600 hover:bg-blue-50 transition border-t border-gray-100"
                              >
                                <Plus className="h-4 w-4" />
                                Not what I'm looking for — add as new medicine
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => set(item.id, { mode: "new", search: "" })}
                              className="w-full flex items-center gap-2 px-3 py-3 text-sm text-blue-600 hover:bg-blue-50 transition"
                            >
                              <Plus className="h-4 w-4" />
                              <span>
                                <strong>"{s.search}"</strong> not found — add as new medicine
                              </span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {s.mode === "found" && (
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm font-medium text-green-800">{s.medicineName}</span>
                      <button
                        type="button"
                        onClick={() => set(item.id, { mode: "search", medicineId: "", medicineName: "" })}
                        className="ml-auto text-green-600 hover:text-green-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {s.mode === "new" && (
                    <div className="space-y-3 border border-blue-200 rounded-lg p-3 bg-blue-50/40">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-amber-500" />
                          <span className="text-xs font-semibold text-amber-700">
                            New medicine — pending admin verification
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => set(item.id, { mode: "search" })}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Medicine Name *</label>
                          <input
                            type="text"
                            className={inp}
                            placeholder="e.g. Paracetamol 500mg"
                            value={s.newName}
                            onChange={e => set(item.id, { newName: e.target.value })}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Category *</label>
                          <div className="relative">
                            <select
                              className={sel}
                              value={s.newCategory}
                              onChange={e => set(item.id, { newCategory: e.target.value })}
                            >
                              <option value="">Select…</option>
                              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Form *</label>
                          <div className="relative">
                            <select
                              className={sel}
                              value={s.newForm}
                              onChange={e => set(item.id, { newForm: e.target.value })}
                            >
                              {MEDICINE_FORMS.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Generic Name</label>
                          <input
                            type="text"
                            className={inp}
                            placeholder="e.g. Acetaminophen"
                            value={s.newGenericName}
                            onChange={e => set(item.id, { newGenericName: e.target.value })}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Strength</label>
                          <input
                            type="text"
                            className={inp}
                            placeholder="e.g. 500mg"
                            value={s.newStrength}
                            onChange={e => set(item.id, { newStrength: e.target.value })}
                          />
                        </div>

                        <div className="col-span-2 flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`rx-${item.id}`}
                            checked={s.newRequiresPrescription}
                            onChange={e => set(item.id, { newRequiresPrescription: e.target.checked })}
                            className="rounded border-gray-300"
                          />
                          <label htmlFor={`rx-${item.id}`} className="text-xs text-gray-600">
                            Requires prescription
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Receiving details — shown once medicine is resolved */}
                  {(s.mode === "found" || s.mode === "new") && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Qty Received *</label>
                        <input
                          type="number" min={1} className={inp}
                          value={s.receivedQty}
                          onChange={e => set(item.id, { receivedQty: Number(e.target.value) })}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Selling Price ($) *</label>
                        <input
                          type="number" step="0.01" min={0} placeholder="0.00" className={inp}
                          value={s.sellingPrice || ""}
                          onChange={e => set(item.id, { sellingPrice: Number(e.target.value) })}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Cost Price ($)</label>
                        <input
                          type="number" step="0.01" min={0} className={inp}
                          value={s.costPrice || ""}
                          onChange={e => set(item.id, { costPrice: Number(e.target.value) })}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Batch No.</label>
                        <input
                          type="text" placeholder="e.g. LOT-2024-001" className={inp}
                          value={s.batchNo}
                          onChange={e => set(item.id, { batchNo: e.target.value })}
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Expiry Date</label>
                        <input
                          type="date" className={inp}
                          value={s.expiryDate}
                          onChange={e => set(item.id, { expiryDate: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {!canSubmit && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            Select a branch, resolve every medicine (existing or new), and enter a selling price to continue.
          </p>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
            Cancel
          </button>
          <button
            onClick={() => mutate()}
            disabled={!canSubmit || isPending}
            className="px-5 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm Receipt & Update Inventory
          </button>
        </div>
      </div>
    </Modal>
  );
}
