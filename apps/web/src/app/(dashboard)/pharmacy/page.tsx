"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import {
  Building2, MapPin, Phone, Mail, FileText, Globe,
  Camera, Edit2, Plus, Trash2, Loader2, Save,
  CheckCircle2, AlertTriangle, Star, ChevronRight, Settings2,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, "") ?? "http://localhost:4000";

const PLAN_COLOR: Record<string, string> = {
  STARTER: "bg-blue-100 text-blue-700",
  PROFESSIONAL: "bg-purple-100 text-purple-700",
  ENTERPRISE: "bg-amber-100 text-amber-700",
};

const SOMALI_CITIES = [
  "Mogadishu","Hargeisa","Bosaso","Kismayo","Baidoa",
  "Garowe","Beledweyne","Marka","Jilib","Gaalkacyo",
];

type Tab = "profile" | "branches" | "settings" | "danger";

// ── Reusable field ─────────────────────────────────────────────────────────

function Field({
  label, value, onChange, placeholder, type = "text", readOnly, required, hint,
}: {
  label: string; value: string; onChange?: (v: string) => void;
  placeholder?: string; type?: string; readOnly?: boolean; required?: boolean; hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition
          ${readOnly
            ? "bg-gray-50 text-gray-500 border-gray-200 cursor-default"
            : "bg-white border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent"
          }`}
      />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function SelectField({ label, value, onChange, options, required }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple appearance-none"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ── Branch modal ───────────────────────────────────────────────────────────

function BranchModal({ branch, onClose }: { branch?: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: branch?.name ?? "",
    address: branch?.address ?? "",
    phone: branch?.phone ?? "",
    isMain: branch?.isMain ?? false,
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const { mutate, isPending } = useMutation({
    mutationFn: () => branch
      ? api.patch(`/v1/pharmacy/branches/${branch.id}`, form).then(r => r.data)
      : api.post("/v1/pharmacy/branches", form).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pharmacy"] });
      toast.success(branch ? "Branch updated" : "Branch created");
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed"),
  });

  const inp = "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple";

  return (
    <Modal open onClose={onClose} title={branch ? "Edit Branch" : "Add Branch"} size="sm">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Branch Name *</label>
          <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Main Branch" className={inp} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Address *</label>
          <input value={form.address} onChange={e => set("address", e.target.value)} placeholder="Street address" className={inp} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
          <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+252 61 xxx xxxx" className={inp} />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.isMain} onChange={e => set("isMain", e.target.checked)} className="rounded border-gray-300" />
          <span className="text-sm text-gray-700">Set as main branch</span>
        </label>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">Cancel</button>
          <button
            onClick={() => mutate()}
            disabled={isPending || !form.name.trim() || !form.address.trim()}
            className="flex-1 py-2.5 rounded-xl bg-brand-teal text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {branch ? "Save Changes" : "Create Branch"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Profile tab ────────────────────────────────────────────────────────────

function ProfileTab({ pharmacy }: { pharmacy: any }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name:      pharmacy.name       ?? "",
    nameAr:    pharmacy.nameAr     ?? "",
    email:     pharmacy.email      ?? "",
    phone:     pharmacy.phone      ?? "",
    address:   pharmacy.address    ?? "",
    city:      pharmacy.city       ?? "",
    country:   pharmacy.country    ?? "Somalia",
    licenseNo: pharmacy.licenseNo  ?? "",
  });
  const [dirty, setDirty] = useState(false);

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); setDirty(true); }

  const { mutate: save, isPending } = useMutation({
    mutationFn: () => api.patch("/v1/pharmacy/me", form).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pharmacy"] }); toast.success("Profile saved"); setDirty(false); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed to save"),
  });

  async function handleLogoUpload(file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Only JPEG, PNG or WebP images allowed"); return;
    }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5 MB"); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("logo", file);
      await api.post("/v1/pharmacy/logo", fd, { headers: { "Content-Type": "multipart/form-data" } });
      qc.invalidateQueries({ queryKey: ["pharmacy"] });
      toast.success("Logo updated");
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? "Upload failed");
    } finally { setUploading(false); }
  }

  const logoSrc = pharmacy.logoUrl ? `${API_BASE}${pharmacy.logoUrl}` : null;
  const initials = pharmacy.name?.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase() ?? "PH";

  return (
    <div className="space-y-8">
      {/* Plan banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 text-white flex items-center justify-between gap-4">
        <div>
          <p className="text-indigo-200 text-xs font-medium mb-0.5">Current Plan</p>
          <p className="text-xl font-bold capitalize">{pharmacy.plan?.toLowerCase()}</p>
          {pharmacy.planExpiry && (
            <p className="text-indigo-200 text-xs mt-0.5">
              {new Date(pharmacy.planExpiry) > new Date() ? `Active until ${formatDate(pharmacy.planExpiry)}` : "Plan expired"}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {pharmacy.isActive
            ? <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-300"><CheckCircle2 className="h-4 w-4" /> Active</span>
            : <span className="flex items-center gap-1.5 text-sm font-medium text-red-300"><AlertTriangle className="h-4 w-4" /> Suspended</span>}
          <a href="/billing" className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition flex items-center gap-1">
            Manage Plan <ChevronRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Logo + basic identity */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Pharmacy Identity</h2>

        <div className="flex items-start gap-6 mb-6">
          {/* Logo circle */}
          <div className="relative flex-shrink-0">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden cursor-pointer ring-2 ring-offset-2 ring-gray-100 hover:ring-brand-teal transition"
              style={{ background: logoSrc ? undefined : "linear-gradient(135deg, #180D62, #2D1B8E)" }}
              onClick={() => fileRef.current?.click()}
            >
              {logoSrc
                ? <img src={logoSrc} alt="Logo" className="w-full h-full object-cover" />
                : <span className="text-white text-xl font-bold">{initials}</span>}
              {uploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl">
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                </div>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-brand-teal text-white flex items-center justify-center shadow-md hover:scale-110 transition"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); e.target.value = ""; }} />
          </div>

          <div className="flex-1 space-y-1">
            <p className="text-sm text-gray-500">Pharmacy logo</p>
            <p className="text-xs text-gray-400">JPEG, PNG or WebP · Max 5 MB · Recommended 400×400px</p>
            <p className="text-xs text-gray-400">Displayed in your customer-facing shop and receipts</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Pharmacy Name" value={form.name} onChange={v => set("name", v)} required placeholder="e.g. Medina Pharmacy" />
          <Field label="Arabic Name" value={form.nameAr} onChange={v => set("nameAr", v)} placeholder="اسم الصيدلية" />
          <Field label="Slug" value={pharmacy.slug} readOnly hint="URL identifier — cannot be changed" />
          <Field label="License Number" value={form.licenseNo} onChange={v => set("licenseNo", v)} placeholder="e.g. MOH-2024-001" />
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Contact & Location</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Email" value={form.email} onChange={v => set("email", v)} type="email" placeholder="pharmacy@example.com" />
          <Field label="Phone" value={form.phone} onChange={v => set("phone", v)} type="tel" placeholder="+252 61 xxx xxxx" required />
          <div className="sm:col-span-2">
            <Field label="Address" value={form.address} onChange={v => set("address", v)} placeholder="Street address" required />
          </div>
          <SelectField
            label="City"
            value={form.city}
            onChange={v => set("city", v)}
            options={SOMALI_CITIES.map(c => ({ value: c, label: c }))}
            required
          />
          <Field label="Country" value={form.country} onChange={v => set("country", v)} placeholder="Somalia" />
        </div>
      </div>

      {/* Save bar */}
      <div className={`sticky bottom-4 flex justify-end transition-all ${dirty ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg px-5 py-3 flex items-center gap-4">
          <p className="text-sm text-gray-500">You have unsaved changes</p>
          <button
            onClick={() => save()}
            disabled={isPending}
            className="flex items-center gap-2 px-5 py-2 bg-brand-teal hover:bg-brand-teal-dark text-white rounded-xl text-sm font-semibold transition disabled:opacity-60"
            style={{ background: "linear-gradient(90deg, #00C897, #009E78)" }}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Branches tab ───────────────────────────────────────────────────────────

function BranchesTab({ pharmacy }: { pharmacy: any }) {
  const qc = useQueryClient();
  const [editBranch, setEditBranch] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);

  const branches: any[] = pharmacy.branches ?? [];

  const { mutate: deactivate, isPending: deactivating } = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/pharmacy/branches/${id}`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pharmacy"] }); toast.success("Branch deactivated"); setConfirmDelete(null); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed"),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Branches</h2>
          <p className="text-sm text-gray-500 mt-0.5">{branches.length} active {branches.length === 1 ? "branch" : "branches"}</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition"
          style={{ background: "linear-gradient(90deg, #00C897, #009E78)" }}
        >
          <Plus className="h-4 w-4" /> Add Branch
        </button>
      </div>

      <div className="space-y-3">
        {branches.map((branch: any) => (
          <div key={branch.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-gray-900">{branch.name}</p>
                {branch.isMain && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
                    <Star className="h-3 w-3" /> Main
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" /> {branch.address}
              </p>
              {branch.phone && (
                <p className="text-sm text-gray-400 flex items-center gap-1.5 mt-0.5">
                  <Phone className="h-3.5 w-3.5 flex-shrink-0" /> {branch.phone}
                </p>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => setEditBranch(branch)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              {!branch.isMain && (
                <button
                  onClick={() => setConfirmDelete(branch)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {(showAdd) && <BranchModal onClose={() => setShowAdd(false)} />}
      {editBranch && <BranchModal branch={editBranch} onClose={() => setEditBranch(null)} />}

      {confirmDelete && (
        <Modal open onClose={() => setConfirmDelete(null)} title="Deactivate Branch" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to deactivate <strong>{confirmDelete.name}</strong>?
              Staff assigned to this branch will lose access to branch-specific features.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">Cancel</button>
              <button
                onClick={() => deactivate(confirmDelete.id)}
                disabled={deactivating}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deactivating && <Loader2 className="h-4 w-4 animate-spin" />}
                Deactivate
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Settings tab ──────────────────────────────────────────────────────────

const CURRENCIES = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "SOS", label: "SOS — Somali Shilling" },
  { value: "ETB", label: "ETB — Ethiopian Birr" },
  { value: "KES", label: "KES — Kenyan Shilling" },
];

const TIMEZONES = [
  { value: "Africa/Mogadishu", label: "Africa/Mogadishu (EAT, UTC+3)" },
  { value: "Africa/Nairobi",   label: "Africa/Nairobi (EAT, UTC+3)" },
  { value: "Africa/Addis_Ababa", label: "Africa/Addis_Ababa (EAT, UTC+3)" },
  { value: "UTC",              label: "UTC" },
];

function SettingsTab() {
  const qc = useQueryClient();

  const { data: settings, isLoading } = useQuery<any>({
    queryKey: ["pharmacy-settings"],
    queryFn: () => api.get("/v1/pharmacy/settings").then(r => r.data),
  });

  const [form, setForm] = useState<any>(null);
  const [dirty, setDirty] = useState(false);

  // Sync form when settings load
  if (settings && !form) {
    setForm({
      currency:            settings.currency            ?? "USD",
      timezone:            settings.timezone            ?? "Africa/Mogadishu",
      taxEnabled:          settings.taxEnabled          ?? false,
      taxRate:             settings.taxRate             ?? 0,
      taxLabel:            settings.taxLabel            ?? "VAT",
      invoicePrefix:       settings.invoicePrefix       ?? "INV",
      invoiceFooter:       settings.invoiceFooter       ?? "",
      defaultReorderLevel: settings.defaultReorderLevel ?? 10,
      expiryWarningDays:   settings.expiryWarningDays   ?? 30,
    });
  }

  function set(k: string, v: any) { setForm((f: any) => ({ ...f, [k]: v })); setDirty(true); }

  const { mutate: save, isPending } = useMutation({
    mutationFn: () => api.patch("/v1/pharmacy/settings", form).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pharmacy-settings"] });
      toast.success("Settings saved");
      setDirty(false);
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed to save"),
  });

  if (isLoading || !form) {
    return <div className="flex items-center justify-center h-32 text-gray-400"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…</div>;
  }

  const inp = "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple appearance-none";

  return (
    <div className="space-y-6">

      {/* Currency & Timezone */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-900">Regional Settings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
            <select value={form.currency} onChange={e => set("currency", e.target.value)} className={inp}>
              {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Timezone</label>
            <select value={form.timezone} onChange={e => set("timezone", e.target.value)} className={inp}>
              {TIMEZONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Tax Settings */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Tax Settings</h2>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              onClick={() => set("taxEnabled", !form.taxEnabled)}
              className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${form.taxEnabled ? "bg-brand-teal" : "bg-gray-200"}`}
              style={form.taxEnabled ? { background: "#00C897" } : undefined}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.taxEnabled ? "translate-x-5" : "translate-x-1"}`} />
            </div>
            <span className="text-sm text-gray-600">{form.taxEnabled ? "Enabled" : "Disabled"}</span>
          </label>
        </div>
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-opacity ${form.taxEnabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tax Rate (%)</label>
            <input
              type="number" min={0} max={100} step={0.5}
              value={form.taxRate}
              onChange={e => set("taxRate", parseFloat(e.target.value) || 0)}
              className={inp}
              placeholder="e.g. 15"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tax Label</label>
            <input
              type="text"
              value={form.taxLabel}
              onChange={e => set("taxLabel", e.target.value)}
              className={inp}
              placeholder="e.g. VAT, GST, Sales Tax"
            />
          </div>
        </div>
        {!form.taxEnabled && (
          <p className="text-xs text-gray-400">Enable tax to configure rate and label. Tax will be applied at POS checkout.</p>
        )}
      </div>

      {/* Invoice Settings */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-900">Invoice Settings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Invoice Prefix</label>
            <input
              type="text"
              value={form.invoicePrefix}
              onChange={e => set("invoicePrefix", e.target.value.toUpperCase())}
              className={inp}
              placeholder="e.g. INV, REC, DAWO"
              maxLength={8}
            />
            <p className="text-xs text-gray-400 mt-1">Invoices will be numbered: {form.invoicePrefix}-0001, {form.invoicePrefix}-0002…</p>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Invoice Footer Note</label>
          <textarea
            value={form.invoiceFooter}
            onChange={e => set("invoiceFooter", e.target.value)}
            rows={2}
            className={`${inp} resize-none`}
            placeholder="e.g. Thank you for your purchase. All sales are final."
          />
        </div>
      </div>

      {/* Operational Thresholds */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-900">Operational Thresholds</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Default Reorder Level</label>
            <input
              type="number" min={0}
              value={form.defaultReorderLevel}
              onChange={e => set("defaultReorderLevel", parseInt(e.target.value) || 0)}
              className={inp}
              placeholder="10"
            />
            <p className="text-xs text-gray-400 mt-1">Applied to new inventory items when no custom reorder level is set.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Expiry Warning (days)</label>
            <input
              type="number" min={1} max={365}
              value={form.expiryWarningDays}
              onChange={e => set("expiryWarningDays", parseInt(e.target.value) || 30)}
              className={inp}
              placeholder="30"
            />
            <p className="text-xs text-gray-400 mt-1">Items expiring within this many days will be flagged as warnings.</p>
          </div>
        </div>
      </div>

      {/* Save bar */}
      <div className={`sticky bottom-4 flex justify-end transition-all ${dirty ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg px-5 py-3 flex items-center gap-4">
          <p className="text-sm text-gray-500">You have unsaved changes</p>
          <button
            onClick={() => save()}
            disabled={isPending}
            className="flex items-center gap-2 px-5 py-2 text-white rounded-xl text-sm font-semibold transition disabled:opacity-60"
            style={{ background: "linear-gradient(90deg, #00C897, #009E78)" }}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Danger zone tab ────────────────────────────────────────────────────────

function DangerTab({ pharmacy }: { pharmacy: any }) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Pharmacy Information</h2>
        <p className="text-sm text-gray-500 mb-5">Read-only identifiers for your account</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {[
            { label: "Pharmacy ID",   value: pharmacy.id },
            { label: "Slug / Handle", value: pharmacy.slug },
            { label: "Plan",          value: pharmacy.plan },
            { label: "Country",       value: pharmacy.country },
            { label: "Created",       value: formatDate(pharmacy.createdAt) },
            { label: "Status",        value: pharmacy.isActive ? "Active" : "Suspended" },
          ].map(row => (
            <div key={row.label} className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">{row.label}</p>
              <p className="font-mono text-gray-700 text-sm truncate">{row.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <h2 className="text-base font-semibold text-red-800 mb-1 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> Danger Zone
        </h2>
        <p className="text-sm text-red-700 mb-4">
          These actions are irreversible. Contact support if you need to close your account.
        </p>
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-white rounded-xl p-4 border border-red-100">
            <div>
              <p className="text-sm font-semibold text-gray-800">Export all data</p>
              <p className="text-xs text-gray-500">Download all your pharmacy data as a ZIP archive</p>
            </div>
            <button className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
              Export
            </button>
          </div>
          <div className="flex items-center justify-between bg-white rounded-xl p-4 border border-red-100">
            <div>
              <p className="text-sm font-semibold text-red-700">Delete account</p>
              <p className="text-xs text-gray-500">Permanently remove all data. This cannot be undone.</p>
            </div>
            <button
              onClick={() => toast.error("Contact support@dawolink.com to delete your account")}
              className="px-4 py-2 rounded-lg border border-red-200 text-sm font-semibold text-red-600 hover:bg-red-50 transition"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function PharmacyPage() {
  const [tab, setTab] = useState<Tab>("profile");
  const user = useAuthStore(s => s.user);

  const { data: pharmacy, isLoading } = useQuery<any>({
    queryKey: ["pharmacy"],
    queryFn: () => api.get("/v1/pharmacy/me").then(r => r.data),
  });

  const isOwner = user?.role === "PHARMACY_OWNER";

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "profile",   label: "Profile",   icon: <Building2 className="h-4 w-4" /> },
    { key: "branches",  label: "Branches",  icon: <MapPin className="h-4 w-4" /> },
    { key: "settings",  label: "Settings",  icon: <Settings2 className="h-4 w-4" /> },
    { key: "danger",    label: "Danger Zone", icon: <AlertTriangle className="h-4 w-4" /> },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  if (!pharmacy) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Page header */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0"
          style={{ background: pharmacy.logoUrl ? undefined : "linear-gradient(135deg, #180D62, #2D1B8E)" }}>
          {pharmacy.logoUrl
            ? <img src={`${API_BASE}${pharmacy.logoUrl}`} alt="Logo" className="w-full h-full object-cover" />
            : <span className="text-white text-lg font-bold">
                {pharmacy.name?.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()}
              </span>}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{pharmacy.name}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PLAN_COLOR[pharmacy.plan] ?? ""}`}>
              {pharmacy.plan}
            </span>
            <span className="text-sm text-gray-400">{pharmacy.city}</span>
            {!isOwner && (
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                View only — owner access required to edit
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "profile"   && <ProfileTab  pharmacy={pharmacy} />}
      {tab === "branches"  && <BranchesTab pharmacy={pharmacy} />}
      {tab === "settings"  && <SettingsTab />}
      {tab === "danger"    && <DangerTab   pharmacy={pharmacy} />}
    </div>
  );
}
