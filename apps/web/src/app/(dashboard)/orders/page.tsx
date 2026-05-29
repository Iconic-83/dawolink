"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import {
  ShoppingBag, Clock, CheckCircle2, Loader2, XCircle,
  Package, Truck, Phone, MapPin, ChevronRight,
  RefreshCw, User, AlertTriangle,
} from "lucide-react";

// ── Status config ──────────────────────────────────────────────────────────

const STATUS_META: Record<string, {
  label: string; variant: "success" | "warning" | "danger" | "info" | "default" | "muted";
  icon: React.ReactNode; next: { label: string; status: string; variant: string }[];
}> = {
  PENDING: {
    label: "Pending", variant: "warning",
    icon: <Clock className="h-3 w-3" />,
    next: [
      { label: "Confirm Order",  status: "CONFIRMED",  variant: "blue" },
      { label: "Cancel",         status: "CANCELLED",  variant: "red" },
    ],
  },
  CONFIRMED: {
    label: "Confirmed", variant: "info",
    icon: <CheckCircle2 className="h-3 w-3" />,
    next: [
      { label: "Start Preparing", status: "PREPARING", variant: "purple" },
      { label: "Cancel",          status: "CANCELLED", variant: "red" },
    ],
  },
  PREPARING: {
    label: "Preparing", variant: "default",
    icon: <Package className="h-3 w-3" />,
    next: [
      { label: "Ready for Pickup",  status: "READY_FOR_PICKUP",  variant: "green" },
      { label: "Out for Delivery",  status: "OUT_FOR_DELIVERY",  variant: "blue" },
      { label: "Cancel",            status: "CANCELLED",         variant: "red" },
    ],
  },
  READY_FOR_PICKUP: {
    label: "Ready for Pickup", variant: "success",
    icon: <Package className="h-3 w-3" />,
    next: [{ label: "Mark Delivered", status: "DELIVERED", variant: "green" }],
  },
  OUT_FOR_DELIVERY: {
    label: "Out for Delivery", variant: "info",
    icon: <Truck className="h-3 w-3" />,
    next: [{ label: "Mark Delivered", status: "DELIVERED", variant: "green" }],
  },
  DELIVERED: {
    label: "Delivered", variant: "success",
    icon: <CheckCircle2 className="h-3 w-3" />,
    next: [],
  },
  CANCELLED: {
    label: "Cancelled", variant: "danger",
    icon: <XCircle className="h-3 w-3" />,
    next: [],
  },
};

const BTN_VARIANT: Record<string, string> = {
  blue:   "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200",
  green:  "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200",
  purple: "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200",
  red:    "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200",
};

type TabKey = "ALL" | "PENDING" | "ACTIVE" | "DELIVERED" | "CANCELLED";

const TABS: { key: TabKey; label: string; statuses?: string[] }[] = [
  { key: "ALL",       label: "All Orders" },
  { key: "PENDING",   label: "Pending",   statuses: ["PENDING"] },
  { key: "ACTIVE",    label: "Active",    statuses: ["CONFIRMED","PREPARING","READY_FOR_PICKUP","OUT_FOR_DELIVERY"] },
  { key: "DELIVERED", label: "Delivered", statuses: ["DELIVERED"] },
  { key: "CANCELLED", label: "Cancelled", statuses: ["CANCELLED"] },
];

const PAYMENT_LABEL: Record<string, string> = {
  CASH: "Cash", EVC_PLUS: "EVC Plus", ZAAD: "Zaad", SAHAL: "Sahal",
};

// ── Stat card ──────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <div className={`bg-white rounded-xl p-4 border flex items-center gap-4 ${color}`}>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-current/10">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
      </div>
    </div>
  );
}

// ── Order detail modal ─────────────────────────────────────────────────────

