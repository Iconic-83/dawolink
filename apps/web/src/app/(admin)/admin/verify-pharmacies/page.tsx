"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import { CheckCircle, XCircle, Building2, Phone, Mail, FileText, Clock } from "lucide-react";
import { useState } from "react";

export default function VerifyPharmaciesPage() {
  const qc = useQueryClient();
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const { data = [], isLoading } = useQuery<any[]>({
    queryKey: ["pending-pharmacies"],
    queryFn: () => adminApi.get("/v1/platform/pharmacies/pending-verification").then(r => r.data),
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) => adminApi.patch(`/v1/platform/pharmacies/${id}/verify`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pending-pharmacies"] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      adminApi.patch(`/v1/platform/pharmacies/${id}/reject-verification`, { note }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pending-pharmacies"] });
      setRejectModal(null);
      setRejectNote("");
    },
  });

  if (isLoading) return <div className="p-8 text-gray-400">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pharmacy Verification</h1>
        <p className="text-sm text-gray-500 mt-1">
          {data.length} pharmacies awaiting verification
        </p>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
          <p className="font-semibold">All caught up — no pending verifications</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((p: any) => (
            <div key={p.id} className="bg-white border border-gray-100 rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{p.name}</h3>
                    <p className="text-sm text-gray-500">{p.city}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Clock className="w-3.5 h-3.5" />
                  Registered {new Date(p.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { icon: Phone, label: "Phone", value: p.phone },
                  { icon: Mail, label: "Email", value: p.email ?? "Not provided" },
                  { icon: FileText, label: "License No.", value: p.licenseNo ?? "Not provided" },
                ].map(f => (
                  <div key={f.label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">{f.label}</p>
                    <p className="text-sm font-semibold text-gray-800">{f.value}</p>
                  </div>
                ))}
              </div>

              {(p.licenseUrl || p.registrationCertUrl) && (
                <div className="flex gap-3 mb-4">
                  {p.licenseUrl && (
                    <a href={p.licenseUrl} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold bg-indigo-50 px-3 py-1.5 rounded-lg">
                      <FileText className="w-3.5 h-3.5" /> View License
                    </a>
                  )}
                  {p.registrationCertUrl && (
                    <a href={p.registrationCertUrl} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold bg-indigo-50 px-3 py-1.5 rounded-lg">
                      <FileText className="w-3.5 h-3.5" /> View Registration Cert
                    </a>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => verifyMutation.mutate(p.id)}
                  disabled={verifyMutation.isPending}
                  className="flex items-center gap-2 bg-green-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve & Verify
                </button>
                <button
                  onClick={() => setRejectModal({ id: p.id, name: p.name })}
                  className="flex items-center gap-2 border-2 border-red-200 text-red-600 px-5 py-2 rounded-xl text-sm font-semibold hover:bg-red-50 transition"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-bold text-gray-900">Reject: {rejectModal.name}</h3>
            <p className="text-sm text-gray-500">Provide a reason so the pharmacy can correct and resubmit.</p>
            <textarea
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none"
              rows={4}
              placeholder="e.g. License document is expired. Please upload a valid license."
              value={rejectNote}
              onChange={e => setRejectNote(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={() => setRejectModal(null)}
                className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-semibold text-gray-600">
                Cancel
              </button>
              <button
                onClick={() => rejectMutation.mutate({ id: rejectModal.id, note: rejectNote })}
                disabled={!rejectNote.trim() || rejectMutation.isPending}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-red-700">
                {rejectMutation.isPending ? "Rejecting…" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
