"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { Loader2, Package, ChevronDown } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  order: any;
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
  const [items, setItems] = useState<Record<string, {
    medicineId: string; receivedQty: number; costPrice: number;
    sellingPrice: number; batchNo: string; expiryDate: string;
  }>>(() => {
    const init: Record<string, any> = {};
    order?.items?.forEach((item: any) => {
      init[item.id] = {
        medicineId: "", receivedQty: item.quantity,
        costPrice: Number(item.unitCost), sellingPrice: 0,
        batchNo: "", expiryDate: "",
      };
    });
    return init;
  });

  const setField = (itemId: string, field: string, value: any) =>
    setItems(prev => ({ ...prev, [itemId]: { ...prev[itemId], [field]: value } }));

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      const payload = {
        branchId,
        items: order.items.map((item: any) => ({
          poItemId: item.id,
          ...items[item.id],
          receivedQty: Number(items[item.id].receivedQty),
          costPrice: Number(items[item.id].costPrice),
          sellingPrice: Number(items[item.id].sellingPrice),
        })),
      };
      return api.post(`/v1/suppliers/purchase-orders/${order.id}/receive`, payload).then(r => r.data);
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
      qc.invalidateQueries({ queryKey: ["stock"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      toast.success(data.fullyReceived ? "All goods received — stock updated" : "Partial receipt recorded");
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Failed to receive order"),
  });

  const canSubmit = branchId &&
    order?.items?.every((item: any) => items[item.id]?.medicineId && items[item.id]?.sellingPrice > 0);

  const sel = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none";
  const inp = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  if (!order) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Receive Goods — ${order.orderNo}`} size="xl">
      <div className="space-y-5">
        {/* Branch selector */}
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
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">
            Map each ordered item to a medicine in your catalog, then enter receiving details.
          </p>
          <div className="space-y-3">
            {order.items?.map((item: any) => (
              <div key={item.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <p className="font-semibold text-gray-800 text-sm">{item.medicineName}</p>
                  <span className="ml-auto text-xs text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-lg">
                    Ordered: {item.quantity} units · {formatCurrency(Number(item.unitCost))} each
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Medicine catalog match */}
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Match to Medicine Catalog *</label>
                    <div className="relative">
                      <select
                        value={items[item.id]?.medicineId ?? ""}
                        onChange={e => setField(item.id, "medicineId", e.target.value)}
                        className={sel}
                      >
                        <option value="">— Select medicine —</option>
                        {medicines.map((m: any) => (
                          <option key={m.id} value={m.id}>{m.name}{m.strength ? ` ${m.strength}` : ""}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Qty Received *</label>
                    <input type="number" min={1} className={inp}
                      value={items[item.id]?.receivedQty ?? item.quantity}
                      onChange={e => setField(item.id, "receivedQty", e.target.value)} />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Selling Price ($) *</label>
                    <input type="number" step="0.01" min={0} placeholder="0.00" className={inp}
                      value={items[item.id]?.sellingPrice || ""}
                      onChange={e => setField(item.id, "sellingPrice", e.target.value)} />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Batch No.</label>
                    <input type="text" placeholder="e.g. LOT-2024-001" className={inp}
                      value={items[item.id]?.batchNo ?? ""}
                      onChange={e => setField(item.id, "batchNo", e.target.value)} />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Expiry Date</label>
                    <input type="date" className={inp}
                      value={items[item.id]?.expiryDate ?? ""}
                      onChange={e => setField(item.id, "expiryDate", e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {!canSubmit && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            Select a branch and match every item to a medicine with a selling price to continue.
          </p>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
          <button
            onClick={() => mutate()}
            disabled={!canSubmit || isPending}
            className="px-5 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm Receipt & Add to Inventory
          </button>
        </div>
      </div>
    </Modal>
  );
}
