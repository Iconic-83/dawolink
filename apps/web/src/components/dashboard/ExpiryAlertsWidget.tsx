"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AlertTriangle } from "lucide-react";

export function ExpiryAlertsWidget() {
  const { data = [] } = useQuery<any[]>({
    queryKey: ["expiry-alerts"],
    queryFn: () => api.get("/v1/expiry/alerts").then((r) => r.data),
  });

  const totals = data.reduce(
    (acc: any, b: any) => ({
      expired: acc.expired + b.expired,
      critical: acc.critical + b.critical,
      warning: acc.warning + b.warning,
    }),
    { expired: 0, critical: 0, warning: 0 },
  );

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-brand-purple-100">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-4 w-4" style={{ color: "#2D1B8E" }} />
        <h3 className="font-semibold text-sm" style={{ color: "#2D1B8E" }}>Expiry Alerts</h3>
      </div>
      <div className="space-y-2">
        <Row label="Expired" count={totals.expired} bg="#FEE2E2" fg="#DC2626" />
        <Row label="Expire &lt; 30 days" count={totals.critical} bg="#FEF3C7" fg="#D97706" />
        <Row label="Expire &lt; 60 days" count={totals.warning} bg="#FEF9C3" fg="#CA8A04" />
      </div>
    </div>
  );
}

function Row({ label, count, bg, fg }: { label: string; count: number; bg: string; fg: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className="text-xs font-bold px-2.5 py-0.5 rounded-full"
        style={{ background: bg, color: fg }}
      >
        {count}
      </span>
    </div>
  );
}
