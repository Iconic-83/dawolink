"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";

type Permission = { id: string; key: string; label: string; module: string };
type CustomRole = { id: string; name: string; description: string; isSystem: boolean; _count: { users: number }; permissions: { permission: Permission }[] };

const MODULE_COLORS: Record<string, string> = {
  pos: "#00C897", inventory: "#2D1B8E", analytics: "#4A8FE5",
  suppliers: "#F59E0B", staff: "#EC4899", settings: "#8B5CF6",
  branches: "#06B6D4", customers: "#10B981", transfers: "#F97316",
};

export default function RolesPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<CustomRole | null>(null);
  const [form, setForm] = useState({ name: "", description: "", permissionKeys: [] as string[] });

  const { data: permissions = [] } = useQuery<Permission[]>({
    queryKey: ["permissions"],
    queryFn: () => api.get("/v1/rbac/permissions").then(r => r.data),
  });

  const { data: roles = [] } = useQuery<CustomRole[]>({
    queryKey: ["roles"],
    queryFn: () => api.get("/v1/rbac/roles").then(r => r.data),
  });

  const createRole = useMutation({
    mutationFn: (data: typeof form) => api.post("/v1/rbac/roles", data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["roles"] }); setShowCreate(false); resetForm(); },
  });

  const updateRole = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof form }) => api.put(`/v1/rbac/roles/${id}`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["roles"] }); setEditing(null); resetForm(); },
  });

  const deleteRole = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/rbac/roles/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles"] }),
  });

  function resetForm() { setForm({ name: "", description: "", permissionKeys: [] }); }

  function openEdit(role: CustomRole) {
    setEditing(role);
    setForm({ name: role.name, description: role.description ?? "", permissionKeys: role.permissions.map(rp => rp.permission.key) });
  }

  function togglePerm(key: string) {
    setForm(f => ({
      ...f,
      permissionKeys: f.permissionKeys.includes(key) ? f.permissionKeys.filter(k => k !== key) : [...f.permissionKeys, key],
    }));
  }

  const byModule = permissions.reduce((acc, p) => {
    (acc[p.module] ??= []).push(p);
    return acc;
  }, {} as Record<string, Permission[]>);

  const modalOpen = showCreate || !!editing;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#180D62" }}>Roles & Permissions</h1>
          <p className="text-sm mt-1" style={{ color: "#6B6B9A" }}>Control what each employee can do</p>
        </div>
        <button onClick={() => { resetForm(); setShowCreate(true); }}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(90deg, #00C897, #009E78)" }}>
          + New Role
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map(role => (
          <div key={role.id} className="bg-white rounded-2xl p-5 shadow-sm" style={{ border: "1px solid #E8E4FF" }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold" style={{ color: "#180D62" }}>{role.name}</h3>
                  {role.isSystem && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#E8E4FF", color: "#2D1B8E" }}>Default</span>
                  )}
                </div>
                <p className="text-xs mt-0.5" style={{ color: "#9B9BC0" }}>{role._count.users} users · {role.permissions.length} permissions</p>
              </div>
              {!role.isSystem && (
                <div className="flex gap-1">
                  <button onClick={() => openEdit(role)} className="text-xs px-2 py-1 rounded-lg" style={{ background: "#E8E4FF", color: "#2D1B8E" }}>Edit</button>
                  <button onClick={() => deleteRole.mutate(role.id)} className="text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}>Del</button>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {Object.entries(
                role.permissions.reduce((acc, rp) => {
                  acc[rp.permission.module] = (acc[rp.permission.module] ?? 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([mod, count]) => (
                <span key={mod} className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: `${MODULE_COLORS[mod] ?? "#6B6B9A"}18`, color: MODULE_COLORS[mod] ?? "#6B6B9A" }}>
                  {mod} ({count})
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(24,13,98,0.6)" }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <h2 className="text-lg font-bold mb-5" style={{ color: "#180D62" }}>
              {editing ? "Edit Role" : "Create Role"}
            </h2>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#6B6B9A" }}>Role Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Senior Pharmacist"
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ border: "1px solid #E8E4FF" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#6B6B9A" }}>Description (optional)</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ border: "1px solid #E8E4FF" }} />
              </div>
            </div>

            <div className="mb-5">
              <p className="text-sm font-semibold mb-3" style={{ color: "#2D1B8E" }}>
                Permissions ({form.permissionKeys.length} selected)
              </p>
              <div className="space-y-4">
                {Object.entries(byModule).map(([mod, perms]) => (
                  <div key={mod}>
                    <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: MODULE_COLORS[mod] ?? "#6B6B9A" }}>{mod}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {perms.map(p => (
                        <label key={p.key} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                          <input type="checkbox" checked={form.permissionKeys.includes(p.key)} onChange={() => togglePerm(p.key)}
                            className="rounded" style={{ accentColor: "#00C897" }} />
                          <span className="text-xs" style={{ color: "#374151" }}>{p.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setShowCreate(false); setEditing(null); resetForm(); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ border: "1px solid #E8E4FF", color: "#6B6B9A" }}>
                Cancel
              </button>
              <button
                onClick={() => editing ? updateRole.mutate({ id: editing.id, data: form }) : createRole.mutate(form)}
                disabled={!form.name || createRole.isPending || updateRole.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: "linear-gradient(90deg, #00C897, #009E78)" }}>
                {createRole.isPending || updateRole.isPending ? "Saving..." : editing ? "Save Changes" : "Create Role"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
