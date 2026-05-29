"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const schema = z.object({
  supplierId: z.string().min(1, "Supplier required"),
  notes: z.string().optional(),
  expectedDeliveryDate: z.string().optional(),
  items: z.array(z.object({
    medicineName: z.string().min(1, "Medicine name required"),
    quantity: z.coerce.number().int().min(1),
    unitCost: z.coerce.number().min(0.01, "Cost required"),
  })).min(1, "Add at least one item"),
});

type FormData = z.infer<typeof schema>;

export function CreatePOModal({ open, onClose, prefillSupplierId }: {
  open: boolean;
  onClose: () => void;
  prefillSupplierId?: string;
}) {
  const qc = useQueryClient();

  const { data: suppliers = [] } = useQuery<any[]>({
    queryKey: ["suppliers"],
    queryFn: () => api.get("/v1/suppliers").then(r => r.data),
  });

  const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      supplierId: prefillSupplierId ?? "",
      items: [{ medicineName: "", quantity: 1, unitCost: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = watch("items");
  const orderTotal = items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitCost) || 0), 0);

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) => api.post("/v1/suppliers/purchase-orders", data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Purchase order created");
      reset();
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Failed to create PO"),
  });

  return (
    <Modal open={open} onClose={onClose} title="Create Purchase Order" size="xl">
      <form onSubmit={handleSubmit(d => mutate(d))} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Supplier *</label>
            <select {...register("supplierId")} className={inp()}>
              <option value="">Select supplier</option>
              {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {errors.supplierId && <p className="text-red-500 text-xs mt-1">{errors.supplierId.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Expected Delivery</label>
            <input {...register("expectedDeliveryDate")} type="date" className={inp()} />
          </div>
        </div>

        {/* Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-600">Order Items *</label>
            <button type="button" onClick={() => append({ medicineName: "", quantity: 1, unitCost: 0 })}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
              <Plus className="h-3.5 w-3.5" /> Add item
            </button>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="px-3 py-2">Medicine Name</th>
                  <th className="px-3 py-2 w-24">Qty</th>
                  <th className="px-3 py-2 w-28">Unit Cost ($)</th>
                  <th className="px-3 py-2 w-24 text-right">Total</th>
                  <th className="px-3 py-2 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {fields.map((field, i) => (
                  <tr key={field.id}>
                    <td className="px-3 py-2">
                      <input {...register(`items.${i}.medicineName`)} placeholder="e.g. Paracetamol 500mg" className={inp()} />
                    </td>
                    <td className="px-3 py-2">
                      <input {...register(`items.${i}.quantity`)} type="number" min={1} className={inp()} />
                    </td>
                    <td className="px-3 py-2">
                      <input {...register(`items.${i}.unitCost`)} type="number" step="0.01" min={0} className={inp()} />
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-gray-700">
                      {formatCurrency((Number(items[i]?.quantity) || 0) * (Number(items[i]?.unitCost) || 0))}
                    </td>
                    <td className="px-3 py-2">
                      {fields.length > 1 && (
                        <button type="button" onClick={() => remove(i)} className="text-gray-300 hover:text-red-500 transition">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td colSpan={3} className="px-3 py-2 text-sm font-semibold text-gray-700 text-right">Order Total</td>
                  <td className="px-3 py-2 text-right font-bold text-gray-900">{formatCurrency(orderTotal)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
          {errors.items?.message && <p className="text-red-500 text-xs mt-1">{errors.items.message}</p>}
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
          <button type="submit" disabled={isPending} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 disabled:opacity-60 transition">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Order
          </button>
        </div>
      </form>
    </Modal>
  );
}

const inp = () => "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
