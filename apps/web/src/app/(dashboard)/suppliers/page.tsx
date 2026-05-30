"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AddSupplierModal } from "@/components/suppliers/AddSupplierModal";
import { CreatePOModal } from "@/components/suppliers/CreatePOModal";
import { ReceivePOModal } from "@/components/suppliers/ReceivePOModal";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageSpinner } from "@/components/ui/Spinner";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import {
  Plus, Search, Truck, ClipboardList, Phone, Mail, MapPin,
  Star, FileText, CheckCircle2, PackageCheck, AlertTriangle,
  TrendingUp, DollarSign, Clock, ChevronRight, Loader2, RefreshCw,
} from "lucide-react";

type Tab = "suppliers" | "orders" | "debt" | "reorder";

const PO_STATUS: Record<string, { label: string; variant: any }> = {
  PENDING:            { label: "Pending",   variant: "warning" },
  CONFIRMED:          { label: "Confirmed", variant: "info" },
  PARTIALLY_RECEIVED: { label: "Partial",   variant: "warning" },
  RECEIVED:           { label: "Received",  variant: "success" },
  CANCELLED:          { label: "Cancelled", variant: "danger" },
};

const PAY_STATUS: Record<string, { label: string; variant: any }> = {
  UNPAID:  { label: "Unpaid",   variant: "danger" },
  PARTIAL: { label: "Partial",  variant: "warning" },
  PAID:    { label: "Paid",     variant: "success" },
};

