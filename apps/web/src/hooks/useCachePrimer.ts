"use client";

import { useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { cacheMedicines } from "@/lib/sync";
import { useAuthStore } from "@/store/auth.store";

export function useCachePrimer(branchId: string) {
  const user = useAuthStore(s => s.user);
  const lastPrimed = useRef<string>("");

  useEffect(() => {
    if (!branchId || !navigator.onLine) return;
    if (lastPrimed.current === branchId) return;
    lastPrimed.current = branchId;

    api.get(`/v1/inventory/branches/${branchId}/items`)
      .then(r => cacheMedicines(r.data, branchId, user?.pharmacyId ?? ""))
      .catch(() => {});
  }, [branchId, user?.pharmacyId]);
}
