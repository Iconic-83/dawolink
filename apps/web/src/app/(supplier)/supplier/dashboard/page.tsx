"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supplierApi, clearSupplierToken, getSupplierToken } from "@/lib/supplier-auth";
import { Truck, Package, CheckCircle2, Clock, XCircle, DollarSign, LogOut, ChevronRight } from "lucide-react";

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:            { label: "Pending",           color: "#D97706", bg: "#FEF3C7" },
  CONFIRMED:          { label: "Confirmed",         color: "#2563EB", bg: "#DBEAFE" },
  PARTIALLY_RECEIVED: { label: "Partial",           color: "#7C3AED", bg: "#EDE9FE" },
  RECEIVED:           { label: "Received",          color: "#059669", bg: "#D1FAE5" },
  CANCELLED:          { label: "Cancelled",         color: "#DC2626", bg: "#FEE2E2" },
};

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export default function SupplierDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getSupplierToken()) { router.push("/supplier/login"); return; }
    Promise.all([
      supplierApi.get("/v1/supplier-portal/auth/me"),
      supplierApi.get("/v1/supplier-portal/stats"),
      supplierApi.get("/v1/supplier-portal/orders"),
    ]).then(([me, st, ord]) => {
      setUser(me.data);
      setStats(st.data);
      setOrders(ord.data);
      setLoading(false);
    }).catch(() => { clearSupplierToken(); router.push("/supplier/login"); });
  }, []);

  function logout() { clearSupplierToken(); router.push("/supplier/login"); }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 rounded-full border-2 border-transparent border-t-emerald-500 animate-spin" />
    </div>
  );

  const pendingOrders = orders.filter(o => o.status === "PENDING");
  const otherOrders = orders.filter(o => o.status !== "PENDING");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#180D62,#2D1B8E)" }}>
            <Truck className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-gray-900">Dawo<span style={{ color: "#00C897" }}>Link</span> Supplier</p>
            <p className="text-xs text-gray-400">{user?.supplier?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-600">{user?.firstName} {user?.lastName}</p>
          <button onClick={logout} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Pending", value: stats?.pending, icon: Clock, color: "#D97706" },
            { label: "Confirmed", value: stats?.confirmed, icon: CheckCircle2, color: "#2563EB" },
            { label: "Received", value: stats?.received, icon: Package, color: "#059669" },
            { label: "Revenue", value: `$${(stats?.totalRevenue ?? 0).toFixed(0)}`, icon: DollarSign, color: "#7C3AED" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className="h-4 w-4" style={{ color: s.color }} />
                <p className="text-xs font-medium text-gray-500">{s.label}</p>
              </div>
              <p className="text-2xl font-black text-gray-900">{s.value ?? 0}</p>
            </div>
          ))}
        </div>

        {/* Pending Orders - needs action */}
        {pendingOrders.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> {pendingOrders.length} order{pendingOrders.length !== 1 ? "s" : ""} awaiting your response
            </p>
            <div className="space-y-3">
              {pendingOrders.map(o => <OrderRow key={o.id} order={o} />)}
            </div>
          </div>
        )}

        {/* All orders */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-3">All Orders</p>
          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
              <Package className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No purchase orders yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map(o => <OrderRow key={o.id} order={o} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OrderRow({ order }: { order: any }) {
  const meta = STATUS_META[order.status] ?? STATUS_META.PENDING;
  return (
    <Link href={`/supplier/orders/${order.id}`}
      className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 p-4 hover:border-gray-200 hover:shadow-sm transition">
      <div className="flex items-center gap-3">
        <div>
          <p className="font-semibold text-gray-900 text-sm">#{order.orderNo}</p>
          <p className="text-xs text-gray-400 mt-0.5">{order.items?.length} item{order.items?.length !== 1 ? "s" : ""} · ${Number(order.totalAmount).toFixed(2)}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
          style={{ background: meta.bg, color: meta.color }}>{meta.label}</span>
        <ChevronRight className="h-4 w-4 text-gray-300" />
      </div>
    </Link>
  );
}
