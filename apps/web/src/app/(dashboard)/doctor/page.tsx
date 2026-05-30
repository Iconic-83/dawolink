"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Stethoscope, FilePlus, Search, CheckCircle, Clock, XCircle, Plus, X } from "lucide-react";

type Tab = "lookup" | "eprescriptions" | "register";

const STATUS_META: Record<string, { label: string; color: string; icon: any }> = {
  ISSUED:     { label: "Active",    color: "bg-green-100 text-green-700",  icon: CheckCircle },
  DISPENSED:  { label: "Dispensed", color: "bg-blue-100 text-blue-700",    icon: CheckCircle },
  EXPIRED:    { label: "Expired",   color: "bg-gray-100 text-gray-500",    icon: XCircle },
  CANCELLED:  { label: "Cancelled", color: "bg-red-100 text-red-600",      icon: XCircle },
};

function LookupTab() {
  const qc = useQueryClient();
  const [phone, setPhone] = useState("");
  const [searched, setSearched] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["e-prescriptions", searched],
    queryFn: () => api.get(`/v1/doctor/prescriptions/patient?phone=${encodeURIComponent(searched)}`).then(r => r.data),
    enabled: !!searched,
  });

  const dispenseMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/v1/doctor/prescriptions/${id}/dispense`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["e-prescriptions"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm" placeholder="Patient phone number…" value={phone} onChange={e => setPhone(e.target.value)} />
        <button onClick={() => setSearched(phone)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition flex items-center gap-2">
          <Search className="w-4 h-4" /> Lookup
        </button>
      </div>

      {isLoading && <div className="text-center py-8 text-gray-400">Searching…</div>}
      {searched && !isLoading && (data as any[])?.length === 0 && (
        <div className="text-center py-8 text-gray-400">No active prescriptions found for this patient</div>
      )}

      {(data as any[])?.map((rx: any) => {
        const meta = STATUS_META[rx.status] ?? STATUS_META.ISSUED;
        return (
          <div key={rx.id} className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-bold text-gray-900">{rx.patientName}</p>
                <p className="text-sm text-gray-500">{rx.patientPhone} {rx.patientAge ? `· Age ${rx.patientAge}` : ""}</p>
                <p className="text-xs text-gray-400 mt-1">Dr. {rx.doctor?.name} · {rx.doctor?.specialty} · {rx.doctor?.clinicName}</p>
              </div>
              <div className="text-right">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${meta.color}`}>{meta.label}</span>
                <p className="text-xs text-gray-400 mt-1">Expires {new Date(rx.expiresAt).toLocaleDateString()}</p>
              </div>
            </div>

            {rx.diagnosis && <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 mb-3">Diagnosis: {rx.diagnosis}</p>}

            <div className="space-y-2 mb-4">
              {(rx.medicines as any[])?.map((m: any, i: number) => (
                <div key={i} className="flex items-start gap-3 bg-indigo-50 rounded-lg px-3 py-2">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-100 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{m.name}</p>
                    <p className="text-xs text-gray-500">{m.dosage} · {m.frequency} · {m.duration} · Qty: {m.quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            {rx.notes && <p className="text-xs text-gray-500 mb-3 italic">Notes: {rx.notes}</p>}

            {rx.status === "ISSUED" && (
              <button onClick={() => dispenseMutation.mutate(rx.id)} disabled={dispenseMutation.isPending}
                className="w-full bg-green-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-green-700 transition disabled:opacity-50">
                {dispenseMutation.isPending ? "Processing…" : "Mark as Dispensed"}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function RegisterDoctorTab() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", licenseNumber: "", specialty: "", phone: "", email: "", password: "", clinicName: "", clinicCity: "" });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const createMutation = useMutation({
    mutationFn: (dto: typeof form) => api.post("/v1/doctor/register", dto).then(r => r.data),
    onSuccess: () => { alert("Doctor registered successfully!"); setForm({ name: "", licenseNumber: "", specialty: "", phone: "", email: "", password: "", clinicName: "", clinicCity: "" }); },
  });

  const fields = [
    { key: "name",          label: "Full Name *" },
    { key: "licenseNumber", label: "License Number *" },
    { key: "specialty",     label: "Specialty" },
    { key: "phone",         label: "Phone Number *" },
    { key: "email",         label: "Email" },
    { key: "password",      label: "Password *", type: "password" },
    { key: "clinicName",    label: "Clinic Name" },
    { key: "clinicCity",    label: "Clinic City" },
  ];

  return (
    <div className="max-w-lg space-y-4">
      <p className="text-sm text-gray-500">Register a doctor to issue electronic prescriptions on the DawoLink network.</p>
      <div className="grid grid-cols-2 gap-3">
        {fields.map(f => (
          <div key={f.key} className={f.key === "name" || f.key === "licenseNumber" ? "col-span-2" : ""}>
            <label className="block text-xs font-semibold text-gray-600 mb-1">{f.label}</label>
            <input type={f.type ?? "text"} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
              value={(form as any)[f.key]} onChange={e => set(f.key, e.target.value)} />
          </div>
        ))}
      </div>
      <button onClick={() => createMutation.mutate(form)}
        disabled={!form.name || !form.licenseNumber || !form.phone || !form.password || createMutation.isPending}
        className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50 hover:bg-indigo-700 transition">
        {createMutation.isPending ? "Registering…" : "Register Doctor"}
      </button>
    </div>
  );
}

export default function DoctorPage() {
  const [tab, setTab] = useState<Tab>("lookup");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center">
          <Stethoscope className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Doctor Portal</h1>
          <p className="text-sm text-gray-500">Electronic prescriptions & doctor network</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: "lookup",        label: "Patient Lookup",     icon: Search },
          { id: "register",      label: "Register Doctor",    icon: Plus },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as Tab)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition -mb-px ${tab === t.id ? "border-teal-600 text-teal-600" : "border-transparent text-gray-500"}`}>
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {tab === "lookup"   && <LookupTab />}
        {tab === "register" && <RegisterDoctorTab />}
      </div>
    </div>
  );
}
