"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner";
import { Loader2, CheckCircle, FilePlus, Plus, Info } from "lucide-react";

const MEDICINE_FORMS = ["TABLET","CAPSULE","SYRUP","INJECTION","CREAM","DROPS","INHALER","POWDER","SUPPOSITORY","PATCH","OTHER"];
const CATEGORIES = ["Antibiotics","Analgesics","Antivirals","Antifungals","Vitamins","Cardiovascular","Diabetes","Respiratory","Dermatology","Gastrointestinal","Neurology","Ophthalmology","Other"];

const schema = z.object({
  // Medicine
  name:                 z.string().min(2, "Medicine name is required"),
  genericName:          z.string().optional(),
  brandName:            z.string().optional(),
  barcode:              z.string().optional(),
  category:             z.string().min(1, "Category is required"),
  form:                 z.string().min(1, "Form is required"),
  strength:             z.string().optional(),
  unit:                 z.string().default("pcs"),
  requiresPrescription: z.boolean().default(false),
  description:          z.string().optional(),
  manufacturer:         z.string().optional(),
  country:              z.string().optional(),
  // Inventory
  branchId:     z.string().min(1, "Branch is required"),
  quantity:     z.coerce.number().int().min(1, "Quantity must be ≥ 1"),
  costPrice:    z.coerce.number().min(0, "Cost price is required"),
  sellingPrice: z.coerce.number().min(0.01, "Selling price is required"),
  batchNo:      z.string().optional(),
  expiryDate:   z.string().optional(),
  reorderLevel: z.coerce.number().int().min(0).default(10),
  location:     z.string().optional(),
  // Supplier
  supplierId:     z.string().optional(),
  invoiceNumber:  z.string().optional(),
  purchaseDate:   z.string().optional(),
});

type FormData = z.infer<typeof schema>;
type SaveMode = "draft" | "verify" | "add_another";

interface Props { open: boolean; onClose: () => void; }

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
        <span className="text-indigo-600">{icon}</span>
        <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">{title}</span>
      </div>
      {children}
    </div>
  );
}

