"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { AddStaffModal } from "@/components/staff/AddStaffModal";
import { EditStaffModal } from "@/components/staff/EditStaffModal";
import { InviteStaffModal } from "@/components/staff/InviteStaffModal";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageSpinner } from "@/components/ui/Spinner";
import { toast } from "sonner";
import {
  Plus, Search, Edit2, UserX, UserCheck,
  Shield, Clock, Building2, Mail, Trash2, Send,
} from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const ROLE_META: Record<string, { label: string; variant: any; icon: string }> = {
  SUPER_ADMIN:     { label: "Super Admin",     variant: "danger",  icon: "👑" },
  PHARMACY_OWNER:  { label: "Owner",           variant: "info",    icon: "🏪" },
  BRANCH_MANAGER:  { label: "Branch Manager",  variant: "info",    icon: "🏢" },
  PHARMACIST:      { label: "Pharmacist",      variant: "success", icon: "💊" },
  CASHIER:         { label: "Cashier",         variant: "default", icon: "💳" },
  INVENTORY_STAFF: { label: "Inventory",       variant: "warning", icon: "📦" },
  AUDITOR:         { label: "Auditor",         variant: "muted",   icon: "📋" },
};

const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN:     ["Full system access", "Manage all pharmacies"],
  PHARMACY_OWNER:  ["Full pharmacy access", "Manage staff", "View all reports"],
  BRANCH_MANAGER:  ["Manage branch", "View branch reports", "Approve transfers"],
  PHARMACIST:      ["POS access", "Inventory view", "Dispensing"],
  CASHIER:         ["POS access", "Process transactions"],
  INVENTORY_STAFF: ["Inventory management", "Stock adjustments"],
  AUDITOR:         ["View all reports", "Audit logs (read-only)"],
};

