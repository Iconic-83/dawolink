"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AddSupplierModal } from "@/components/suppliers/AddSupplierModal";
import { CreatePOModal } from "@/components/suppliers/CreatePOModal";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageSpinner } from "@/components/ui/Spinner";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Plus, Search, Truck, ClipboardList,
  Phone, Mail, MapPin, Star, FileText,
} from "lucide-react";

type Tab = "suppliers" | "orders";

const PO_STATUS: Record<string, { label: string; variant: any }> = {
  PENDING:             { label: "Pending",            variant: "warning" },
  CONFIRMED:           { label: "Confirmed",          variant: "info" },
  PARTIALLY_RECEIVED:  { label: "Partial",            variant: "warning" },
  RECEIVED:            { label: "Received",           variant: "success" },
  CANCELLED:           { label: "Cancelled",          variant: "danger" },
};

export default function SuppliersPage() {
  const [tab, setTab] = useState<Tab>("suppliers");
  const [search, setSearch] = useState("");
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showCreatePO, setShowCreatePO] = useState(false);
  const [prefillSupplier, setPrefillSupplier] = useState<string | undefined>();

  const { data: suppliers = [], isLoading: loadingSuppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => api.get("/v1/suppliers").then(r => r.data),
  });

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: () => api.get("/v1/suppliers/purchase-orders/all").then(r => r.data),
  });

  const filteredSuppliers = suppliers.filter((s: any) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.contactName?.toLowerCase().includes(search.toLowerCase()) ||
    s.city?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredOrders = orders.filter((o: any) =>
    !search || o.orderNo.toLowerCase().includes(search.toLowerCase()) ||
    o.supplier?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o: any) => o.status === "PENDING").length;
  const totalSpend = orders
    .filter((o: any) => o.status === "RECEIVED")
    .reduce((s: number, o: any) => s + Number(o.totalAmount), 0);

  function openCreatePO(supplierId?: string) {
    setPrefillSupplier(supplierId);
    setShowCreatePO(true);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage suppliers and purchase orders</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => openCreatePO()}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition"
          >
            <FileText className="h-4 w-4" />
            New Order
          </button>
          <button
            onClick={() => setShowAddSupplier(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition"
          >
            <Plus className="h-4 w-4" />
            Add Supplier
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Suppliers", value: suppliers.length, icon: "🤝" },
          { label: "Pending Orders", value: pendingOrders, icon: "📋" },
          { label: "Total Received", value: formatCurrency(totalSpend), icon: "💰" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">{s.icon}</span>
            <div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="font-bold text-gray-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs + content */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center gap-0 border-b border-gray-100 px-1 pt-1">
          <button onClick={() => setTab("suppliers")} className={tab("suppliers", tab)}>
            <Truck className="h-3.5 w-3.5" /> Suppliers ({suppliers.length})
          </button>
          <button onClick={() => setTab("orders")} className={tab("orders", tab)}>
            <ClipboardList className="h-3.5 w-3.5" /> Purchase Orders ({totalOrders})
          </button>

          <div className="ml-auto flex items-center gap-2 px-4 py-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search…"
                className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
              />
            </div>
          </div>
        </div>

        {/* ── SUPPLIERS TAB ── */}
        {tab === "suppliers" && (
          loadingSuppliers ? <PageSpinner /> :
          filteredSuppliers.length === 0 ? (
            <EmptyState icon="🤝" title="No suppliers yet" sub="Add your first supplier to start creating purchase orders" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {filteredSuppliers.map((s: any) => (
                <div key={s.id} className="border border-gray-100 rounded-xl p-4 hover:border-blue-200 hover:shadow-sm transition group">
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
                    {s.rating && (
                      <div className="flex items-center gap-0.5 text-yellow-500">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        <span className="text-xs font-medium text-gray-600">{s.rating}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-500">
                    {s.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 flex-shrink-0" />
                        <span>{s.phone}</span>
                      </div>
                    )}
                    {s.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{s.email}</span>
                      </div>
                    )}
                    {(s.city || s.address) && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span>{[s.city, s.address].filter(Boolean).join(", ")}</span>
                      </div>
                    )}
                  </div>

                  {s.notes && (
                    <p className="text-xs text-gray-400 mt-2 bg-gray-50 rounded-lg px-2 py-1.5 line-clamp-2">{s.notes}</p>
                  )}

                  <button
                    onClick={() => openCreatePO(s.id)}
                    className="mt-3 w-full py-1.5 text-xs font-medium text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-50 transition opacity-0 group-hover:opacity-100"
                  >
                    + Create Purchase Order
                  </button>
                </div>
              ))}
            </div>
          )
        )}

        {/* ── PURCHASE ORDERS TAB ── */}
        {tab === "orders" && (
          loadingOrders ? <PageSpinner /> :
          filteredOrders.length === 0 ? (
            <EmptyState icon="📋" title="No purchase orders yet" sub="Create your first order from the Suppliers tab" />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3">Order No.</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredOrders.map((order: any) => {
                  const st = PO_STATUS[order.status] ?? { label: order.status, variant: "default" };
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm font-medium text-blue-600">{order.orderNo}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                            {order.supplier?.name?.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{order.supplier?.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{order.items?.length ?? 0} items</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(Number(order.totalAmount))}</td>
                      <td className="px-4 py-3"><Badge variant={st.variant}>{st.label}</Badge></td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(order.orderedAt)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {order.receivedAt ? formatDate(order.receivedAt) : <span className="text-gray-300">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        )}
      </div>

      <AddSupplierModal open={showAddSupplier} onClose={() => setShowAddSupplier(false)} />
      <CreatePOModal open={showCreatePO} onClose={() => setShowCreatePO(false)} prefillSupplierId={prefillSupplier} />
    </div>
  );
}

// helper to avoid repetition
function tab(id: Tab, current: Tab) {
  return `flex items-center gap-1.5 px-5 py-3 text-sm font-medium rounded-t-lg transition capitalize ${
    current === id ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-800"
  }`;
}
