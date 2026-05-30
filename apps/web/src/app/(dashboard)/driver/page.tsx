"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Truck, CheckCircle2, MapPin, Phone, Package, Loader2, Clock, History } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useState } from "react";
import { ChatPanel } from "@/components/chat/ChatPanel";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function DeliveryCard({ order, onAccept, onDeliver, accepting, delivering }: {
  order: any;
  onAccept?: () => void;
  onDeliver?: () => void;
  accepting?: boolean;
  delivering?: boolean;
}) {
  const isReady = order.status === "READY_FOR_PICKUP";
  const isOutgoing = order.status === "OUT_FOR_DELIVERY";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-gray-900 text-sm">#{order.orderNo}</span>
            <Badge variant={isReady ? "warning" : "info"}>
              {isReady ? "Ready for Pickup" : "Out for Delivery"}
            </Badge>
          </div>
          <p className="text-xs text-gray-400">{timeAgo(order.createdAt)}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-gray-900">${Number(order.total).toFixed(2)}</p>
          <p className="text-xs text-gray-400">{order.items?.length} item{order.items?.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Pickup from pharmacy */}
      <div className="bg-indigo-50 rounded-xl p-3">
        <p className="text-xs font-semibold text-indigo-700 mb-1 flex items-center gap-1">
          <Package className="h-3.5 w-3.5" /> Pickup from
        </p>
        <p className="text-sm font-medium text-gray-900">{order.pharmacy?.name}</p>
        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
          <MapPin className="h-3 w-3" /> {order.pharmacy?.address}
        </p>
        {order.pharmacy?.phone && (
          <a href={`tel:${order.pharmacy.phone}`} className="text-xs text-indigo-600 flex items-center gap-1 mt-0.5">
            <Phone className="h-3 w-3" /> {order.pharmacy.phone}
          </a>
        )}
      </div>

      {/* Deliver to customer */}
      <div className="bg-emerald-50 rounded-xl p-3">
        <p className="text-xs font-semibold text-emerald-700 mb-1 flex items-center gap-1">
          <Truck className="h-3.5 w-3.5" /> Deliver to
        </p>
        <p className="text-sm font-medium text-gray-900">{order.appUser?.name}</p>
        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
          <MapPin className="h-3 w-3" /> {order.deliveryAddress ?? order.appUser?.address ?? "No address provided"}
          {order.deliveryCity && `, ${order.deliveryCity}`}
        </p>
        {order.appUser?.phone && (
          <a href={`tel:${order.appUser.phone}`} className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5">
            <Phone className="h-3 w-3" /> {order.appUser.phone}
          </a>
        )}
      </div>

      {/* Items */}
      <div className="space-y-1">
        {order.items?.map((item: any) => (
          <div key={item.id} className="flex items-center justify-between text-xs text-gray-600">
            <span>{item.medicineName}</span>
            <span className="font-medium">×{item.quantity}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        {isReady && onAccept && (
          <button
            onClick={onAccept}
            disabled={accepting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: "linear-gradient(90deg,#4A8FE5,#2563EB)" }}
          >
            {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
            Accept & Pick Up
          </button>
        )}
        {isOutgoing && onDeliver && (
          <button
            onClick={onDeliver}
            disabled={delivering}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: "linear-gradient(90deg,#00C897,#009E78)" }}
          >
            {delivering ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Mark Delivered
          </button>
        )}
        <ChatPanel orderId={order.id} orderNo={order.orderNo} myType="PHARMACY" />
      </div>
    </div>
  );
}

export default function DriverDashboard() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"active" | "history">("active");
  const [acting, setActing] = useState<Record<string, string>>({});

  const { data: deliveries = [], isLoading } = useQuery<any[]>({
    queryKey: ["driver-deliveries"],
    queryFn: () => api.get("/v1/driver/deliveries").then(r => r.data),
    refetchInterval: 30_000,
  });

  const { data: history = [], isLoading: loadingHistory } = useQuery<any[]>({
    queryKey: ["driver-history"],
    queryFn: () => api.get("/v1/driver/deliveries/history").then(r => r.data),
    enabled: tab === "history",
  });

  async function handleAccept(orderId: string) {
    setActing(a => ({ ...a, [orderId]: "accept" }));
    try {
      await api.patch(`/v1/driver/deliveries/${orderId}/accept`);
      qc.invalidateQueries({ queryKey: ["driver-deliveries"] });
      toast.success("Delivery accepted — head to the pharmacy to pick up");
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? "Failed");
    } finally {
      setActing(a => ({ ...a, [orderId]: "" }));
    }
  }

  async function handleDeliver(orderId: string) {
    setActing(a => ({ ...a, [orderId]: "deliver" }));
    try {
      await api.patch(`/v1/driver/deliveries/${orderId}/status`, { status: "DELIVERED" });
      qc.invalidateQueries({ queryKey: ["driver-deliveries"] });
      qc.invalidateQueries({ queryKey: ["driver-history"] });
      toast.success("Order marked as delivered");
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? "Failed");
    } finally {
      setActing(a => ({ ...a, [orderId]: "" }));
    }
  }

  const readyCount = deliveries.filter(d => d.status === "READY_FOR_PICKUP").length;
  const outCount = deliveries.filter(d => d.status === "OUT_FOR_DELIVERY").length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Truck className="h-6 w-6 text-blue-600" /> My Deliveries
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {readyCount > 0 && `${readyCount} ready for pickup · `}
          {outCount > 0 && `${outCount} out for delivery`}
          {readyCount === 0 && outCount === 0 && "No active deliveries"}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: "active" as const, label: "Active", icon: <Truck className="h-4 w-4" /> },
          { key: "history" as const, label: "History", icon: <History className="h-4 w-4" /> },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Active deliveries */}
      {tab === "active" && (
        <div className="space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading deliveries…
            </div>
          )}
          {!isLoading && deliveries.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Truck className="h-12 w-12 mb-3 opacity-20" />
              <p className="font-medium text-gray-600">No active deliveries</p>
              <p className="text-sm mt-1">You have no deliveries assigned right now</p>
            </div>
          )}
          {deliveries.map(order => (
            <DeliveryCard
              key={order.id}
              order={order}
              onAccept={order.status === "READY_FOR_PICKUP" ? () => handleAccept(order.id) : undefined}
              onDeliver={order.status === "OUT_FOR_DELIVERY" ? () => handleDeliver(order.id) : undefined}
              accepting={acting[order.id] === "accept"}
              delivering={acting[order.id] === "deliver"}
            />
          ))}
        </div>
      )}

      {/* History */}
      {tab === "history" && (
        <div className="space-y-3">
          {loadingHistory && (
            <div className="flex items-center justify-center py-10 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
            </div>
          )}
          {!loadingHistory && history.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <History className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No delivery history yet</p>
            </div>
          )}
          {history.map(order => (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-gray-900 text-sm">#{order.orderNo}</p>
                <p className="text-xs text-gray-500 mt-0.5">{order.appUser?.name} · {timeAgo(order.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">${Number(order.total).toFixed(2)}</span>
                <Badge variant={order.status === "DELIVERED" ? "success" : "danger"}>
                  {order.status === "DELIVERED" ? "Delivered" : "Cancelled"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