export default function StaffPage() {
  const user = useAuthStore(s => s.user);
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [editStaff, setEditStaff] = useState<any>(null);

  const { data: staff = [], isLoading } = useQuery<any[]>({
    queryKey: ["staff"],
    queryFn: () => api.get("/v1/pharmacy/staff").then(r => r.data),
  });

  const { data: invites = [] } = useQuery<any[]>({
    queryKey: ["staff-invites"],
    queryFn: () => api.get("/v1/pharmacy/invites").then(r => r.data),
  });

  const { mutate: revokeInvite } = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/pharmacy/invites/${id}`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["staff-invites"] }); toast.success("Invite revoked"); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed"),
  });

  const { mutate: toggleStatus } = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.patch(`/v1/pharmacy/staff/${id}/${active ? "reactivate" : "deactivate"}`).then(r => r.data),
    onSuccess: (_, { active }) => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      toast.success(active ? "Staff member reactivated" : "Staff member deactivated");
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Action failed"),
  });

  const filtered = staff.filter((s: any) => {
    const matchSearch = !search ||
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || s.role === roleFilter;
    return matchSearch && matchRole;
  });

  const activeCount   = staff.filter((s: any) => s.isActive).length;
  const roles = Array.from(new Set(staff.map((s: any) => s.role as string)));

  const roleGroups = Object.entries(ROLE_META).map(([role, meta]) => ({
    ...meta,
    role,
    count: staff.filter((s: any) => s.role === role && s.isActive).length,
  })).filter(r => r.count > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage team members, roles & access</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 px-4 py-2 border border-blue-200 text-blue-600 hover:bg-blue-50 text-sm font-medium rounded-xl transition"
          >
            <Send className="h-4 w-4" />
            Invite by Email
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition"
          >
            <Plus className="h-4 w-4" />
            Add Staff
          </button>
        </div>
      </div>

      {/* Stats + Role breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3 lg:col-span-1">
          {[
            { label: "Total Staff",  value: staff.length,                        icon: "👥" },
            { label: "Active",       value: activeCount,                         icon: "✅" },
            { label: "Inactive",     value: staff.length - activeCount,          icon: "⏸️" },
            { label: "Roles",        value: roles.length,                        icon: "🎭" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3">
              <span className="text-xl">{s.icon}</span>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="font-bold text-gray-900">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Role breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 lg:col-span-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Team by Role</p>
          <div className="flex flex-wrap gap-2">
            {roleGroups.map(r => (
              <button
                key={r.role}
                onClick={() => setRoleFilter(roleFilter === r.role ? "" : r.role)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                  roleFilter === r.role
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:border-blue-200"
                }`}
              >
                <span>{r.icon}</span>
                <span>{r.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                  roleFilter === r.role ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
                }`}>{r.count}</span>
              </button>
            ))}
          </div>

          {/* Permissions reference */}
          {roleFilter && ROLE_PERMISSIONS[roleFilter] && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 font-medium mb-1.5 flex items-center gap-1">
                <Shield className="h-3 w-3" /> {ROLE_META[roleFilter]?.label} permissions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ROLE_PERMISSIONS[roleFilter].map(p => (
                  <span key={p} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{p}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pending invites */}
      {invites.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-100 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-100 bg-amber-50">
            <Mail className="h-4 w-4 text-amber-600" />
            <p className="text-sm font-semibold text-amber-800">{invites.length} pending invite{invites.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="divide-y divide-gray-50">
            {invites.map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{inv.email}</p>
                    <p className="text-xs text-gray-400">
                      {ROLE_META[inv.role]?.icon} {ROLE_META[inv.role]?.label ?? inv.role}
                      {" · "}Invited by {inv.invitedBy?.firstName} {inv.invitedBy?.lastName}
                      {" · "}Expires {dayjs(inv.expiresAt).fromNow()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => revokeInvite(inv.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                  title="Revoke invite"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <span className="text-xs text-gray-400 ml-auto">
            {filtered.length} of {staff.length} staff
          </span>
        </div>

        {isLoading ? <PageSpinner /> : filtered.length === 0 ? (
          <EmptyState icon="👥" title="No staff found" sub="Add your first team member to get started" />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">Staff Member</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Last Login</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((member: any) => {
                const meta = ROLE_META[member.role] ?? { label: member.role, variant: "default", icon: "👤" };
                const isSelf = member.id === user?.id;
                return (
                  <tr key={member.id} className={`hover:bg-gray-50/60 transition-colors ${!member.isActive ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {member.firstName[0]}{member.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {member.firstName} {member.lastName}
                            {isSelf && <span className="ml-1.5 text-xs text-blue-500 font-normal">(you)</span>}
                          </p>
                          <p className="text-xs text-gray-400">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{meta.icon}</span>
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {member.branch?.name ? (
                        <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                          <Building2 className="h-3 w-3 text-gray-400" />
                          {member.branch.name}
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs">All branches</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {member.phone ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {member.lastLoginAt ? (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3 text-gray-300" />
                          {dayjs(member.lastLoginAt).fromNow()}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">Never</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={member.isActive ? "success" : "muted"}>
                        {member.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => setEditStaff(member)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        {!isSelf && (
                          <button
                            onClick={() => toggleStatus({ id: member.id, active: !member.isActive })}
                            className={`p-1.5 rounded-lg transition ${
                              member.isActive
                                ? "text-gray-400 hover:text-red-500 hover:bg-red-50"
                                : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                            }`}
                            title={member.isActive ? "Deactivate" : "Reactivate"}
                          >
                            {member.isActive
                              ? <UserX className="h-3.5 w-3.5" />
                              : <UserCheck className="h-3.5 w-3.5" />
                            }
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <AddStaffModal open={showAdd} onClose={() => setShowAdd(false)} pharmacyId={user?.pharmacyId ?? ""} />
      <EditStaffModal open={!!editStaff} onClose={() => setEditStaff(null)} staff={editStaff} />
      <InviteStaffModal open={showInvite} onClose={() => setShowInvite(false)} />
    </div>
  );
}
