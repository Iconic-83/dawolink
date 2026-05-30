"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { Tag, Plus, Loader2, Edit2, Trash2, ToggleLeft, ToggleRight, Copy } from "lucide-react";

const inp = "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple bg-white";

function PromoForm({ promo, onClose }: { promo?: any; onClose: () => void }) {
  const qc = useQueryClient();
  const isEdit = !!promo;
  const [form, setForm] = useState({
    code: promo?.code ?? "",
    description: promo?.description ?? "",
    type: promo?.type ?? "PERCENTAGE",
    value: promo?.value ?? "",
    minOrder: promo?.minOrder ?? "",
    usageLimit: promo?.usageLimit ?? "",
    expiresAt: promo?.expiresAt ? promo.expiresAt.slice(0, 10) : "",
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const { mutate, isPending } = useMutation({
    mutationFn: () => isEdit
      ? api.patch(`/v1/promotions/${promo.id}`, {
          description: form.description || undefined,
          value: form.value ? +form.value : undefined,
          minOrder: form.minOrder ? +form.minOrder : undefined,
          usageLimit: form.usageLimit ? +form.usageLimit : undefined,
          expiresAt: form.expiresAt || undefined,
        }).then(r => r.data)
      : api.post("/v1/promotions", {
          code: form.code.trim(),
          description: form.description || undefined,
          type: form.type,
          value: +form.value,
          minOrder: form.minOrder ? +form.minOrder : undefined,
          usageLimit: form.usageLimit ? +form.usageLimit : undefined,
          expiresAt: form.expiresAt || undefined,
        }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["promotions"] });
      toast.success(isEdit ? "Promo updated" : "Promo code created");
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed"),
  });

  return (
    <Modal open onClose={onClose} title={isEdit ? "Edit Promo Code" : "Create Promo Code"} size="sm">
      <div className="space-y-4">
        {!isEdit && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Code *</label>
            <input value={form.code} onChange={e => set("code", e.target.value.toUpperCase())}
              placeholder="e.g. SAVE20" className={inp} maxLength={20} />
            <p className="text-xs text-gray-400 mt-1">Customers enter this at checkout. Auto-uppercased.</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
          <input value={form.description} onChange={e => set("description", e.target.value)}
            placeholder="e.g. 20% off for returning customers" className={inp} />
        </div>

        {!isEdit && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Discount Type *</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { v: "PERCENTAGE", label: "% Off", sub: "e.g. 10 = 10% off" },
                { v: "FIXED_AMOUNT", label: "$ Off", sub: "e.g. 5 = $5 off" },
              ].map(opt => (
                <button key={opt.v} type="button" onClick={() => set("type", opt.v)}
                  className={`p-3 rounded-xl border text-left transition ${form.type === opt.v ? "border-brand-purple bg-indigo-50" : "border-gray-200"}`}>
                  <p className="font-semibold text-sm text-gray-900">{opt.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{opt.sub}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {form.type === "PERCENTAGE" ? "Percentage (%)" : "Amount ($)"} *
            </label>
            <input type="number" min="0.01" step="0.01" value={form.value}
              onChange={e => set("value", e.target.value)}
              placeholder={form.type === "PERCENTAGE" ? "e.g. 10" : "e.g. 5.00"} className={inp} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Min Order ($)</label>
            <input type="number" min="0" step="0.01" value={form.minOrder}
              onChange={e => set("minOrder", e.target.value)}
              placeholder="0.00" className={inp} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Usage Limit</label>
            <input type="number" min="1" value={form.usageLimit}
              onChange={e => set("usageLimit", e.target.value)}
              placeholder="Unlimited" className={inp} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Expires At</label>
            <input type="date" value={form.expiresAt} onChange={e => set("expiresAt", e.target.value)} className={inp} />
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">Cancel</button>
          <button onClick={() => mutate()} disabled={isPending || (!isEdit && (!form.code || !form.value))}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(90deg,#00C897,#009E78)" }}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Save Changes" : "Create Code"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function PromotionsPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data: promos = [], isLoading } = useQuery<any[]>({
    queryKey: ["promotions"],
    queryFn: () => api.get("/v1/promotions").then(r => r.data),
  });

  const { mutate: toggle } = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/v1/promotions/${id}`, { isActive }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["promotions"] }),
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed"),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/promotions/${id}`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["promotions"] }); toast.success("Promo deleted"); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed"),
  });

  const active = promos.filter(p => p.isActive && (!p.expiresAt || new Date(p.expiresAt) > new Date()));
  const inactive = promos.filter(p => !p.isActive || (p.expiresAt && new Date(p.expiresAt) <= new Date()));

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => toast.success(`Copied: ${code}`));
  }

  function promoCard(p: any) {
    const isExpired = p.expiresAt && new Date(p.expiresAt) <= new Date();
    const atLimit = p.usageLimit !== null && p.usedCount >= p.usageLimit;
    const effectivelyInactive = !p.isActive || isExpired || atLimit;

    return (
      <div key={p.id} className={`bg-white rounded-2xl border p-5 transition ${effectivelyInactive ? "opacity-60 border-gray-100" : "border-gray-100"}`}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <button onClick={() => copyCode(p.code)}
              className="flex items-center gap-1.5 font-mono font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg text-sm hover:bg-indigo-100 transition">
              {p.code} <Copy className="h-3 w-3" />
            </button>
            <Badge variant={effectivelyInactive ? "muted" : "success"}>
              {isExpired ? "Expired" : atLimit ? "Limit reached" : p.isActive ? "Active" : "Paused"}
            </Badge>
            <Badge variant={p.type === "PERCENTAGE" ? "info" : "warning"}>
              {p.type === "PERCENTAGE" ? `${p.value}% off` : `$${p.value} off`}
            </Badge>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => setEditing(p)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition">
              <Edit2 className="h-4 w-4" />
            </button>
            <button onClick={() => toggle({ id: p.id, isActive: !p.isActive })}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition">
              {p.isActive ? <ToggleRight className="h-4 w-4 text-emerald-500" /> : <ToggleLeft className="h-4 w-4" />}
            </button>
            <button onClick={() => { if (window.confirm(`Delete promo ${p.code}?`)) remove(p.id); }}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {p.description && <p className="text-sm text-gray-500 mb-3">{p.description}</p>}

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
          {Number(p.minOrder) > 0 && <span>Min order: ${Number(p.minOrder).toFixed(2)}</span>}
          {p.usageLimit !== null
            ? <span>Used: {p.usedCount}/{p.usageLimit}</span>
            : <span>Used: {p.usedCount} times</span>}
          {p.expiresAt && <span>Expires: {formatDate(p.expiresAt)}</span>}
          <span>Created: {formatDate(p.createdAt)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Tag className="h-6 w-6 text-indigo-600" /> Promotions
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {active.length} active code{active.length !== 1 ? "s" : ""} · {promos.length} total
          </p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(90deg,#00C897,#009E78)" }}>
          <Plus className="h-4 w-4" /> New Code
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading…
        </div>
      )}

      {!isLoading && promos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100 text-gray-400">
          <Tag className="h-10 w-10 mb-3 opacity-20" />
          <p className="font-medium text-gray-600">No promo codes yet</p>
          <p className="text-sm mt-1">Create your first discount code to attract customers</p>
          <button onClick={() => setShowCreate(true)}
            className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(90deg,#00C897,#009E78)" }}>
            Create First Code
          </button>
        </div>
      )}

      {active.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Active</p>
          {active.map(promoCard)}
        </div>
      )}

      {inactive.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Paused / Expired</p>
          {inactive.map(promoCard)}
        </div>
      )}

      {showCreate && <PromoForm onClose={() => setShowCreate(false)} />}
      {editing && <PromoForm promo={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
