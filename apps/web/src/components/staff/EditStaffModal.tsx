"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useWatch } from "react-hook-form";

const ROLES = [
  { value: "PHARMACY_OWNER",  label: "Pharmacy Owner",  icon: "🏪", perms: ["Full pharmacy access", "Manage staff", "View all reports"] },
  { value: "BRANCH_MANAGER",  label: "Branch Manager",  icon: "🏢", perms: ["Manage branch", "View branch reports", "Approve transfers"] },
  { value: "PHARMACIST",      label: "Pharmacist",      icon: "💊", perms: ["POS access", "Inventory view", "Dispensing"] },
  { value: "CASHIER",         label: "Cashier",         icon: "💳", perms: ["POS access", "Process transactions"] },
  { value: "INVENTORY_STAFF", label: "Inventory Staff", icon: "📦", perms: ["Inventory management", "Stock adjustments"] },
  { value: "AUDITOR",         label: "Auditor",         icon: "📋", perms: ["View all reports", "Audit logs (read-only)"] },
];

const schema = z.object({
  role:     z.string().min(1),
  branchId: z.string().optional(),
  phone:    z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Staff { id: string; firstName: string; lastName: string; role: string; branchId?: string; phone?: string; }

export function EditStaffModal({ open, onClose, staff }: {
  open: boolean; onClose: () => void; staff: Staff | null;
}) {
  const qc = useQueryClient();

  const { data: branches = [] } = useQuery<any[]>({
    queryKey: ["branches"],
    queryFn: () => api.get("/v1/pharmacy/branches").then(r => r.data),
  });

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (staff) reset({ role: staff.role, branchId: staff.branchId ?? "", phone: staff.phone ?? "" });
  }, [staff, reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) =>
      api.patch(`/v1/pharmacy/staff/${staff!.id}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Staff updated");
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Update failed"),
  });

  const watchedRole = useWatch({ control, name: "role" });
  const selectedRole = ROLES.find(r => r.value === watchedRole);

  if (!staff) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Edit — ${staff.firstName} ${staff.lastName}`} size="sm">
      <form onSubmit={handleSubmit(d => mutate(d))} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
          <select {...register("role")} className={inp()}>
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.icon} {r.label}</option>)}
          </select>
          {selectedRole && (
            <div className="mt-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl">
              <div className="flex flex-wrap gap-1">
                {selectedRole.perms.map(p => (
                  <span key={p} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{p}</span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Branch</label>
          <select {...register("branchId")} className={inp()}>
            <option value="">All branches</option>
            {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
          <input {...register("phone")} placeholder="+252 6X XXX XXXX" className={inp()} />
        </div>
        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
          <button type="submit" disabled={isPending} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 disabled:opacity-60 transition">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
}

const inp = () => "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
