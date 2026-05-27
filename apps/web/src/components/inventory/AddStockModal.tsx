"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const schema = z.object({
  medicineId: z.string().min(1, "Medicine required"),
  branchId: z.string().min(1, "Branch required"),
  supplierId: z.string().optional(),
  batchNo: z.string().optional(),
  quantity: z.coerce.number().int().min(1, "Quantity must be ≥ 1"),
  reorderLevel: z.coerce.number().int().min(0).default(10),
  costPrice: z.coerce.number().min(0, "Cost price required"),
  sellingPrice: z.coerce.number().min(0, "Selling price required"),
  expiryDate: z.string().optional(),
  location: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  prefillMedicineId?: string;
}

export function AddStockModal({ open, onClose, prefillMedicineId }: Props) {
  const qc = useQueryClient();

  const { data: medicines = [] } = useQuery<any[]>({
    queryKey: ["medicines"],
    queryFn: () => api.get("/v1/medicines").then(r => r.data),
  });

  const { data: branches = [] } = useQuery<any[]>({
    queryKey: ["branches"],
    queryFn: () => api.get("/v1/pharmacy/branches").then(r => r.data),
  });

  const { data: suppliers = [] } = useQuery<any[]>({
    queryKey: ["suppliers"],
    queryFn: () => api.get("/v1/suppliers").then(r => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { reorderLevel: 10, medicineId: prefillMedicineId ?? "" },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) =>
      api.post(`/v1/inventory/branches/${data.branchId}/items`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["stock"] });
      toast.success("Stock added successfully");
      reset();
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Failed to add stock"),
  });

  return (
    <Modal open={open} onClose={onClose} title="Add Stock" size="lg">
      <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Medicine *" error={errors.medicineId?.message}>
            <select {...register("medicineId")} className={inp()}>
              <option value="">Select medicine</option>
              {medicines.map((m: any) => (
                <option key={m.id} value={m.id}>{m.name}{m.strength ? ` ${m.strength}` : ""}</option>
              ))}
            </select>
          </Field>
          <Field label="Branch *" error={errors.branchId?.message}>
            <select {...register("branchId")} className={inp()}>
              <option value="">Select branch</option>
              {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Supplier" error={errors.supplierId?.message}>
            <select {...register("supplierId")} className={inp()}>
              <option value="">No supplier</option>
              {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Batch No." error={errors.batchNo?.message}>
            <input {...register("batchNo")} placeholder="e.g. BT-2024-001" className={inp()} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Quantity *" error={errors.quantity?.message}>
            <input {...register("quantity")} type="number" min={1} placeholder="0" className={inp()} />
          </Field>
          <Field label="Reorder Level" error={errors.reorderLevel?.message}>
            <input {...register("reorderLevel")} type="number" min={0} placeholder="10" className={inp()} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Cost Price ($) *" error={errors.costPrice?.message}>
            <input {...register("costPrice")} type="number" step="0.01" min={0} placeholder="0.00" className={inp()} />
          </Field>
          <Field label="Selling Price ($) *" error={errors.sellingPrice?.message}>
            <input {...register("sellingPrice")} type="number" step="0.01" min={0} placeholder="0.00" className={inp()} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Expiry Date" error={errors.expiryDate?.message}>
            <input {...register("expiryDate")} type="date" className={inp()} />
          </Field>
          <Field label="Storage Location" error={errors.location?.message}>
            <input {...register("location")} placeholder="e.g. Shelf A-3" className={inp()} />
          </Field>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
          <button type="submit" disabled={isPending} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition flex items-center gap-2 disabled:opacity-60">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Add Stock
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

const inp = () => "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
