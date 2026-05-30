"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Clock, CheckCircle, User, Package } from "lucide-react";

function timeLeft(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m left` : `${m}m left`;
}

export default function ReservationsPage() {
  const qc = useQueryClient();

  const { data = [], isLoading } = useQuery<any[]>({
    queryKey: ["pharmacy-reservations"],
    queryFn: () => api.get("/v1/reservations/pharmacy").then(r => r.data),
    refetchInterval: 30000,
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/v1/reservations/${id}/confirm`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pharmacy-reservations"] }),
  });

  if (isLoading) return <div className="text-center py-16 text-gray-400">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Medicine Reservations</h1>
        <p className="text-sm text-gray-500 mt-1">
          Active stock holds from customers — auto-expire after 2 hours
        </p>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Package className="w-12 h-12 mx-auto mb-3" />
          <p className="font-semibold">No active reservations</p>
          <p className="text-sm mt-1">Customers can reserve medicines for up to 2 hours</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((r: any) => {
            const remaining = new Date(r.expiresAt).getTime() - Date.now();
            const isUrgent = remaining < 30 * 60 * 1000;
            return (
              <div key={r.id} className={`bg-white border rounded-2xl p-5 ${isUrgent ? "border-amber-300" : "border-gray-100"}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-4 h-4 text-indigo-600" />
                      <span className="font-bold text-gray-900">{r.medicineName}</span>
                      <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
                        Qty: {r.quantity}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <User className="w-3.5 h-3.5" />
                      <span>{r.appUser?.name}</span>
                      <span>·</span>
                      <span>{r.appUser?.phone}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${isUrgent ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                      <Clock className="w-3 h-3" />
                      {timeLeft(r.expiresAt)}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{new Date(r.createdAt).toLocaleTimeString()}</p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                  <button
                    onClick={() => confirmMutation.mutate(r.id)}
                    disabled={confirmMutation.isPending}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Customer Arrived — Confirm
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
