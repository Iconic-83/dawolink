"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner";
import { Loader2, Copy, Check, Mail, ExternalLink } from "lucide-react";

const ROLES = [
  { value: "BRANCH_MANAGER",  label: "Branch Manager",  icon: "🏢", perms: ["Manage branch", "View branch reports", "Approve transfers"] },
  { value: "PHARMACIST",      label: "Pharmacist",       icon: "💊", perms: ["POS access", "Inventory view", "Dispensing"] },
  { value: "CASHIER",         label: "Cashier",          icon: "💳", perms: ["POS access", "Process transactions"] },
  { value: "INVENTORY_STAFF", label: "Inventory Staff",  icon: "📦", perms: ["Inventory management", "Stock adjustments"] },
  { value: "AUDITOR",         label: "Auditor",          icon: "📋", perms: ["View all reports", "Audit logs (read-only)"] },
  { value: "PHARMACY_OWNER",  label: "Pharmacy Owner",   icon: "🏪", perms: ["Full pharmacy access", "Manage staff", "View all reports"] },
];

export function InviteStaffModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("PHARMACIST");
  const [branchId, setBranchId] = useState("");
  const [result, setResult] = useState<{ inviteUrl: string; emailSent: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: branches = [] } = useQuery<any[]>({
    queryKey: ["branches"],
    queryFn: () => api.get("/v1/pharmacy/branches").then(r => r.data),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: () => api.post("/v1/pharmacy/invites", {
      email: email.trim(), role, branchId: branchId || undefined,
    }).then(r => r.data),
    onSuccess: (data) => {
      setResult({ inviteUrl: data.inviteUrl, emailSent: data.emailSent });
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed to create invite"),
  });

  async function copyLink() {
    if (!result) return;
    await navigator.clipboard.writeText(result.inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function reset() {
    setEmail(""); setRole("PHARMACIST"); setBranchId("");
    setResult(null); setCopied(false);
  }

  const selectedRole = ROLES.find(r => r.value === role);
  const inp = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Invite Staff Member" size="md">
      {result ? (
        /* ── Success state ── */
        <div className="space-y-5">
          <div className="text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="h-7 w-7 text-green-600" />
            </div>
            <p className="font-semibold text-gray-900">Invite created!</p>
            <p className="text-sm text-gray-500 mt-1">
              {result.emailSent
                ? `An invitation email was sent to ${email}.`
                : `Share this link with ${email} — no email was sent (SMTP not configured).`}
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
            <p className="text-xs font-semibold text-gray-500 mb-2">Invite link (expires in 7 days)</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={result.inviteUrl}
                className="flex-1 min-w-0 px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white font-mono text-gray-600 focus:outline-none"
              />
              <button
                onClick={copyLink}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition flex-shrink-0 ${
                  copied ? "bg-green-100 text-green-700" : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {copied ? <><Check className="h-3.5 w-3.5" /> Copied!</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center">
            You can also share this via WhatsApp, SMS, or any messaging app.
          </p>

          <div className="flex gap-3 pt-1">
            <button onClick={reset} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">
              Invite another
            </button>
            <button onClick={() => { reset(); onClose(); }} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
              Done
            </button>
          </div>
        </div>
      ) : (
        /* ── Form state ── */
        <div className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="staff@pharmacy.so"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Role grid */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`text-left p-3 rounded-xl border-2 transition ${
                    role === r.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-100 bg-gray-50 hover:border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{r.icon}</span>
                    <span className="text-xs font-semibold text-gray-800">{r.label}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Permissions preview */}
            {selectedRole && (
              <div className="mt-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-xs font-semibold text-blue-700 mb-1.5">{selectedRole.label} can:</p>
                <div className="flex flex-wrap gap-1">
                  {selectedRole.perms.map(p => (
                    <span key={p} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{p}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Branch */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Assign to branch</label>
            <select value={branchId} onChange={e => setBranchId(e.target.value)} className={inp}>
              <option value="">All branches</option>
              {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => { reset(); onClose(); }} className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900">
              Cancel
            </button>
            <button
              onClick={() => mutate()}
              disabled={isPending || !email.trim()}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 transition"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
              Send Invite
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
