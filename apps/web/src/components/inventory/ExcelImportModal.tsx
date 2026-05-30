"use client";

import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner";
import {
  Upload, Download, FileSpreadsheet, CheckCircle,
  AlertTriangle, XCircle, Loader2, RefreshCw,
} from "lucide-react";

interface ImportRow {
  row: number;
  name: string;
  status: "valid" | "duplicate" | "error";
  error?: string;
}

interface PreviewResult {
  total: number;
  valid: number;
  duplicates: number;
  errors: number;
  rows: ImportRow[];
}

interface Props { open: boolean; onClose: () => void; }

export function ExcelImportModal({ open, onClose }: Props) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [branchId, setBranchId] = useState("");
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [importResult, setImportResult] = useState<{ imported: number; failed: number; errors: string[] } | null>(null);

  const { data: branches = [] } = useQuery<any[]>({
    queryKey: ["branches"],
    queryFn: () => api.get("/v1/pharmacy/branches").then(r => r.data),
  });

  const previewMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || !branchId) throw new Error("Select a file and branch first");
      const form = new FormData();
      form.append("file", selectedFile);
      form.append("branchId", branchId);
      const { data } = await api.post("/v1/inventory/import/preview", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data as PreviewResult;
    },
    onSuccess: (data) => setPreview(data),
    onError: (e: any) => toast.error(e.response?.data?.message ?? e.message ?? "Preview failed"),
  });

  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || !branchId) throw new Error("Missing file or branch");
      const form = new FormData();
      form.append("file", selectedFile);
      form.append("branchId", branchId);
      const { data } = await api.post("/v1/inventory/import/confirm", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["medicines"] });
      setImportResult(data);
      toast.success(`${data.imported} medicines imported successfully`);
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Import failed"),
  });

  function reset() {
    setSelectedFile(null);
    setPreview(null);
    setImportResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function downloadTemplate() {
    window.open("/api/v1/inventory/import/template", "_blank");
  }

  const STATUS_ICON: Record<string, React.ReactNode> = {
    valid:     <CheckCircle className="w-3.5 h-3.5 text-green-500" />,
    duplicate: <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />,
    error:     <XCircle className="w-3.5 h-3.5 text-red-500" />,
  };
  const STATUS_COLOR: Record<string, string> = {
    valid:     "text-green-700",
    duplicate: "text-amber-700",
    error:     "text-red-700",
  };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Bulk Import Medicines" size="xl">
      <div className="space-y-5">

        {/* Step 1: Download template */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <FileSpreadsheet className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-sm">Step 1 — Download the template</p>
            <p className="text-xs text-gray-500 mt-1">
              Fill in the Excel template with your medicines. Supports up to 5,000 rows.
            </p>
            <div className="mt-2 text-xs text-gray-400 font-mono bg-white rounded-lg px-3 py-1.5 border border-indigo-100 inline-block">
              Name | Generic | Form | Strength | Barcode | Category | RX | Batch | Expiry | Qty | Cost | Price
            </div>
          </div>
          <button onClick={downloadTemplate}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition flex-shrink-0">
            <Download className="w-4 h-4" />
            Template
          </button>
        </div>

        {/* Step 2: Select branch + file */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700">Step 2 — Select branch & upload file</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Branch *</label>
              <select value={branchId} onChange={e => { setBranchId(e.target.value); setPreview(null); }}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                <option value="">Select branch…</option>
                {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Excel File (.xlsx) *</label>
              <div className="relative">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={e => { const f = e.target.files?.[0]; if (f) { setSelectedFile(f); setPreview(null); setImportResult(null); } }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-500 flex items-center gap-2 cursor-pointer hover:border-indigo-300 transition">
                  <Upload className="w-4 h-4 text-indigo-500" />
                  {selectedFile ? selectedFile.name : "Choose file…"}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => previewMutation.mutate()}
            disabled={!selectedFile || !branchId || previewMutation.isPending}
            className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition disabled:opacity-40"
          >
            {previewMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Preview Import
          </button>
        </div>

        {/* Preview results */}
        {preview && !importResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Total Rows",  value: preview.total,      color: "bg-gray-50 text-gray-700" },
                { label: "Valid",       value: preview.valid,      color: "bg-green-50 text-green-700" },
                { label: "Duplicates", value: preview.duplicates,  color: "bg-amber-50 text-amber-700" },
                { label: "Errors",     value: preview.errors,      color: "bg-red-50 text-red-700" },
              ].map(s => (
                <div key={s.label} className={`rounded-xl p-3 text-center ${s.color}`}>
                  <p className="text-2xl font-black">{s.value}</p>
                  <p className="text-xs font-semibold mt-0.5 opacity-70">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Row preview table */}
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2 text-gray-500 font-semibold">Row</th>
                      <th className="text-left px-3 py-2 text-gray-500 font-semibold">Medicine</th>
                      <th className="text-left px-3 py-2 text-gray-500 font-semibold">Status</th>
                      <th className="text-left px-3 py-2 text-gray-500 font-semibold">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map(r => (
                      <tr key={r.row} className="border-t border-gray-50 hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-400">{r.row}</td>
                        <td className="px-3 py-2 text-gray-800 font-medium">{r.name}</td>
                        <td className="px-3 py-2">
                          <span className={`flex items-center gap-1 font-semibold ${STATUS_COLOR[r.status]}`}>
                            {STATUS_ICON[r.status]}
                            {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-400">{r.error ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {preview.valid === 0 ? (
              <p className="text-sm text-red-600 text-center font-medium">No valid rows to import. Fix the errors and try again.</p>
            ) : (
              <button
                onClick={() => confirmMutation.mutate()}
                disabled={confirmMutation.isPending}
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-green-700 transition disabled:opacity-50"
              >
                {confirmMutation.isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing…</>
                  : <><CheckCircle className="w-4 h-4" /> Import {preview.valid} Valid Records</>}
              </button>
            )}
          </div>
        )}

        {/* Import result */}
        {importResult && (
          <div className="space-y-3">
            <div className={`rounded-2xl p-5 flex items-center gap-4 ${importResult.failed === 0 ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"}`}>
              <CheckCircle className={`w-8 h-8 flex-shrink-0 ${importResult.failed === 0 ? "text-green-600" : "text-amber-600"}`} />
              <div>
                <p className="font-bold text-gray-900 text-lg">{importResult.imported} medicines imported</p>
                {importResult.failed > 0 && <p className="text-sm text-amber-700">{importResult.failed} failed</p>}
              </div>
            </div>
            {importResult.errors.length > 0 && (
              <div className="bg-white border border-red-100 rounded-xl p-3 space-y-1">
                {importResult.errors.map((e, i) => (
                  <p key={i} className="text-xs text-red-600">• {e}</p>
                ))}
              </div>
            )}
            <button onClick={() => { reset(); onClose(); }}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition">
              Done
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