function Field({ label, error, required, hint, children }: {
  label: string; error?: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        {hint && <span className="text-gray-400 font-normal ml-1">({hint})</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

const inp = (error?: string) =>
  `w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white transition ${error ? "border-red-300" : "border-gray-200"}`;

export function QuickAddMedicineModal({ open, onClose }: Props) {
  const qc = useQueryClient();
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const { data: branches = [] } = useQuery<any[]>({
    queryKey: ["branches"],
    queryFn: () => api.get("/v1/pharmacy/branches").then(r => r.data),
  });
  const { data: suppliers = [] } = useQuery<any[]>({
    queryKey: ["suppliers"],
    queryFn: () => api.get("/v1/suppliers").then(r => r.data),
  });

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { unit: "pcs", requiresPrescription: false, reorderLevel: 10 },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: ({ data, mode }: { data: FormData; mode: SaveMode }) =>
      api.post("/v1/inventory/quick-add", { ...data, saveMode: mode }).then(r => r.data),
    onSuccess: (result, { mode }) => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["medicines"] });
      qc.invalidateQueries({ queryKey: ["stock"] });

      if (mode === "add_another") {
        setLastSaved(result.medicine.name);
        reset({ unit: "pcs", requiresPrescription: false, reorderLevel: 10, branchId: watch("branchId"), supplierId: watch("supplierId") });
        toast.success(`${result.medicine.name} saved — add another`);
      } else {
        toast.success(result.message);
        reset();
        onClose();
      }
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Failed to save medicine"),
  });

  function submit(mode: SaveMode) {
    handleSubmit(data => mutate({ data, mode }))();
  }

  const costPrice = watch("costPrice");
  const sellingPrice = watch("sellingPrice");
  const margin = costPrice > 0 && sellingPrice > 0
    ? (((sellingPrice - costPrice) / sellingPrice) * 100).toFixed(1)
    : null;

  return (
    <Modal open={open} onClose={onClose} title="Add Medicine" size="xl">
      {lastSaved && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 mb-4 text-sm text-green-700">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span><strong>{lastSaved}</strong> saved successfully. Fill in the next medicine below.</span>
        </div>
      )}

      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">

        {/* ── Medicine Information ── */}
        <Section title="Medicine Information" icon={<FilePlus className="w-4 h-4" />}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Medicine Name" required error={errors.name?.message}>
              <input {...register("name")} placeholder="e.g. Amoxicillin" className={inp(errors.name?.message)} autoFocus />
            </Field>
            <Field label="Generic Name" error={errors.genericName?.message}>
              <input {...register("genericName")} placeholder="e.g. Amoxicillin trihydrate" className={inp()} />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Category" required error={errors.category?.message}>
              <select {...register("category")} className={inp(errors.category?.message)}>
                <option value="">Select…</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Form" required error={errors.form?.message}>
              <select {...register("form")} className={inp(errors.form?.message)}>
                <option value="">Select…</option>
                {MEDICINE_FORMS.map(f => <option key={f} value={f}>{f.charAt(0) + f.slice(1).toLowerCase()}</option>)}
              </select>
            </Field>
            <Field label="Strength" hint="e.g. 500mg">
              <input {...register("strength")} placeholder="500mg" className={inp()} />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Barcode" hint="scan or type">
              <input {...register("barcode")} placeholder="6009…" className={inp()} />
            </Field>
            <Field label="Brand Name">
              <input {...register("brandName")} placeholder="e.g. Amoxil" className={inp()} />
            </Field>
            <Field label="Manufacturer">
              <input {...register("manufacturer")} placeholder="e.g. GSK" className={inp()} />
            </Field>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" {...register("requiresPrescription")} className="w-4 h-4 rounded accent-indigo-600" />
              <span className="font-medium">Prescription Required (RX)</span>
            </label>
          </div>

          <Field label="Description" hint="optional">
            <textarea {...register("description")} placeholder="Usage, indications, notes…" rows={2} className={inp()} />
          </Field>
        </Section>

        {/* ── Inventory Information ── */}
        <Section title="Inventory Information" icon={<Plus className="w-4 h-4" />}>
          <Field label="Branch" required error={errors.branchId?.message}>
            <select {...register("branchId")} className={inp(errors.branchId?.message)}>
              <option value="">Select branch…</option>
              {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Quantity" required error={errors.quantity?.message}>
              <input {...register("quantity")} type="number" min={1} placeholder="0" className={inp(errors.quantity?.message)} />
            </Field>
            <Field label="Unit Cost ($)" required error={errors.costPrice?.message}>
              <input {...register("costPrice")} type="number" step="0.01" min={0} placeholder="0.00" className={inp(errors.costPrice?.message)} />
            </Field>
            <Field label="Selling Price ($)" required error={errors.sellingPrice?.message}>
              <input {...register("sellingPrice")} type="number" step="0.01" min={0} placeholder="0.00" className={inp(errors.sellingPrice?.message)} />
            </Field>
          </div>

          {margin && (
            <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${Number(margin) >= 20 ? "bg-green-50 text-green-700" : Number(margin) >= 0 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
              <Info className="w-3.5 h-3.5" />
              Margin: <strong>{margin}%</strong>
              {Number(margin) < 0 && " — Selling price is below cost!"}
              {Number(margin) >= 0 && Number(margin) < 15 && " — Low margin, consider adjusting"}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <Field label="Batch Number" required error={errors.batchNo?.message}>
              <input {...register("batchNo")} placeholder="BT-2026-001" className={inp()} />
            </Field>
            <Field label="Expiry Date" required>
              <input {...register("expiryDate")} type="date" className={inp()} />
            </Field>
            <Field label="Reorder Level" hint="default 10">
              <input {...register("reorderLevel")} type="number" min={0} placeholder="10" className={inp()} />
            </Field>
          </div>

          <Field label="Storage Location" hint="e.g. Shelf A-3">
            <input {...register("location")} placeholder="Optional" className={inp()} />
          </Field>
        </Section>

        {/* ── Supplier Information ── */}
        <Section title="Supplier Information" icon={<Plus className="w-4 h-4" />}>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Supplier">
              <select {...register("supplierId")} className={inp()}>
                <option value="">No supplier</option>
                {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Invoice Number">
              <input {...register("invoiceNumber")} placeholder="INV-2026-001" className={inp()} />
            </Field>
            <Field label="Purchase Date">
              <input {...register("purchaseDate")} type="date" className={inp()} />
            </Field>
          </div>
        </Section>

      </div>

      {/* ── Actions ── */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-100 mt-4">
        <button type="button" onClick={onClose}
          className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition font-medium">
          Cancel
        </button>

        <button type="button" onClick={() => submit("draft")} disabled={isPending}
          className="px-4 py-2.5 text-sm font-semibold border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition disabled:opacity-50">
          Save as Draft
        </button>

        <div className="flex-1" />

        <button type="button" onClick={() => submit("add_another")} disabled={isPending}
          className="px-4 py-2.5 text-sm font-semibold border-2 border-indigo-600 text-indigo-600 rounded-xl hover:bg-indigo-50 transition disabled:opacity-50 flex items-center gap-2">
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Save & Add Another
        </button>

        <button type="button" onClick={() => submit("verify")} disabled={isPending}
          className="px-5 py-2.5 text-sm font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2">
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          Save & Verify
        </button>
      </div>

      {/* Verify explanation */}
      <p className="text-xs text-gray-400 mt-2 text-center">
        <strong>Save & Verify</strong> — medicine appears immediately in POS, inventory, and marketplace. &nbsp;
        <strong>Draft</strong> — saved but hidden until verified.
      </p>
    </Modal>
  );
}
