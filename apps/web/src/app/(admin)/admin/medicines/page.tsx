"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";

const MEDICINE_FORMS = ["TABLET","CAPSULE","SYRUP","INJECTION","CREAM","DROPS","INHALER","POWDER","SUPPOSITORY","PATCH","OTHER"];

export default function GlobalMedicinesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", genericName: "", category: "", form: "TABLET", strength: "", manufacturer: "", requiresPrescription: false, description: "" });

  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : "";
  const headers = { Authorization: `Bearer ${token}` };

  function load(query = q) {
    setLoading(true);
    api.get(`/v1/global-medicines?q=${query}&limit=30`, { headers })
      .then(r => { setItems(r.data.items); setTotal(r.data.total); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    try {
      await api.post("/v1/global-medicines", form, { headers });
      setShowAdd(false);
      setForm({ name: "", genericName: "", category: "", form: "TABLET", strength: "", manufacturer: "", requiresPrescription: false, description: "" });
      load();
    } catch (err: any) {
      alert(err.response?.data?.message || "Error adding medicine");
    } finally {
      setAdding(false);
    }
  }

  async function handleFlag(id: string, flagged: boolean) {
    if (flagged) {
      await api.patch(`/v1/global-medicines/${id}/unflag`, {}, { headers });
    } else {
      const reason = prompt("Reason for flagging:");
      if (!reason) return;
      await api.patch(`/v1/global-medicines/${id}/flag`, { reason }, { headers });
    }
    load();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#180D62" }}>Global Medicine Database</h1>
          <p className="text-sm mt-1" style={{ color: "#6B6B9A" }}>{total} medicines in platform catalog</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: "linear-gradient(90deg, #00C897, #009E78)" }}>
          + Add Medicine
        </button>
      </div>

      <div className="mb-4 flex gap-3">
        <input
          type="text" placeholder="Search medicines..." value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === "Enter" && load(q)}
          className="w-full max-w-sm px-4 py-2 rounded-xl text-sm outline-none"
          style={{ border: "1px solid #E8E4FF", background: "white" }}
        />
        <button onClick={() => load(q)} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: "#E8E4FF", color: "#2D1B8E" }}>Search</button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{ border: "1px solid #E8E4FF" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid #E8E4FF" }}>
              {["Medicine", "Generic Name", "Category", "Form", "Manufacturer", "Status", "Actions"].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "#2D1B8E" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-5 py-8 text-center" style={{ color: "#9B9BC0" }}>Loading...</td></tr>
            ) : !items.length ? (
              <tr><td colSpan={7} className="px-5 py-8 text-center" style={{ color: "#9B9BC0" }}>No medicines found. Add the first one!</td></tr>
            ) : items.map((m: any) => (
              <tr key={m.id} className="border-b last:border-0" style={{ borderColor: "#E8E4FF" }}>
                <td className="px-5 py-3 font-medium" style={{ color: "#180D62" }}>{m.name}</td>
                <td className="px-5 py-3" style={{ color: "#6B6B9A" }}>{m.genericName}</td>
                <td className="px-5 py-3"><span className="px-2 py-0.5 rounded-full text-xs" style={{ background: "#E8E4FF", color: "#2D1B8E" }}>{m.category}</span></td>
                <td className="px-5 py-3 text-xs" style={{ color: "#6B6B9A" }}>{m.form}</td>
                <td className="px-5 py-3 text-xs" style={{ color: "#6B6B9A" }}>{m.manufacturer ?? "—"}</td>
                <td className="px-5 py-3">
                  {m.isFlagged
                    ? <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}>Flagged</span>
                    : <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(0,200,151,0.1)", color: "#00C897" }}>Active</span>}
                </td>
                <td className="px-5 py-3">
                  <button onClick={() => handleFlag(m.id, m.isFlagged)} className="text-xs px-2 py-1 rounded-lg" style={{ background: m.isFlagged ? "rgba(0,200,151,0.1)" : "rgba(239,68,68,0.1)", color: m.isFlagged ? "#00C897" : "#EF4444" }}>
                    {m.isFlagged ? "Unflag" : "Flag"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(24,13,98,0.6)" }}>
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <h2 className="text-lg font-bold mb-5" style={{ color: "#180D62" }}>Add to Global Catalog</h2>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "name", label: "Brand Name" },
                  { key: "genericName", label: "Generic Name" },
                  { key: "category", label: "Category" },
                  { key: "strength", label: "Strength (optional)" },
                  { key: "manufacturer", label: "Manufacturer (optional)" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium mb-1" style={{ color: "#6B6B9A" }}>{f.label}</label>
                    <input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      required={!f.label.includes("optional")}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ border: "1px solid #E8E4FF" }} />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#6B6B9A" }}>Form</label>
                  <select value={form.form} onChange={e => setForm(p => ({ ...p, form: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ border: "1px solid #E8E4FF" }}>
                    {MEDICINE_FORMS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#6B6B9A" }}>Description (optional)</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={2} className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none" style={{ border: "1px solid #E8E4FF" }} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.requiresPrescription} onChange={e => setForm(p => ({ ...p, requiresPrescription: e.target.checked }))} style={{ accentColor: "#00C897" }} />
                <span className="text-sm" style={{ color: "#374151" }}>Requires Prescription</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ border: "1px solid #E8E4FF", color: "#6B6B9A" }}>Cancel</button>
                <button type="submit" disabled={adding} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60" style={{ background: "linear-gradient(90deg, #00C897, #009E78)" }}>
                  {adding ? "Adding..." : "Add Medicine"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
