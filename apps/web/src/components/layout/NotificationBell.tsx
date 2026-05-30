"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Bell, X, CheckCheck, AlertTriangle, Package,
  CreditCard, ArrowLeftRight, UserPlus, Info, ExternalLink,
} from "lucide-react";
import Link from "next/link";

const TYPE_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  EXPIRY_ALERT:           { icon: AlertTriangle, color: "text-amber-600",  bg: "bg-amber-50" },
  LOW_STOCK:              { icon: Package,       color: "text-orange-600", bg: "bg-orange-50" },
  SUBSCRIPTION_EXPIRING:  { icon: CreditCard,    color: "text-purple-600", bg: "bg-purple-50" },
  SUBSCRIPTION_EXPIRED:   { icon: CreditCard,    color: "text-red-600",    bg: "bg-red-50" },
  STOCK_TRANSFER:         { icon: ArrowLeftRight,color: "text-blue-600",   bg: "bg-blue-50" },
  STAFF_INVITE:           { icon: UserPlus,      color: "text-teal-600",   bg: "bg-teal-50" },
  SYSTEM:                 { icon: Info,          color: "text-gray-600",   bg: "bg-gray-50" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data: countData } = useQuery<{ count: number }>({
    queryKey: ["inbox-count"],
    queryFn: () => api.get("/v1/inbox/unread-count").then(r => r.data),
    refetchInterval: 30_000,
    staleTime: 20_000,
  });

  const { data, isLoading } = useQuery<any>({
    queryKey: ["inbox"],
    queryFn: () => api.get("/v1/inbox?limit=30").then(r => r.data),
    enabled: open,
    staleTime: 10_000,
  });

  const { mutate: markRead } = useMutation({
    mutationFn: (id: string) => api.patch(`/v1/inbox/${id}/read`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inbox"] });
      qc.invalidateQueries({ queryKey: ["inbox-count"] });
    },
  });

  const { mutate: markAllRead, isPending: markingAll } = useMutation({
    mutationFn: () => api.patch("/v1/inbox/read-all").then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inbox"] });
      qc.invalidateQueries({ queryKey: ["inbox-count"] });
    },
  });

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const unread = countData?.count ?? 0;
  const items: any[] = data?.items ?? [];

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-red-500 text-white flex items-center justify-center leading-none">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 text-sm">Notifications</span>
              {unread > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-600">{unread}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  onClick={() => markAllRead()}
                  disabled={markingAll}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 px-2 py-1 rounded-lg hover:bg-gray-100 transition"
                >
                  <CheckCheck className="h-3.5 w-3.5" /> All read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-96">
            {isLoading && (
              <div className="flex items-center justify-center py-10 text-gray-400 text-sm">Loading…</div>
            )}
            {!isLoading && items.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <Bell className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">No notifications yet</p>
              </div>
            )}
            {items.map((n: any) => {
              const meta = TYPE_META[n.type] ?? TYPE_META.SYSTEM;
              const Icon = meta.icon;
              return (
                <div
                  key={n.id}
                  className={`flex gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer ${!n.isRead ? "bg-blue-50/40" : ""}`}
                  onClick={() => { if (!n.isRead) markRead(n.id); }}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
                    <Icon className={`h-4 w-4 ${meta.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <p className={`text-sm leading-tight ${n.isRead ? "text-gray-700 font-normal" : "text-gray-900 font-semibold"}`}>
                        {n.title}
                      </p>
                      {!n.isRead && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-tight">{n.body}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-gray-400">{timeAgo(n.createdAt)}</span>
                      {n.link && (
                        <Link
                          href={n.link}
                          onClick={e => e.stopPropagation()}
                          className="flex items-center gap-0.5 text-[10px] text-blue-600 hover:underline"
                        >
                          View <ExternalLink className="h-2.5 w-2.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
