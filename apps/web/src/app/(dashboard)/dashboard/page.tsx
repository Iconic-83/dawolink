"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { RevenueTrendChart } from "@/components/dashboard/RevenueTrendChart";
import { ExpiryAlertsWidget } from "@/components/dashboard/ExpiryAlertsWidget";
import { LowStockWidget } from "@/components/dashboard/LowStockWidget";

export default function DashboardPage() {
  const { data, isLoading } = useQuery<any>({
    queryKey: ["dashboard"],
    queryFn: () => api.get("/v1/analytics/dashboard").then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-muted h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Your pharmacy at a glance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Today's Revenue"
          value={`$${data?.today.revenue.toLocaleString() ?? 0}`}
          sub={`${data?.today.transactions ?? 0} transactions`}
          color="blue"
          icon="💰"
        />
        <DashboardCard
          title="Monthly Revenue"
          value={`$${data?.month.revenue.toLocaleString() ?? 0}`}
          sub="This month"
          color="green"
          icon="📈"
        />
        <DashboardCard
          title="Low Stock Alerts"
          value={data?.inventory.lowStockCount ?? 0}
          sub="Items need restocking"
          color="orange"
          icon="⚠️"
        />
        <DashboardCard
          title="Expiring Soon"
          value={data?.inventory.expiringCount ?? 0}
          sub="Within 30 days"
          color="red"
          icon="⏰"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RevenueTrendChart />
        </div>
        <div className="space-y-4">
          <ExpiryAlertsWidget />
          <LowStockWidget />
        </div>
      </div>
    </div>
  );
}
