"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Shield, CheckCircle, XCircle, Clock, TrendingUp, Plus } from "lucide-react";

type Tab = "claims" | "companies" | "stats";

const STATUS_META: Record<string, { label: string; color: string }> = {
  PENDING:    { label: "Pending",    color: "bg-amber-100 text-amber-700" },
  PROCESSING: { label: "Processing", color: "bg-blue-100 text-blue-700" },
  APPROVED:   { label: "Approved",   color: "bg-green-100 text-green-700" },
  REJECTED:   { label: "Rejected",   color: "bg-red-100 text-red-600" },
};

function ClaimsTab() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [processing, setProcessing] = useState<Record<string, { amount: string; reason: string }>>({});

  const { data = [], isLoading } = useQuery<any[]>({
    queryKey: ["insurance-claims", statusFilter],
    queryFn: () => api.get(`/v1/insurance/claims${statusFilter ? `?status=${statusFilter}` : ""}`).then(r => r.data),
  });

  const processMutation = useMutation({
    mutationFn: ({ id, status, approvedAmount, rejectionReason }: any) =>
      api.patch(`/v1/insurance/claims/${id}`, { status, approvedAmount: approvedAmount ? Number(approvedAmount) : undefined, rejectionReason }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["insurance-claims"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {["", "PENDING", "APPROVED", "REJECTED"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition ${statusFilter === s ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"}`}>
            {s || "All"}
          </button>
        ))}
      </div>

      {isLoading ? <div className="text-center py-10 text-gray-400">Loading claims…</div> : data.length === 0 ? (
        <div className="text-center py-10 text-gray-400">No claims found</div>
      ) : (
        <div className="space-y-3">
          {data.map((claim: any) => {
            const meta = STATUS_META[claim.status] ?? STATUS_META.PENDING;
            const proc = processing[claim.id] ?? { amount: "", reason: "" };
            return (
              <div key={claim.id} className="bg-white border border-gray-100 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900">{claim.appUser?.name}</p>
                    <p className="text-sm text-gray-500">{claim.appUser?.phone} · Member: {claim.memberId}</p>
                    <p className="text-xs text-gray-400 mt-1">Order #{claim.order?.orderNo} · {claim.insuranceCompany?.name}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${meta.color}`}>{meta.label}</span>
                    <p className="text-sm font-black text-gray-900 mt-1">${Number(claim.requestedAmount).toFixed(2)}</p>
                    {claim.approvedAmount && <p className="text-xs text-green-600">Approved: ${Number(claim.approvedAmount).toFixed(2)}</p>}
                  </div>
                </div>

                {claim.rejectionReason && (
                  <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-1.5 mb-3">Rejected: {claim.rejectionReason}</p>
                )}

                {claim.status === "PENDING" && (
                  <div className="space-y-2 border-t border-gray-100 pt-3">
                    <div className="flex gap-2">
                      <input placeholder="Approved amount" type="number" className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
                        value={proc.amount} onChange={e => setProcessing(p => ({ ...p, [claim.id]: { ...proc, amount: e.target.value } }))} />
                      <input placeholder="Rejection reason (if rejecting)" className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
                        value={proc.reason} onChange={e => setProcessing(p => ({ ...p, [claim.id]: { ...proc, reason: e.target.value } }))} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => processMutation.mutate({ id: claim.id, status: "APPROVED", approvedAmount: proc.amount })}
                        className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition flex items-center justify-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button onClick={() => processMutation.mutate({ id: claim.id, status: "REJECTED", rejectionReason: proc.reason })}
                        className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition flex items-center justify-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CompaniesTab() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", contactEmail: "" });

  const { data = [] } = useQuery<any[]>({
    queryKey: ["insurance-companies"],
    queryFn: () => api.get("/v1/insurance/companies").then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (dto: typeof form) => api.post("/v1/insurance/companies", dto).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["insurance-companies"] }); setShowForm(false); setForm({ name: "", code: "", contactEmail: "" }); },
  });

  return (
    <div className="space-y-4">
      <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
        <Plus className="w-4 h-4" /> Add Insurance Company
      </button>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
          {[{ k: "name", l: "Company Name *" }, { k: "code", l: "Code *" }, { k: "contactEmail", l: "Contact Email" }].map(f => (
            <div key={f.k}>
              <label className="block text-xs font-semibold text-gray-600 mb-1">{f.l}</label>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" value={(form as any)[f.k]} onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))} />
            </div>
          ))}
          <button onClick={() => createMutation.mutate(form)} disabled={!form.name || !form.code}
            className="w-full bg-indigo-600 text-white py-2 rounded-xl font-semibold text-sm disabled:opacity-50">
            {createMutation.isPending ? "Adding…" : "Add Company"}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {data.map((c: any) => (
          <div key={c.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">{c.name}</p>
              <p className="text-xs text-gray-400">{c.code} · {c.contactEmail ?? "No email"}</p>
            </div>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">Active</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsTab() {
  const { data } = useQuery({
    queryKey: ["insurance-stats"],
    queryFn: () => api.get("/v1/insurance/claims/stats").then(r => r.data),
  });

  const cards = [
    { label: "Total Claims",    value: data?.total ?? 0,      color: "bg-indigo-50 text-indigo-700" },
    { label: "Pending",         value: data?.pending ?? 0,    color: "bg-amber-50 text-amber-700" },
    { label: "Approved",        value: data?.approved ?? 0,   color: "bg-green-50 text-green-700" },
    { label: "Rejected",        value: data?.rejected ?? 0,   color: "bg-red-50 text-red-700" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className={`rounded-2xl p-5 ${c.color}`}>
            <p className="text-3xl font-black">{c.value}</p>
            <p className="text-sm mt-1 font-medium opacity-80">{c.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <p className="text-sm text-gray-500 mb-1">Total Approved Amount</p>
        <p className="text-3xl font-black text-green-700">${Number(data?.totalApprovedAmount ?? 0).toFixed(2)}</p>
      </div>
    </div>
  );
}

export default function InsurancePage() {
  const [tab, setTab] = useState<Tab>("claims");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Insurance Portal</h1>
          <p className="text-sm text-gray-500">Manage insurance claims and companies</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: "claims",    label: "Claims",    icon: Clock },
          { id: "companies", label: "Companies", icon: Shield },
          { id: "stats",     label: "Statistics", icon: TrendingUp },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as Tab)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition -mb-px ${tab === t.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}>
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {tab === "claims"    && <ClaimsTab />}
        {tab === "companies" && <CompaniesTab />}
        {tab === "stats"     && <StatsTab />}
      </div>
    </div>
  );
}