function OrderDetailModal({ order, onClose, onStatusChange }: {
  order: any; onClose: () => void; onStatusChange: (status: string) => void;
}) {
  const meta = STATUS_META[order.status] ?? STATUS_META.PENDING;

  return (
    <Modal open onClose={onClose} title={`Order ${order.orderNo}`} size="md">
      <div className="space-y-5">

        {/* Status + actions */}
        <div className="flex items-center justify-between">
          <Badge variant={meta.variant} className="gap-1 py-1 px-2.5 text-xs">
            {meta.icon} {meta.label}
          </Badge>
          <span className="text-xs text-gray-400">{formatDate(order.createdAt)}</span>
        </div>

        {meta.next.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {meta.next.map(n => (
              <button
                key={n.status}
                onClick={() => onStatusChange(n.status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${BTN_VARIANT[n.variant]}`}
              >
                {n.label}
              </button>
            ))}
          </div>
        )}

        {/* Customer */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Customer</p>
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-gray-400" />
            <span className="font-medium text-gray-800">{order.appUser?.name ?? "—"}</span>
          </div>
          {order.appUser?.phone && (
            <a href={`tel:${order.appUser.phone}`} className="flex items-center gap-2 text-sm text-brand-teal hover:underline">
              <Phone className="h-4 w-4 text-gray-400" />
              {order.appUser.phone}
            </a>
          )}
          {order.deliveryType === "DELIVERY" && order.deliveryAddress && (
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <span>{order.deliveryAddress}{order.deliveryCity ? `, ${order.deliveryCity}` : ""}</span>
            </div>
          )}
        </div>

        {/* Items */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Items</p>
          <div className="space-y-2">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <div>
                  <p className="font-medium text-gray-800">{item.medicineName}</p>
                  <p className="text-gray-400 text-xs">Qty: {item.quantity} × {formatCurrency(Number(item.unitPrice))}</p>
                </div>
                <span className="font-semibold text-gray-700">{formatCurrency(Number(item.total))}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t space-y-1">
            {Number(order.deliveryFee) > 0 && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>Delivery fee</span><span>{formatCurrency(Number(order.deliveryFee))}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-gray-900">
              <span>Total</span><span>{formatCurrency(Number(order.total))}</span>
            </div>
          </div>
        </div>

        {/* Delivery + payment */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">Delivery</p>
            <p className="font-medium text-gray-700">
              {order.deliveryType === "DELIVERY" ? "🚚 Delivery" : "🏪 Pickup"}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">Payment</p>
            <p className="font-medium text-gray-700">
              {PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod ?? "—"}
            </p>
          </div>
        </div>

        {order.notes && (
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm text-amber-800">
            <p className="font-semibold mb-1 text-xs">Customer note</p>
            {order.notes}
          </div>
        )}
      </div>
    </Modal>
  );
}

// ── Order row card ─────────────────────────────────────────────────────────

function OrderCard({ order, onOpen, onStatusChange, isUpdating }: {
  order: any; onOpen: () => void;
  onStatusChange: (status: string) => void;
  isUpdating: boolean;
}) {
  const meta = STATUS_META[order.status] ?? STATUS_META.PENDING;
  const isNew = Date.now() - new Date(order.createdAt).getTime() < 5 * 60 * 1000; // <5 min

  return (
    <div
      className={`bg-white rounded-xl border transition hover:shadow-md cursor-pointer ${
        isNew && order.status === "PENDING" ? "border-amber-300 ring-1 ring-amber-200" : "border-gray-100"
      }`}
      onClick={onOpen}
    >
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {isNew && order.status === "PENDING" && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-amber-400 text-white animate-pulse flex-shrink-0">
                NEW
              </span>
            )}
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-sm">{order.orderNo}</p>
              <p className="text-xs text-gray-500 truncate">{order.appUser?.name ?? "Customer"} · {order.appUser?.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant={meta.variant} className="gap-1">
              {meta.icon} {meta.label}
            </Badge>
            <ChevronRight className="h-4 w-4 text-gray-300" />
          </div>
        </div>

        {/* Items summary */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-1">
          {order.items?.map((i: any) => `${i.medicineName} ×${i.quantity}`).join("  ·  ")}
        </p>

        {/* Footer row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>{order.deliveryType === "DELIVERY" ? "🚚 Delivery" : "🏪 Pickup"}</span>
            <span>{PAYMENT_LABEL[order.paymentMethod] ?? "—"}</span>
            <span>{formatDate(order.createdAt)}</span>
          </div>
          <span className="font-bold text-gray-900">{formatCurrency(Number(order.total))}</span>
        </div>
      </div>

      {/* Quick action buttons — stop propagation so they don't open modal */}
      {meta.next.length > 0 && (
        <div
          className="px-4 pb-3 flex gap-2 flex-wrap"
          onClick={e => e.stopPropagation()}
        >
          {meta.next.map(n => (
            <button
              key={n.status}
              disabled={isUpdating}
              onClick={() => onStatusChange(n.status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${BTN_VARIANT[n.variant]}`}
            >
              {isUpdating && <Loader2 className="h-3 w-3 animate-spin" />}
              {n.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabKey>("ALL");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const statusFilter = TABS.find(t => t.key === tab)?.statuses;
  const queryStatus = statusFilter?.length === 1 ? statusFilter[0] : undefined;

  const { data: stats } = useQuery<any>({
    queryKey: ["order-stats"],
    queryFn: () => api.get("/v1/orders/stats").then(r => r.data),
    refetchInterval: 30_000,
  });

  const { data: orders = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ["orders", tab],
    queryFn: () => api.get(`/v1/orders${queryStatus ? `?status=${queryStatus}` : ""}`).then(r => r.data),
    refetchInterval: 30_000,
  });

  // Client-side filter for multi-status tabs (ACTIVE)
  const filtered = tab === "ACTIVE"
    ? orders.filter(o => ["CONFIRMED","PREPARING","READY_FOR_PICKUP","OUT_FOR_DELIVERY"].includes(o.status))
    : orders;

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/v1/orders/${id}/status`, { status }).then(r => r.data),
    onMutate: ({ id }) => setUpdatingId(id),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["order-stats"] });
      toast.success(`Order ${updated.orderNo} → ${STATUS_META[updated.status]?.label}`);
      if (selectedOrder?.id === updated.id) setSelectedOrder(updated);
      setUpdatingId(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message ?? "Failed to update status");
      setUpdatingId(null);
    },
  });

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Online Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">Customer orders from the DawoLink shop</p>
        </div>
        <button
          onClick={() => { refetch(); qc.invalidateQueries({ queryKey: ["order-stats"] }); }}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
            label="Pending"
            value={stats.pending}
            color="border-amber-200"
          />
          <StatCard
            icon={<Package className="h-5 w-5 text-blue-600" />}
            label="Active"
            value={stats.confirmed + stats.preparing + stats.readyOrOut}
            color="border-blue-200"
          />
          <StatCard
            icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
            label="Delivered Today"
            value={stats.deliveredToday}
            color="border-green-200"
          />
          <StatCard
            icon={<ShoppingBag className="h-5 w-5 text-purple-600" />}
            label="Today's Revenue"
            value={formatCurrency(stats.todayRevenue)}
            color="border-purple-200"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(t => {
          const count = t.key === "PENDING" ? stats?.pending
            : t.key === "ACTIVE" ? (stats ? stats.confirmed + stats.preparing + stats.readyOrOut : 0)
            : undefined;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
              {count !== undefined && count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                  t.key === "PENDING" ? "bg-amber-400 text-white" : "bg-blue-100 text-blue-700"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Order list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading orders…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-gray-500">No orders here</p>
          <p className="text-sm mt-1">
            {tab === "PENDING" ? "New customer orders will appear here automatically." : "Nothing to show for this filter."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map((order: any) => (
            <OrderCard
              key={order.id}
              order={order}
              onOpen={() => setSelectedOrder(order)}
              onStatusChange={(status) => updateStatus({ id: order.id, status })}
              isUpdating={updatingId === order.id}
            />
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={(status) => updateStatus({ id: selectedOrder.id, status })}
        />
      )}
    </div>
  );
}
