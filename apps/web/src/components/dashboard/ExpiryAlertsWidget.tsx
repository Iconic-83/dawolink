"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

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
    <div className="bg-white border rounded-xl p-4">
      <h3 className="font-semibold text-sm mb-3">Expiry Alerts</h3>
      <div className="space-y-2">
        <Row label="Expired" count={totals.expired} color="bg-red-100 text-red-700" />
        <Row label="Expire &lt; 30 days" count={totals.critical} color="bg-orange-100 text-orange-700" />
        <Row label="Expire &lt; 60 days" count={totals.warning} color="bg-yellow-100 text-yellow-700" />
      </div>
    </div>
  );
}

function Row({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>{count}</span>
    </div>
  );
}
