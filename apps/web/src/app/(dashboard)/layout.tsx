import { Sidebar } from "@/components/layout/Sidebar";
import { OfflineBanner } from "@/components/layout/OfflineBanner";
import { OrderNotificationListener } from "@/components/layout/OrderNotificationListener";
import { SubscriptionBanner } from "@/components/layout/SubscriptionBanner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F4F2FF" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <SubscriptionBanner />
        <OfflineBanner />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
      <OrderNotificationListener />
    </div>
  );
}
