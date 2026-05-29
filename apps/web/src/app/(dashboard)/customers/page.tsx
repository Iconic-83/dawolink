"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageSpinner } from "@/components/ui/Spinner";
import { Plus, Search, User, Phone, Mail, AlertTriangle, Edit2 } from "lucide-react";
import dayjs from "dayjs";

function AddCustomerModal({ open, onClose, editCustomer }: { open: boolean; onClose: () => void; editCustomer?: any }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: editCustomer?.name ?? "",
    phone: editCustomer?.phone ?? "",
    email: editCustomer?.email ?? "",
    address: editCustomer?.address ?? "",
    dateOfBirth: editCustomer?.dateOfBirth ? dayjs(editCustomer.dateOfBirth).format("YYYY-MM-DD") : "",
    allergies: editCustomer?.allergies?.join(", ") ?? "",
    notes: editCustomer?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone || undefined,
        email: form.email || undefined,
        address: form.address || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        allergies: form.allergies ? form.allergies.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
        notes: form.notes || undefined,
      };
      if (editCustomer) {
        await api.patch(`/v1/customers/${editCustomer.id}`, payload);
        toast.success("Customer updated");
      } else {
        await api.post("/v1/customers", payload);
        toast.success("Customer registered");
      }
      qc.invalidateQueries({ queryKey: ["customers"] });
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Failed to save customer");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <Modal open={open} onClose={onClose} title={editCustomer ? "Edit Customer" : "Register New Customer"} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
            <input value={form.name} onChange={set("name")} placeholder="Ahmed Hassan" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
            <input value={form.phone} onChange={set("phone")} placeholder="+252 61 XXX XXXX" className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input type="email" value={form.email} onChange={set("email")} placeholder="customer@email.com" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date of Birth</label>
            <input type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} className={inputCls} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
          <input value={form.address} onChange={set("address")} placeholder="Mogadishu, Hodan District" className={inputCls} />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Known Allergies
            <span className="text-gray-400 font-normal ml-1">(comma separated)</span>
          </label>
          <input value={form.allergies} onChange={set("allergies")} placeholder="Penicillin, Aspirin" className={inputCls} />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
          <textarea value={form.notes} onChange={set("notes")} placeholder="Any relevant medical notes…" rows={2}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
          <button type="submit" disabled={saving}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50">
            {saving ? "Saving…" : editCustomer ? "Save Changes" : "Register Customer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editCustomer, setEditCustomer] = useState<any>(null);
  const [selected, setSelected] = useState<any>(null);

  const { data: customers = [], isLoading } = useQuery<any[]>({
    queryKey: ["customers", search],
    queryFn: () => api.get(`/v1/customers?search=${encodeURIComponent(search)}`).then(r => r.data),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage patient profiles and purchase history</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition">
          <Plus className="h-4 w-4" /> Register Customer
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Customers", value: customers.length, icon: "👥" },
          { label: "With Allergies", value: customers.filter((c: any) => c.allergies?.length > 0).length, icon: "⚠️" },
          { label: "Registered Today", value: customers.filter((c: any) => dayjs(c.createdAt).isSame(dayjs(), "day")).length, icon: "🆕" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">{s.icon}</span>
            <div><p className="text-xs text-gray-500">{s.label}</p><p className="font-bold text-gray-900">{s.value}</p></div>
          </div>
        ))}
      </div>

      {/* Search + Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name, phone or email…"
              className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <span className="text-xs text-gray-400">{customers.length} customers</span>
        </div>

        {isLoading ? <PageSpinner /> : customers.length === 0 ? (
          <EmptyState icon="👥" title="No customers yet" sub="Register your first customer to track their purchases and history" />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Allergies</th>
                <th className="px-4 py-3">Registered</th>
                <th className="px-4 py-3 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {customers.map((c: any) => (
                <tr key={c.id} className="hover:bg-gray-50/60 transition-colors cursor-pointer" onClick={() => setSelected(c)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs flex-shrink-0">
                        {c.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{c.name}</p>
                        {c.dateOfBirth && <p className="text-xs text-gray-400">{dayjs().diff(dayjs(c.dateOfBirth), "year")} years old</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      {c.phone && <div className="flex items-center gap-1 text-xs text-gray-600"><Phone className="h-3 w-3" />{c.phone}</div>}
                      {c.email && <div className="flex items-center gap-1 text-xs text-gray-400"><Mail className="h-3 w-3" />{c.email}</div>}
                      {!c.phone && !c.email && <span className="text-gray-300 text-xs">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {c.allergies?.length > 0 ? (
                      <div className="flex items-center gap-1 flex-wrap">
                        <AlertTriangle className="h-3 w-3 text-orange-400 flex-shrink-0" />
                        {(c.allergies as string[]).slice(0, 2).map((a: string) => (
                          <Badge key={a} variant="warning">{a}</Badge>
                        ))}
                        {c.allergies.length > 2 && <span className="text-xs text-gray-400">+{c.allergies.length - 2}</span>}
                      </div>
                    ) : <span className="text-gray-300 text-xs">None</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{dayjs(c.createdAt).format("DD MMM YYYY")}</td>
                  <td className="px-4 py-3">
                    <button onClick={e => { e.stopPropagation(); setEditCustomer(c); }}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Customer detail modal */}
      {selected && (
        <Modal open={!!selected} onClose={() => setSelected(null)} title={selected.name} size="md">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Phone", value: selected.phone },
                { label: "Email", value: selected.email },
                { label: "Address", value: selected.address },
                { label: "Date of Birth", value: selected.dateOfBirth ? dayjs(selected.dateOfBirth).format("DD MMM YYYY") : null },
              ].filter(r => r.value).map(r => (
                <div key={r.label}>
                  <p className="text-xs text-gray-400 mb-0.5">{r.label}</p>
                  <p className="text-gray-800 font-medium">{r.value}</p>
                </div>
              ))}
            </div>

            {selected.allergies?.length > 0 && (
              <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
                <p className="text-xs font-semibold text-orange-700 mb-2 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Known Allergies
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.allergies.map((a: string) => <Badge key={a} variant="warning">{a}</Badge>)}
                </div>
              </div>
            )}

            {selected.notes && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Notes</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{selected.notes}</p>
              </div>
            )}

            <div className="flex justify-end">
              <button onClick={() => { setSelected(null); setEditCustomer(selected); }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition font-medium">
                <Edit2 className="h-3.5 w-3.5" /> Edit Profile
              </button>
            </div>
          </div>
        </Modal>
      )}

      <AddCustomerModal open={showAdd || !!editCustomer} onClose={() => { setShowAdd(false); setEditCustomer(null); }} editCustomer={editCustomer} />
    </div>
  );
}
