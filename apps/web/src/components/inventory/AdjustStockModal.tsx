"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { db } from "@/lib/db";
import { queueMutation } from "@/lib/sync";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner";
import { Loader2, Minus, Plus, WifiOff } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  item: { id: string; medicineName: string; quantity: number; branchId: string; medicineId?: string } | null;
}

export function AdjustStockModal({ open, onClose, item }: Props) {
  const qc = useQueryClient();
  const { isOnline } = useOnlineStatus();
  const [adj, setAdj] = useState(0);
  const [reason, setReason] = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      api.post("/v1/inventory/adjust", { itemId: item!.id, adjustment: adj }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      toast.success(`Stock adjusted by ${adj > 0 ? "+" : ""}${adj}`);
      setAdj(0);
      setReason("");
      onClose();
    },
    onError: async (err: any) => {
      if (!navigator.onLine || err.code === "ERR_NETWORK") {
        await saveOffline();
      } else {
        toast.error(err.response?.data?.message ?? "Adjustment failed");
      }
    },
  });

  const saveOffline = async () => {
    await queueMutation("/v1/inventory/adjust", "POST", { itemId: item!.id, adjustment: adj });
    // Update local Dexie stock so POS reflects the change offline
    if (item?.medicineId && item.branchId) {
      const key = `${item.medicineId}:${item.branchId}`;
      const med = await db.medicines.get(key);
      if (med) {
        await db.medicines.update(key, { stock: Math.max(0, med.stock + adj) });
      }
    }
    toast.success(`Adjustment queued — will sync when internet returns`);
    setAdj(0);
    setReason("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!isOnline) {
      await saveOffline();
      return;
    }
    mutate();
  };

  if (!item) return null;

  const newQty = item.quantity + adj;

  return (
    <Modal open={open} onClose={onClose} title="Adjust Stock" size="sm">
      <div className="space-y-5">
        {!isOnline && (
          <div className="flex items-center gap-2 bg-orange-50 text-orange-700 rounded-xl px-4 py-2.5 text-sm">
            <WifiOff className="h-4 w-4 flex-shrink-0" />
            <span>Offline — adjustment will be queued and synced automatically.</span>
          </div>
        )}

        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm font-semibold text-gray-900">{item.medicineName}</p>
          <p className="text-xs text-gray-500 mt-0.5">Current stock: <span className="font-medium text-gray-700">{item.quantity} units</span></p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Adjustment Amount</label>
          <div className="flex items-center gap-3">
            <button onClick={() => setAdj(a => a - 1)} className="w-10 h-10 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition">
              <Minus className="h-4 w-4" />
            </button>
            <input
              type="number"
              value={adj}
              onChange={(e) => setAdj(parseInt(e.target.value) || 0)}
              className="flex-1 text-center text-2xl font-bold border border-gray-200 rounded-xl py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={() => setAdj(a => a + 1)} className="w-10 h-10 rounded-xl bg-green-50 hover:bg-green-100 text-green-600 flex items-center justify-center transition">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {adj !== 0 && (
          <div className={`rounded-xl p-3 text-sm font-medium ${newQty < 0 ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}>
            New quantity: {newQty < 0 ? <span className="text-red-600">Invalid (below 0)</span> : <span>{newQty} units</span>}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Reason (optional)</label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Damaged goods, count correction…"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={isPending || adj === 0 || newQty < 0}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition flex items-center gap-2 disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {!isOnline ? "Queue Adjustment" : "Apply Adjustment"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
