"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const ROLES = [
  { value: "PHARMACY_OWNER",  label: "Pharmacy Owner" },
  { value: "BRANCH_MANAGER",  label: "Branch Manager" },
  { value: "PHARMACIST",      label: "Pharmacist" },
  { value: "CASHIER",         label: "Cashier" },
  { value: "INVENTORY_STAFF", label: "Inventory Staff" },
  { value: "AUDITOR",         label: "Auditor" },
];

const schema = z.object({
  firstName:  z.string().min(2, "First name required"),
  lastName:   z.string().min(2, "Last name required"),
  email:      z.string().email("Valid email required"),
  phone:      z.string().optional(),
  password:   z.string().min(8, "Minimum 8 characters"),
  role:       z.string().min(1, "Role required"),
  branchId:   z.string().optional(),
  pharmacyId: z.string(),
});

type FormData = z.infer<typeof schema>;

export function AddStaffModal({ open, onClose, pharmacyId }: {
  open: boolean; onClose: () => void; pharmacyId: string;
}) {
  const qc = useQueryClient();

  const { data: branches = [] } = useQuery<any[]>({
    queryKey: ["branches"],
    queryFn: () => api.get("/v1/pharmacy/branches").then(r => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { pharmacyId, role: "PHARMACIST" },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) => api.post("/v1/auth/register", data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Staff member added");
      reset();
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Failed to add staff"),
  });

  return (
    <Modal open={open} onClose={onClose} title="Add Staff Member" size="md">
      <form onSubmit={handleSubmit(d => mutate(d))} className="space-y-4">
        <input type="hidden" {...register("pharmacyId")} />

        <div className="grid grid-cols-2 gap-4">
          <Field label="First Name *" error={errors.firstName?.message}>
            <input {...register("firstName")} placeholder="e.g. Ahmed" className={inp()} />
          </Field>
          <Field label="Last Name *" error={errors.lastName?.message}>
            <input {...register("lastName")} placeholder="e.g. Hassan" className={inp()} />
          </Field>
        </div>

        <Field label="Email Address *" error={errors.email?.message}>
          <input {...register("email")} type="email" placeholder="staff@pharmacy.so" className={inp()} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone" error={errors.phone?.message}>
            <input {...register("phone")} placeholder="+252 6X XXX XXXX" className={inp()} />
          </Field>
          <Field label="Password *" error={errors.password?.message}>
            <input {...register("password")} type="password" placeholder="Min. 8 characters" className={inp()} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Role *" error={errors.role?.message}>
            <select {...register("role")} className={inp()}>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </Field>
          <Field label="Assign to Branch" error={errors.branchId?.message}>
            <select {...register("branchId")} className={inp()}>
              <option value="">All branches</option>
              {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
          <button type="submit" disabled={isPending} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 disabled:opacity-60 transition">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Add Staff
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