function PaymentModal({ order, onClose }: { order: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");
  const [invoiceNo, setInvoiceNo] = useState(order.supplierInvoiceNo ?? "");
  const remaining = Number(order.totalAmount) - Number(order.amountPaid);

  const { mutate, isPending } = useMutation({
    mutationFn: () => api.post(`/v1/suppliers/purchase-orders/${order.id}/payment`, {
      amount: parseFloat(amount), invoiceNo: invoiceNo || undefined,
    }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
      qc.invalidateQueries({ queryKey: ["debt-summary"] });
      toast.success("Payment recorded");
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Failed"),
  });

  return (
    <Modal open onClose={onClose} title={`Record Payment — ${order.orderNo}`} size="sm">
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
          <div className="flex justify-between"><span className="text-gray-500">Supplier</span><span className="font-medium">{order.supplier?.name}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Order Total</span><span className="font-medium">{formatCurrency(Number(order.totalAmount))}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Already Paid</span><span className="text-green-600 font-medium">{formatCurrency(Number(order.amountPaid))}</span></div>
          <div className="flex justify-between font-semibold border-t border-gray-200 pt-1 mt-1"><span>Remaining</span><span className="text-red-600">{formatCurrency(remaining)}</span></div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Amount Paying ($) *</label>
          <input type="number" step="0.01" max={remaining} value={amount} onChange={e => setAmount(e.target.value)}
            placeholder={remaining.toFixed(2)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <div className="flex gap-2 mt-1.5">
            {[remaining * 0.5, remaining * 0.75, remaining].map((v, i) => (
              <button key={i} onClick={() => setAmount(v.toFixed(2))} type="button"
                className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium">
                {i === 2 ? "Full" : `${i === 0 ? "50" : "75"}%"} ({formatCurrency(v)})`}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Supplier Invoice No. (optional)</label>
          <input value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} placeholder="e.g. INV-2024-001"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
          <button onClick={() => mutate()} disabled={!amount || isPending}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 disabled:opacity-50">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Record Payment
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Supplier Portal Users Panel ───────────────────────────────────────────

function SupplierUsersPanel({ supplierId }: { supplierId: string }) {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", phone: "" });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["supplier-users", supplierId],
    queryFn: () => api.get(`/v1/supplier-portal/suppliers/${supplierId}/users`).then(r => r.data),
  });

  const { mutate: create, isPending } = useMutation({
    mutationFn: () => api.post(`/v1/supplier-portal/suppliers/${supplierId}/users`, form).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supplier-users", supplierId] });
      toast.success("Supplier account created");
      setShowCreate(false);
      setForm({ firstName: "", lastName: "", email: "", password: "", phone: "" });
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed"),
  });

  const inp = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple";

  return (
    <div className="border-t border-gray-100 pt-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-700">Portal Accounts</p>
        <button onClick={() => setShowCreate(s => !s)}
          className="text-xs px-3 py-1.5 rounded-lg font-medium text-white"
          style={{ background: "linear-gradient(90deg,#00C897,#009E78)" }}>
          + Add Account
        </button>
      </div>

      {showCreate && (
        <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">First Name</label>
              <input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} className={inp} placeholder="Ahmed" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Last Name</label>
              <input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} className={inp} placeholder="Hassan" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inp} placeholder="supplier@company.com" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className={inp} placeholder="Min 8 chars" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone (opt.)</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inp} placeholder="+252…" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowCreate(false)} className="flex-1 py-2 rounded-lg border border-gray-200 text-xs text-gray-600">Cancel</button>
            <button onClick={() => create()} disabled={isPending || !form.email || !form.password || !form.firstName}
              className="flex-1 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
              style={{ background: "linear-gradient(90deg,#00C897,#009E78)" }}>
              {isPending ? "Creating…" : "Create Account"}
            </button>
          </div>
        </div>
      )}

      {users.length === 0 ? (
        <p className="text-xs text-gray-400 italic">No portal accounts yet. Add one so the supplier can log in and view their orders.</p>
      ) : (
        <div className="space-y-2">
          {users.map((u: any) => (
            <div key={u.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-gray-900">{u.firstName} {u.lastName}</p>
                <p className="text-xs text-gray-400">{u.email}</p>
              </div>
              <a href="/supplier/login" target="_blank"
                className="text-xs px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 font-medium hover:bg-indigo-100 transition">
                Portal ↗
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SuppliersPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("suppliers");
  const [search, setSearch] = useState("");
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showCreatePO, setShowCreatePO] = useState(false);
  const [prefillSupplier, setPrefillSupplier] = useState<string | undefined>();
  const [receivingOrder, setReceivingOrder] = useState<any>(null);
  const [payingOrder, setPayingOrder] = useState<any>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);

  const { data: suppliers = [], isLoading: loadingSuppliers } = useQuery<any[]>({
    queryKey: ["suppliers"],
    queryFn: () => api.get("/v1/suppliers").then(r => r.data),
  });

  const { data: orders = [], isLoading: loadingOrders } = useQuery<any[]>({
    queryKey: ["purchase-orders"],
    queryFn: () => api.get("/v1/suppliers/purchase-orders/all").then(r => r.data),
  });

  const { data: debtData = [], isLoading: loadingDebt } = useQuery<any[]>({
    queryKey: ["debt-summary"],
    queryFn: () => api.get("/v1/suppliers/debt/summary").then(r => r.data),
    enabled: tab === "debt",
  });

  const { data: suggestions = [], isLoading: loadingSuggestions } = useQuery<any[]>({
    queryKey: ["reorder-suggestions"],
    queryFn: () => api.get("/v1/suppliers/reorder/suggestions").then(r => r.data),
    enabled: tab === "reorder",
  });

  const { data: supplierSummary, isLoading: loadingSummary } = useQuery<any>({
    queryKey: ["supplier-summary", selectedSupplier?.id],
    queryFn: () => api.get(`/v1/suppliers/${selectedSupplier.id}/summary`).then(r => r.data),
    enabled: !!selectedSupplier,
  });

  const { mutate: confirmOrder } = useMutation({
    mutationFn: (id: string) => api.patch(`/v1/suppliers/purchase-orders/${id}/status`, { status: "CONFIRMED" }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["purchase-orders"] }); toast.success("Order confirmed"); },
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Failed"),
  });

  const filteredSuppliers = suppliers.filter((s: any) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.contactName?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredOrders = orders.filter((o: any) =>
    !search || o.orderNo.toLowerCase().includes(search.toLowerCase()) || o.supplier?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalDebtAll = (debtData as any[]).reduce((s: number, d: any) => s + d.totalDebt, 0);
  const pendingOrders = orders.filter((o: any) => o.status === "PENDING").length;

  const tabCls = (id: Tab) =>
    `flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
      tab === id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
    }`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage suppliers, orders, invoices and debt</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setTab("reorder"); }} className="flex items-center gap-2 px-4 py-2 border border-orange-200 text-orange-700 bg-orange-50 text-sm font-medium rounded-xl hover:bg-orange-100 transition">
            <AlertTriangle className="h-4 w-4" /> Reorder Alerts
          </button>
          <button onClick={() => setShowCreatePO(true)} className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition">
            <FileText className="h-4 w-4" /> New Order
          </button>
          <button onClick={() => setShowAddSupplier(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition">
            <Plus className="h-4 w-4" /> Add Supplier
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Suppliers", value: suppliers.length, icon: "🤝", color: "text-blue-600" },
          { label: "Pending Orders", value: pendingOrders, icon: "📋", color: "text-orange-600" },
          { label: "Total Received", value: formatCurrency(orders.filter((o: any) => o.status === "RECEIVED").reduce((s: number, o: any) => s + Number(o.totalAmount), 0)), icon: "📦", color: "text-green-600" },
          { label: "Total Debt", value: formatCurrency(orders.filter((o: any) => o.paymentStatus !== "PAID").reduce((s: number, o: any) => s + (Number(o.totalAmount) - Number(o.amountPaid)), 0)), icon: "💳", color: "text-red-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">{s.icon}</span>
            <div><p className="text-xs text-gray-500">{s.label}</p><p className={`font-bold ${s.color}`}>{s.value}</p></div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center border-b border-gray-100 px-1 pt-1">
          {(["suppliers", "orders", "debt", "reorder"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} className={tabCls(t)}>
              {t === "suppliers" && <><Truck className="h-3.5 w-3.5" /> Suppliers</>}
              {t === "orders" && <><ClipboardList className="h-3.5 w-3.5" /> Purchase Orders</>}
              {t === "debt" && <><DollarSign className="h-3.5 w-3.5" /> Debt Tracker</>}
              {t === "reorder" && <><AlertTriangle className="h-3.5 w-3.5" /> Reorder Suggestions</>}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 px-4 py-2">
            {(tab === "suppliers" || tab === "orders") && (
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
                  className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-44" />
              </div>
            )}
          </div>
        </div>

        {/* ── SUPPLIERS TAB ── */}
        {tab === "suppliers" && (
          loadingSuppliers ? <PageSpinner /> : filteredSuppliers.length === 0 ? (
            <EmptyState icon="🤝" title="No suppliers yet" sub="Add your first supplier to start creating purchase orders" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {filteredSuppliers.map((s: any) => {
                const supplierOrders = orders.filter((o: any) => o.supplierId === s.id);
                const supplierDebt = supplierOrders
                  .filter((o: any) => o.paymentStatus !== "PAID")
                  .reduce((sum: number, o: any) => sum + Number(o.totalAmount) - Number(o.amountPaid), 0);
                return (
                  <div key={s.id} className="border border-gray-100 rounded-xl p-4 hover:border-blue-200 hover:shadow-sm transition group cursor-pointer"
                    onClick={() => setSelectedSupplier(s)}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {s.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{s.name}</p>
                          {s.contactName && <p className="text-xs text-gray-500">{s.contactName}</p>}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-400 transition" />
                    </div>

                    <div className="space-y-1 text-xs text-gray-500">
                      {s.phone && <div className="flex items-center gap-2"><Phone className="h-3 w-3" />{s.phone}</div>}
                      {s.email && <div className="flex items-center gap-2"><Mail className="h-3 w-3" />{s.email}</div>}
                      {s.city && <div className="flex items-center gap-2"><MapPin className="h-3 w-3" />{s.city}</div>}
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                      <span className="text-gray-400">{supplierOrders.length} orders</span>
                      {supplierDebt > 0 ? (
                        <span className="text-red-600 font-semibold">Debt: {formatCurrency(supplierDebt)}</span>
                      ) : (
                        <span className="text-green-600 font-medium">No debt</span>
                      )}
                    </div>

                    <button onClick={e => { e.stopPropagation(); setPrefillSupplier(s.id); setShowCreatePO(true); }}
                      className="mt-2 w-full py-1.5 text-xs font-medium text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-50 transition opacity-0 group-hover:opacity-100">
                      + Create Purchase Order
                    </button>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* ── ORDERS TAB ── */}
        {tab === "orders" && (
          loadingOrders ? <PageSpinner /> : filteredOrders.length === 0 ? (
            <EmptyState icon="📋" title="No purchase orders yet" sub="Create your first order from the Suppliers tab" />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredOrders.map((order: any) => {
                  const st = PO_STATUS[order.status] ?? { label: order.status, variant: "default" };
                  const ps = PAY_STATUS[order.paymentStatus] ?? { label: order.paymentStatus, variant: "muted" };
                  const remaining = Number(order.totalAmount) - Number(order.amountPaid);
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-mono text-sm font-medium text-blue-600">{order.orderNo}</p>
                        {order.items?.length > 0 && <p className="text-xs text-gray-400">{order.items.length} items</p>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                            {order.supplier?.name?.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{order.supplier?.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{formatCurrency(Number(order.totalAmount))}</p>
                        {order.amountPaid > 0 && <p className="text-xs text-green-600">Paid: {formatCurrency(Number(order.amountPaid))}</p>}
                      </td>
                      <td className="px-4 py-3"><Badge variant={st.variant}>{st.label}</Badge></td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <Badge variant={ps.variant}>{ps.label}</Badge>
                          {order.paymentStatus !== "PAID" && order.status === "RECEIVED" && (
                            <p className="text-xs text-red-500">Owes {formatCurrency(remaining)}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        <p>{formatDate(order.orderedAt)}</p>
                        {order.expectedDeliveryDate && <p className="text-gray-400">Due: {formatDate(order.expectedDeliveryDate)}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {order.status === "PENDING" && (
                            <button onClick={() => confirmOrder(order.id)}
                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition">
                              <CheckCircle2 className="h-3 w-3" /> Confirm
                            </button>
                          )}
                          {(order.status === "CONFIRMED" || order.status === "PENDING") && (
                            <button onClick={() => setReceivingOrder(order)}
                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition">
                              <PackageCheck className="h-3 w-3" /> Receive
                            </button>
                          )}
                          {order.status === "RECEIVED" && order.paymentStatus !== "PAID" && (
                            <button onClick={() => setPayingOrder(order)}
                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition">
                              <DollarSign className="h-3 w-3" /> Pay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        )}

        {/* ── DEBT TRACKER TAB ── */}
        {tab === "debt" && (
          loadingDebt ? <PageSpinner /> : (debtData as any[]).length === 0 ? (
            <EmptyState icon="✅" title="No outstanding debt" sub="All supplier payments are up to date" />
          ) : (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">Total outstanding across all suppliers</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(totalDebtAll)}</p>
              </div>
              {(debtData as any[]).map((d: any) => (
                <div key={d.supplier.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm">
                        {d.supplier.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{d.supplier.name}</p>
                        <p className="text-xs text-gray-500">{d.supplier.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">{formatCurrency(d.totalDebt)}</p>
                      <p className="text-xs text-gray-400">{d.orders.length} unpaid order{d.orders.length !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {d.orders.map((o: any) => (
                      <div key={o.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-xs">
                        <span className="font-mono text-blue-600">{o.orderNo}</span>
                        <span className="text-gray-500">{formatDate(o.orderedAt)}</span>
                        <Badge variant={PAY_STATUS[o.paymentStatus]?.variant ?? "muted"}>{PAY_STATUS[o.paymentStatus]?.label ?? o.paymentStatus}</Badge>
                        <span className="font-semibold text-red-600">{formatCurrency(Number(o.totalAmount) - Number(o.amountPaid))}</span>
                        <button onClick={() => setPayingOrder(o)}
                          className="px-2 py-0.5 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded font-medium transition">
                          Pay
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ── REORDER SUGGESTIONS TAB ── */}
        {tab === "reorder" && (
          loadingSuggestions ? <PageSpinner /> : suggestions.length === 0 ? (
            <EmptyState icon="✅" title="All stock levels are healthy" sub="No medicines are below their reorder level right now" />
          ) : (
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 mb-2">
                <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                <p className="text-sm text-orange-700"><strong>{suggestions.length} medicines</strong> are below reorder level. System suggests reorders based on your supplier history.</p>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border border-gray-100 rounded-xl">
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="px-4 py-3">Medicine</th>
                    <th className="px-4 py-3 text-center">Stock</th>
                    <th className="px-4 py-3 text-center">Reorder At</th>
                    <th className="px-4 py-3">Suggested Supplier</th>
                    <th className="px-4 py-3 text-center">Last Cost</th>
                    <th className="px-4 py-3 text-center">Suggest Qty</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {suggestions.map((s: any, i: number) => (
                    <tr key={i} className="hover:bg-orange-50/40 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{s.medicine?.name}</p>
                        <p className="text-xs text-gray-400">{s.medicine?.category}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-bold ${s.currentStock === 0 ? "text-red-600" : "text-orange-500"}`}>{s.currentStock}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500">{s.reorderLevel}</td>
                      <td className="px-4 py-3">
                        {s.lastSupplier ? (
                          <div>
                            <p className="font-medium text-gray-800">{s.lastSupplier.name}</p>
                            {s.lastOrderedAt && <p className="text-xs text-gray-400">Last: {formatDate(s.lastOrderedAt)}</p>}
                          </div>
                        ) : <span className="text-gray-300 text-xs">No history</span>}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {s.lastUnitCost ? formatCurrency(s.lastUnitCost) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-gray-700">{s.suggestedQty}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => { setPrefillSupplier(s.lastSupplier?.id); setShowCreatePO(true); }}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition">
                          <RefreshCw className="h-3 w-3" /> Order Now
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Supplier detail modal */}
      {selectedSupplier && (
        <Modal open onClose={() => setSelectedSupplier(null)} title={selectedSupplier.name} size="lg">
          {loadingSummary ? <PageSpinner /> : supplierSummary && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: "Total Orders", value: supplierSummary.stats.totalOrders, icon: <ClipboardList className="h-4 w-4 text-blue-500" /> },
                  { label: "Total Spend", value: formatCurrency(supplierSummary.stats.totalSpend), icon: <DollarSign className="h-4 w-4 text-green-500" /> },
                  { label: "Outstanding Debt", value: formatCurrency(supplierSummary.stats.totalDebt), icon: <TrendingUp className="h-4 w-4 text-red-500" /> },
                  { label: "Avg Delivery", value: supplierSummary.stats.avgDeliveryDays != null ? `${supplierSummary.stats.avgDeliveryDays} days` : "—", icon: <Clock className="h-4 w-4 text-orange-500" /> },
                  { label: "Fulfillment Rate", value: `${supplierSummary.stats.fulfillmentRate}%`, icon: <Star className="h-4 w-4 text-yellow-500" /> },
                ].map(stat => (
                  <div key={stat.label} className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                    {stat.icon}
                    <div><p className="text-xs text-gray-500">{stat.label}</p><p className="font-bold text-gray-900">{stat.value}</p></div>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recent Orders</p>
                {supplierSummary.recentOrders.length === 0 ? (
                  <p className="text-sm text-gray-400">No orders yet</p>
                ) : (
                  <div className="space-y-1.5">
                    {supplierSummary.recentOrders.map((o: any) => {
                      const st = PO_STATUS[o.status] ?? { label: o.status, variant: "default" };
                      const ps = PAY_STATUS[o.paymentStatus] ?? { label: o.paymentStatus, variant: "muted" };
                      return (
                        <div key={o.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2.5 text-xs">
                          <span className="font-mono text-blue-600 w-28">{o.orderNo}</span>
                          <Badge variant={st.variant}>{st.label}</Badge>
                          <Badge variant={ps.variant}>{ps.label}</Badge>
                          <span className="flex-1 text-gray-400">{formatDate(o.orderedAt)}</span>
                          <span className="font-semibold text-gray-800">{formatCurrency(Number(o.totalAmount))}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Supplier Portal Accounts */}
              <SupplierUsersPanel supplierId={selectedSupplier.id} />

              <div className="flex justify-end gap-2">
                <button onClick={() => { setSelectedSupplier(null); setPrefillSupplier(selectedSupplier.id); setShowCreatePO(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
                  <FileText className="h-4 w-4" /> New Order
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      <AddSupplierModal open={showAddSupplier} onClose={() => setShowAddSupplier(false)} />
      <CreatePOModal open={showCreatePO} onClose={() => { setShowCreatePO(false); setPrefillSupplier(undefined); }} prefillSupplierId={prefillSupplier} />
      {receivingOrder && <ReceivePOModal open onClose={() => setReceivingOrder(null)} order={receivingOrder} />}
      {payingOrder && <PaymentModal order={payingOrder} onClose={() => setPayingOrder(null)} />}
    </div>
  );
}
