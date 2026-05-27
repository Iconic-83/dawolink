"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Name required"),
  contactName: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().min(6, "Phone required"),
  address: z.string().optional(),
  city: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function AddSupplierModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) => api.post("/v1/suppliers", data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier added");
      reset();
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Failed to add supplier"),
  });

  return (
    <Modal open={open} onClose={onClose} title="Add Supplier" size="md">
      <form onSubmit={handleSubmit(d => mutate(d))} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Company Name *" error={errors.name?.message}>
            <input {...register("name")} placeholder="e.g. Mogadishu Pharma" className={inp()} />
          </Field>
          <Field label="Contact Person" error={errors.contactName?.message}>
            <input {...register("contactName")} placeholder="Full name" className={inp()} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone *" error={errors.phone?.message}>
            <input {...register("phone")} placeholder="+252 6X XXX XXXX" className={inp()} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <input {...register("email")} type="email" placeholder="supplier@example.com" className={inp()} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="City" error={errors.city?.message}>
            <input {...register("city")} placeholder="e.g. Mogadishu" className={inp()} />
          </Field>
          <Field label="Address" error={errors.address?.message}>
            <input {...register("address")} placeholder="Street / area" className={inp()} />
          </Field>
        </div>
        <Field label="Notes" error={errors.notes?.message}>
          <textarea {...register("notes")} rows={2} placeholder="Payment terms, delivery info…" className={inp()} />
        </Field>
        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition">Cancel</button>
          <button type="submit" disabled={isPending} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 disabled:opacity-60 transition">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Add Supplier
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
