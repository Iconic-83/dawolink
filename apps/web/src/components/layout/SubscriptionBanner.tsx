"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { AlertTriangle, XCircle, RefreshCw, Clock } from "lucide-react";

export function SubscriptionBanner() {
  const router = useRouter();
  const pathname = usePathname();

  // Don't show on the billing page itself (it has its own inline banners)
  const isBillingPage = pathname?.startsWith("/billing");

  const { data: sub } = useQuery<any>({
    queryKey: ["subscription"],
    queryFn: () => api.get("/v1/billing/subscription").then(r => r.data),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  if (!sub || isBillingPage) return null;

  const daysLeft = Math.ceil((new Date(sub.currentPeriodEnd).getTime() - Date.now()) / 86400000);
  const isExpired = sub.status === "EXPIRED" || sub.status === "PAST_DUE";
  const isTrial = sub.status === "TRIALING";
  const isActive = sub.status === "ACTIVE";

  const goToBilling = () => router.push("/billing");

  // Expired — red, every page
  if (isExpired) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 bg-red-600 text-white text-sm">
        <XCircle className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1 font-medium">
          Subscription expired — read-only mode. New sales and inventory changes are blocked.
        </span>
        <button
          onClick={goToBilling}
          className="flex items-center gap-1.5 px-3 py-1 bg-white text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition flex-shrink-0"
        >
          <RefreshCw className="h-3 w-3" /> Renew Now
        </button>
      </div>
    );
  }

  // Trial — 1 day left (red)
  if (isTrial && daysLeft <= 1) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 bg-red-500 text-white text-sm">
        <XCircle className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1 font-medium">Trial expires today! Subscribe now to keep access.</span>
        <button onClick={goToBilling}
          className="px-3 py-1 bg-white text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition flex-shrink-0">
          Subscribe
        </button>
      </div>
    );
  }

  // Trial — ≤3 days (orange)
  if (isTrial && daysLeft <= 3) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 bg-orange-500 text-white text-sm">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1 font-medium">Trial expires in {daysLeft} days. Renew to avoid interruption.</span>
        <button onClick={goToBilling}
          className="px-3 py-1 bg-white text-orange-600 rounded-lg text-xs font-bold hover:bg-orange-50 transition flex-shrink-0">
          Choose Plan
        </button>
      </div>
    );
  }

  // Trial — ≤7 days (amber)
  if (isTrial && daysLeft <= 7) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-500 text-white text-sm">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1">Your free trial ends in <strong>{daysLeft} days</strong>. Activate a plan to keep access.</span>
        <button onClick={goToBilling}
          className="px-3 py-1 bg-white text-amber-600 rounded-lg text-xs font-bold hover:bg-amber-50 transition flex-shrink-0">
          Upgrade
        </button>
      </div>
    );
  }

  // Active paid — ≤7 days (amber)
  if (isActive && daysLeft <= 7 && daysLeft > 0) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-500 text-white text-sm">
        <Clock className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1">Subscription expires in <strong>{daysLeft} day{daysLeft !== 1 ? "s" : ""}</strong>. Renew to avoid interruption.</span>
        <button onClick={goToBilling}
          className="px-3 py-1 bg-white text-amber-600 rounded-lg text-xs font-bold hover:bg-amber-50 transition flex-shrink-0">
          Renew
        </button>
      </div>
    );
  }

  // Active paid — ≤30 days (blue info bar)
  if (isActive && daysLeft <= 30 && daysLeft > 7) {
    return (
      <div className="flex items-center gap-3 px-4 py-2 bg-blue-600 text-white text-xs">
        <Clock className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="flex-1">Subscription renews in {daysLeft} days.</span>
        <button onClick={goToBilling}
          className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition flex-shrink-0">
          Renew Early
        </button>
      </div>
    );
  }

  return null;
}
