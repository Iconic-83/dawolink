"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ClipboardList, Search, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

const ENTITY_OPTIONS = ["", "Transaction", "InventoryItem", "Supplier", "PurchaseOrder", "User", "Pharmacy"];
const ACTION_OPTIONS = ["", "LOGIN", "SIGNUP", "SALE", "STOCK_ADDED", "STOCK_ADJUSTED", "SUPPLIER_CREATED", "PURCHASE_ORDER_CREATED"];

const ACTION_META: Record<string, { label: string; variant: "success" | "info" | "warning" | "danger" | "default" | "muted" }> = {
  LOGIN:                    { label: "Login",           variant: "info" },
  SIGNUP:                   { label: "Signup",          variant: "success" },
  SALE:                     { label: "Sale",            variant: "success" },
  STOCK_ADDED:              { label: "Stock Added",     variant: "info" },
  STOCK_ADJUSTED:           { label: "Stock Adjusted",  variant: "warning" },
  SUPPLIER_CREATED:         { label: "Supplier Added",  variant: "default" },
  PURCHASE_ORDER_CREATED:   { label: "Purchase Order",  variant: "default" },
};

function ActionBadge({ action }: { action: string }) {
  const meta = ACTION_META[action] ?? { label: action, variant: "muted" as const };
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AuditLogsPage() {
  const [entity, setEntity] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const params = new URLSearchParams();
  if (entity) params.set("entity", entity);
  if (action) params.set("action", action);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  params.set("limit", "200");

  const { data: logs = [], isLoading } = useQuery<any[]>({
    queryKey: ["audit-logs", entity, action, from, to],
    queryFn: () => api.get(`/v1/audit-logs?${params}`).then(r => r.data),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-sm text-gray-500 mt-0.5">Full activity trail — who did what, and when</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5">
          <ClipboardList className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-semibold text-blue-700">{logs.length} records</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-wrap gap-3 items-center">
        <div className="relative">
          <select value={entity} onChange={e => setEntity(e.target.value)} className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">All entities</option>
            {ENTITY_OPTIONS.filter(Boolean).map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
        </div>

        <div className="relative">
          <select value={action} onChange={e => setAction(e.target.value)} className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">All actions</option>
            {ACTION_OPTIONS.filter(Boolean).map(a => <option key={a} value={a}>{ACTION_META[a]?.label ?? a}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={from}
            onChange={e => setFrom(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-400 text-sm">—</span>
          <input
            type="date"
            value={to}
            onChange={e => setTo(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {(entity || action || from || to) && (
          <button onClick={() => { setEntity(""); setAction(""); setFrom(""); setTo(""); }} className="text-xs text-gray-500 hover:text-red-500 transition">
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Loading…</div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <ClipboardList className="h-8 w-8 text-gray-200" />
            <p className="text-gray-400 text-sm">No audit events match the current filters</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Details</th>
                <th className="px-4 py-3 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.map((log: any) => (
                <>
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50/60 transition-colors cursor-pointer"
                    onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                  >
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      <span title={new Date(log.createdAt).toLocaleString()}>{timeAgo(log.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-700 font-medium">{log.entity}</span>
                      {log.entityId && (
                        <span className="text-xs text-gray-400 font-mono ml-1.5 truncate max-w-[80px] inline-block align-middle">
                          {log.entityId.slice(-8)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {log.user ? (
                        <span className="text-gray-700">{log.user.firstName} {log.user.lastName}</span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">
                      {log.newValue
                        ? Object.entries(log.newValue as Record<string, any>)
                            .filter(([, v]) => v !== null && v !== undefined)
                            .slice(0, 3)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(" · ")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded === log.id ? "rotate-180" : ""}`} />
                    </td>
                  </tr>

                  {expanded === log.id && (
                    <tr key={`${log.id}-detail`} className="bg-gray-50">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="text-gray-400 font-medium uppercase tracking-wide mb-1.5">Event Info</p>
                            <dl className="space-y-1">
                              <div className="flex gap-2"><dt className="text-gray-400 w-20">Action</dt><dd className="text-gray-700">{log.action}</dd></div>
                              <div className="flex gap-2"><dt className="text-gray-400 w-20">Entity</dt><dd className="text-gray-700">{log.entity}</dd></div>
                              <div className="flex gap-2"><dt className="text-gray-400 w-20">Entity ID</dt><dd className="text-gray-700 font-mono">{log.entityId ?? "—"}</dd></div>
                              <div className="flex gap-2"><dt className="text-gray-400 w-20">IP</dt><dd className="text-gray-700">{log.ipAddress ?? "—"}</dd></div>
                              <div className="flex gap-2"><dt className="text-gray-400 w-20">Time</dt><dd className="text-gray-700">{new Date(log.createdAt).toLocaleString()}</dd></div>
                            </dl>
                          </div>
                          {(log.newValue || log.oldValue) && (
                            <div>
                              <p className="text-gray-400 font-medium uppercase tracking-wide mb-1.5">Payload</p>
                              {log.oldValue && (
                                <div className="mb-2">
                                  <p className="text-xs text-gray-400 mb-1">Before</p>
                                  <pre className="bg-white rounded-lg border border-gray-200 p-2 text-xs text-gray-600 overflow-auto max-h-24">
                                    {JSON.stringify(log.oldValue, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.newValue && (
                                <div>
                                  <p className="text-xs text-gray-400 mb-1">After</p>
                                  <pre className="bg-white rounded-lg border border-gray-200 p-2 text-xs text-gray-600 overflow-auto max-h-24">
                                    {JSON.stringify(log.newValue, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
