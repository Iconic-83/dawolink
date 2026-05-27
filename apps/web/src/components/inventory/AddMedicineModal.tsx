"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const MEDICINE_FORMS = ["TABLET","CAPSULE","SYRUP","INJECTION","CREAM","DROPS","INHALER","POWDER","SUPPOSITORY","PATCH","OTHER"];
const CATEGORIES = ["Antibiotics","Analgesics","Antivirals","Antifungals","Vitamins","Cardiovascular","Diabetes","Respiratory","Dermatology","Gastrointestinal","Neurology","Ophthalmology","Other"];

const schema = z.object({
  name: z.string().min(2, "Name required"),
  genericName: z.string().optional(),
  barcode: z.string().optional(),
  sku: z.string().optional(),
  category: z.string().min(1, "Category required"),
  form: z.string().min(1, "Form required"),
  strength: z.string().optional(),
  unit: z.string().default("pcs"),
  requiresPrescription: z.boolean().default(false),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props { open: boolean; onClose: () => void; }

export function AddMedicineModal({ open, onClose }: Props) {
  const qc = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { unit: "pcs", requiresPrescription: false },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) => api.post("/v1/medicines", data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medicines"] });
      toast.success("Medicine added to catalog");
      reset();
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Failed to add medicine"),
  });

  return (
    <Modal open={open} onClose={onClose} title="Add Medicine to Catalog" size="lg">
      <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Medicine Name *" error={errors.name?.message}>
            <input {...register("name")} placeholder="e.g. Amoxicillin" className={input()} />
          </Field>
          <Field label="Generic Name" error={errors.genericName?.message}>
            <input {...register("genericName")} placeholder="e.g. Amoxicillin trihydrate" className={input()} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Category *" error={errors.category?.message}>
            <select {...register("category")} className={input()}>
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Form *" error={errors.form?.message}>
            <select {...register("form")} className={input()}>
              <option value="">Select form</option>
              {MEDICINE_FORMS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Strength" error={errors.strength?.message}>
            <input {...register("strength")} placeholder="e.g. 500mg" className={input()} />
          </Field>
          <Field label="Unit" error={errors.unit?.message}>
            <input {...register("unit")} placeholder="pcs" className={input()} />
          </Field>
          <Field label="Barcode" error={errors.barcode?.message}>
            <input {...register("barcode")} placeholder="Scan or enter" className={input()} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="SKU" error={errors.sku?.message}>
            <input {...register("sku")} placeholder="Internal code" className={input()} />
          </Field>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" {...register("requiresPrescription")} className="w-4 h-4 rounded accent-blue-600" />
              Requires prescription
            </label>
          </div>
        </div>

        <Field label="Description" error={errors.description?.message}>
          <textarea {...register("description")} placeholder="Optional notes…" rows={2} className={input()} />
        </Field>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition">Cancel</button>
          <button type="submit" disabled={isPending} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition flex items-center gap-2 disabled:opacity-60">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Add Medicine
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

const input = () => "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white";
