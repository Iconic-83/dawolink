"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function PharmaciesPage() {
  const [data, setData] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", phone: "", address: "", city: "", ownerEmail: "", ownerFirstName: "", ownerLastName: "", ownerPassword: "" });

  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : "";
  const headers = { Authorization: `Bearer ${token}` };

  function load(q = search) {
    setLoading(true);
    api.get(`/v1/admin/pharmacies?search=${q}`, { headers })
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleSuspend(id: string, active: boolean) {
    await api.patch(`/v1/admin/pharmacies/${id}/${active ? "suspend" : "activate"}`, {}, { headers });
    load();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post("/v1/admin/pharmacies", form, { headers });
      setShowCreate(false);
      setForm({ name: "", slug: "", phone: "", address: "", city: "", ownerEmail: "", ownerFirstName: "", ownerLastName: "", ownerPassword: "" });
      load();
    } catch (err: any) {
      alert(err.response?.data?.message || "Error creating pharmacy");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#180D62" }}>Pharmacies</h1>
          <p className="text-sm mt-1" style={{ color: "#6B6B9A" }}>{data?.total ?? 0} registered tenants</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: "linear-gradient(90deg, #00C897, #009E78)" }}>
          + New Pharmacy
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search pharmacies..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === "Enter" && load(search)}
          className="w-full max-w-xs px-4 py-2 rounded-xl text-sm outline-none"
          style={{ border: "1px solid #E8E4FF", background: "white" }}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{ border: "1px solid #E8E4FF" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid #E8E4FF" }}>
              {["Pharmacy", "City", "Plan", "Branches", "Users", "Status", "Actions"].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "#2D1B8E" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-5 py-8 text-center" style={{ color: "#9B9BC0" }}>Loading...</td></tr>
            ) : !data?.pharmacies?.length ? (
              <tr><td colSpan={7} className="px-5 py-8 text-center" style={{ color: "#9B9BC0" }}>No pharmacies found</td></tr>
            ) : data.pharmacies.map((p: any) => (
              <tr key={p.id} className="border-b last:border-0" style={{ borderColor: "#E8E4FF" }}>
                <td className="px-5 py-3">
                  <div className="font-medium" style={{ color: "#180D62" }}>{p.name}</div>
                  <div className="text-xs" style={{ color: "#9B9BC0" }}>/{p.slug}</div>
                </td>
                <td className="px-5 py-3" style={{ color: "#6B6B9A" }}>{p.city}</td>
                <td className="px-5 py-3">
                  <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ background: "#E8E4FF", color: "#2D1B8E" }}>{p.plan}</span>
                </td>
                <td className="px-5 py-3 text-center" style={{ color: "#6B6B9A" }}>{p._count?.branches ?? 0}</td>
                <td className="px-5 py-3 text-center" style={{ color: "#6B6B9A" }}>{p._count?.users ?? 0}</td>
                <td className="px-5 py-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: p.isActive ? "#00C897" : "#EF4444" }} />
                    <span className="text-xs" style={{ color: p.isActive ? "#00C897" : "#EF4444" }}>{p.isActive ? "Active" : "Suspended"}</span>
                  </span>
                </td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => handleSuspend(p.id, p.isActive)}
                    className="text-xs px-3 py-1 rounded-lg font-medium"
                    style={p.isActive
                      ? { background: "rgba(239,68,68,0.1)", color: "#EF4444" }
                      : { background: "rgba(0,200,151,0.1)", color: "#00C897" }}
                  >
                    {p.isActive ? "Suspend" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(24,13,98,0.6)" }}>
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <h2 className="text-lg font-bold mb-5" style={{ color: "#180D62" }}>Create New Pharmacy</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "name", label: "Pharmacy Name", placeholder: "Medina Pharmacy" },
                  { key: "slug", label: "Slug", placeholder: "medina-pharmacy" },
                  { key: "phone", label: "Phone", placeholder: "+252..." },
                  { key: "city", label: "City", placeholder: "Mogadishu" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium mb-1" style={{ color: "#6B6B9A" }}>{f.label}</label>
                    <input
                      value={(form as any)[f.key]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      required
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ border: "1px solid #E8E4FF" }}
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#6B6B9A" }}>Address</label>
                <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Full address" required className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ border: "1px solid #E8E4FF" }} />
              </div>
              <div className="pt-2 border-t" style={{ borderColor: "#E8E4FF" }}>
                <p className="text-xs font-semibold mb-3" style={{ color: "#2D1B8E" }}>Owner Account</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "ownerFirstName", label: "First Name" },
                    { key: "ownerLastName", label: "Last Name" },
                    { key: "ownerEmail", label: "Email", type: "email" },
                    { key: "ownerPassword", label: "Password", type: "password" },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-medium mb-1" style={{ color: "#6B6B9A" }}>{f.label}</label>
                      <input
                        type={f.type ?? "text"}
                        value={(form as any)[f.key]}
                        onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        required
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                        style={{ border: "1px solid #E8E4FF" }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ border: "1px solid #E8E4FF", color: "#6B6B9A" }}>Cancel</button>
                <button type="submit" disabled={creating} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60" style={{ background: "linear-gradient(90deg, #00C897, #009E78)" }}>
                  {creating ? "Creating..." : "Create Pharmacy"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
