"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  TABLET:      { bg: "#E8E4FF", color: "#2D1B8E", label: "Tablet" },
  CAPSULE:     { bg: "#E8E4FF", color: "#2D1B8E", label: "Capsule" },
  SYRUP:       { bg: "#E0F7EF", color: "#007A5E", label: "Syrup" },
  INJECTION:   { bg: "#FEF3C7", color: "#92400E", label: "Injection" },
  CREAM:       { bg: "#FCE7F3", color: "#9D174D", label: "Cream" },
  DROPS:       { bg: "#DBEAFE", color: "#1E40AF", label: "Drops" },
  INHALER:     { bg: "#FEE2E2", color: "#991B1B", label: "Inhaler" },
  POWDER:      { bg: "#F3F4F6", color: "#374151", label: "Powder" },
  SUPPOSITORY: { bg: "#F3F4F6", color: "#374151", label: "Suppository" },
  PATCH:       { bg: "#ECFDF5", color: "#065F46", label: "Patch" },
  OTHER:       { bg: "#F3F4F6", color: "#374151", label: "Other" },
};

function FormBadge({ form }: { form: string }) {
  const s = STATUS_COLORS[form] ?? STATUS_COLORS.OTHER;
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function PendingMedicinesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 30;

  // Reject modal state
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [rejectPending, setRejectPending] = useState(false);

  // Per-row action state
  const [acting, setActing] = useState<Record<string, "verify" | "reject" | null>>({});

  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : "";
  const headers = { Authorization: `Bearer ${token}` };

  const load = useCallback((query = q, p = page) => {
    setLoading(true);
    api.get(`/v1/admin/medicines/pending?q=${query}&page=${p}&limit=${limit}`, { headers })
      .then(r => { setItems(r.data.medicines); setTotal(r.data.total); setLoading(false); })
      .catch(() => setLoading(false));
  }, [q, page]);

  useEffect(() => { load(); }, [page]);

  async function handleVerify(m: any) {
    setActing(a => ({ ...a, [m.id]: "verify" }));
    try {
      await api.patch(`/v1/admin/medicines/${m.id}/verify`, {}, { headers });
      setItems(prev => prev.filter(x => x.id !== m.id));
      setTotal(t => t - 1);
    } catch {
      // stay in list on error
    } finally {
      setActing(a => ({ ...a, [m.id]: null }));
    }
  }

  async function handleRejectSubmit() {
    if (!rejectTarget || !rejectNotes.trim()) return;
    setRejectPending(true);
    try {
      await api.patch(`/v1/admin/medicines/${rejectTarget.id}/reject`, { notes: rejectNotes }, { headers });
      setItems(prev => prev.filter(x => x.id !== rejectTarget.id));
      setTotal(t => t - 1);
      setRejectTarget(null);
      setRejectNotes("");
    } catch {
      // stay open on error
    } finally {
      setRejectPending(false);
    }
  }

  const pages = Math.ceil(total / limit);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#180D62" }}>Pending Verification</h1>
          <p className="text-sm mt-1" style={{ color: "#6B6B9A" }}>
            {total === 0
              ? "All caught up — no medicines awaiting review"
              : `${total} medicine${total !== 1 ? "s" : ""} added by pharmacies during receiving, waiting for admin review`}
          </p>
        </div>
        {total > 0 && (
          <span className="px-3 py-1.5 rounded-full text-sm font-bold" style={{ background: "rgba(239,68,68,0.1)", color: "#DC2626" }}>
            {total} pending
          </span>
        )}
      </div>

      {/* Info banner */}
      <div className="mb-5 px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(0,200,151,0.08)", border: "1px solid rgba(0,200,151,0.2)", color: "#005C44" }}>
        <strong>Operations are not blocked.</strong> These medicines are already active in inventory. Review is for data quality — verify correct entries, reject or correct duplicates/errors.
      </div>

      {/* Search */}
      <div className="mb-4 flex gap-3">
        <input
          type="text"
          placeholder="Search by name or generic name…"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { setPage(1); load(q, 1); } }}
          className="w-full max-w-sm px-4 py-2 rounded-xl text-sm outline-none"
          style={{ border: "1px solid #E8E4FF", background: "white" }}
        />
        <button
          onClick={() => { setPage(1); load(q, 1); }}
          className="px-4 py-2 rounded-xl text-sm font-medium"
          style={{ background: "#E8E4FF", color: "#2D1B8E" }}
        >
          Search
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{ border: "1px solid #E8E4FF" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid #E8E4FF" }}>
              {["Medicine", "Generic Name", "Category", "Form", "Pharmacy", "Submitted", "Actions"].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "#2D1B8E" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center" style={{ color: "#9B9BC0" }}>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: "#00C897" }} />
                    Loading…
                  </div>
                </td>
              </tr>
            ) : !items.length ? (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center" style={{ color: "#9B9BC0" }}>
                  <div className="text-4xl mb-3">✓</div>
                  <p className="font-medium" style={{ color: "#180D62" }}>Nothing to review</p>
                  <p className="text-xs mt-1">All medicines have been verified</p>
                </td>
              </tr>
            ) : items.map((m: any) => (
              <tr key={m.id} className="border-b last:border-0 hover:bg-gray-50/50 transition" style={{ borderColor: "#F3F0FF" }}>
                <td className="px-5 py-3">
                  <div className="font-semibold" style={{ color: "#180D62" }}>{m.name}</div>
                  {m.strength && <div className="text-xs mt-0.5" style={{ color: "#9B9BC0" }}>{m.strength}</div>}
                </td>
                <td className="px-5 py-3" style={{ color: "#6B6B9A" }}>{m.genericName ?? "—"}</td>
                <td className="px-5 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: "#E8E4FF", color: "#2D1B8E" }}>
                    {m.category}
                  </span>
                </td>
                <td className="px-5 py-3"><FormBadge form={m.form} /></td>
                <td className="px-5 py-3">
                  <div className="font-medium text-xs" style={{ color: "#180D62" }}>{m.pharmacy?.name}</div>
                  {m.pharmacy?.city && (
                    <div className="text-xs mt-0.5" style={{ color: "#9B9BC0" }}>{m.pharmacy.city}</div>
                  )}
                </td>
                <td className="px-5 py-3 text-xs" style={{ color: "#9B9BC0" }}>{timeAgo(m.createdAt)}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleVerify(m)}
                      disabled={acting[m.id] === "verify"}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1"
                      style={{ background: "rgba(0,200,151,0.12)", color: "#007A5E" }}
                    >
                      {acting[m.id] === "verify" ? (
                        <span className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin inline-block" />
                      ) : "✓"} Verify
                    </button>
                    <button
                      onClick={() => { setRejectTarget(m); setRejectNotes(""); }}
                      disabled={!!acting[m.id]}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                      style={{ background: "rgba(239,68,68,0.1)", color: "#DC2626" }}
                    >
                      ✕ Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span style={{ color: "#6B6B9A" }}>
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 rounded-lg disabled:opacity-40"
              style={{ border: "1px solid #E8E4FF", color: "#2D1B8E" }}
            >
              ← Prev
            </button>
            <button
              disabled={page >= pages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 rounded-lg disabled:opacity-40"
              style={{ border: "1px solid #E8E4FF", color: "#2D1B8E" }}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(24,13,98,0.6)" }}
          onClick={e => { if (e.target === e.currentTarget) setRejectTarget(null); }}
        >
          <div className="bg-white rounded-2xl p-7 w-full max-w-md mx-4 shadow-2xl">
            <h2 className="text-lg font-bold mb-1" style={{ color: "#180D62" }}>Reject Medicine</h2>
            <p className="text-sm mb-4" style={{ color: "#6B6B9A" }}>
              <strong style={{ color: "#180D62" }}>{rejectTarget.name}</strong>
              {rejectTarget.strength ? ` ${rejectTarget.strength}` : ""}
              {" "}— {rejectTarget.pharmacy?.name}
            </p>

            <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>
              Rejection reason *
            </label>
            <textarea
              value={rejectNotes}
              onChange={e => setRejectNotes(e.target.value)}
              rows={3}
              placeholder="e.g. Duplicate of existing entry, incorrect form selected, name contains typo…"
              className="w-full px-3 py-2 text-sm rounded-xl resize-none outline-none"
              style={{ border: "1px solid #E8E4FF" }}
              autoFocus
            />
            <p className="text-xs mt-1 mb-5" style={{ color: "#9B9BC0" }}>
              This will be visible to the pharmacy so they can correct and resubmit.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ border: "1px solid #E8E4FF", color: "#6B6B9A" }}
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={!rejectNotes.trim() || rejectPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "linear-gradient(90deg, #EF4444, #DC2626)" }}
              >
                {rejectPending ? "Rejecting…" : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
