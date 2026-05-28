"use client";

import { useEffect, useState } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { getPendingCount, onSyncStatusChange, processSyncQueue, SyncStatus } from "@/lib/sync";

export function OfflineBanner() {
  const { isOnline, justReconnected } = useOnlineStatus();
  const [pending, setPending] = useState(0);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");

  useEffect(() => {
    const refresh = async () => setPending(await getPendingCount());
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [isOnline]);

  useEffect(() => {
    return onSyncStatusChange(async (status) => {
      setSyncStatus(status);
      setPending(await getPendingCount());
      if (status === "success") setTimeout(() => setSyncStatus("idle"), 3000);
    });
  }, []);

  const handleManualSync = async () => {
    if (!isOnline) return;
    await processSyncQueue();
    setPending(await getPendingCount());
  };

  if (isOnline && pending === 0 && syncStatus === "idle") return null;

  // Syncing
  if (syncStatus === "syncing") {
    return (
      <div style={{ background: "#2D1B8E", color: "white", padding: "8px 20px", display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 500 }}>
        <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span>
        Syncing offline data to server…
        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      </div>
    );
  }

  // Just synced successfully
  if (justReconnected && syncStatus === "success") {
    return (
      <div style={{ background: "#00C897", color: "white", padding: "8px 20px", display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600 }}>
        ✓ Back online — all offline data synced
      </div>
    );
  }

  // Offline
  if (!isOnline) {
    return (
      <div style={{ background: "#1a1a2e", color: "#FFD166", padding: "8px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span>📡</span>
          <span style={{ fontWeight: 700 }}>Offline Mode</span>
          <span style={{ opacity: 0.8 }}>— POS and inventory updates are saved locally and will sync when internet returns.</span>
        </div>
        {pending > 0 && (
          <span style={{ background: "#FFD166", color: "#1a1a2e", borderRadius: 12, padding: "2px 10px", fontWeight: 700, fontSize: 12 }}>
            {pending} pending
          </span>
        )}
      </div>
    );
  }

  // Online but pending items remain
  if (isOnline && pending > 0) {
    return (
      <div style={{ background: "#FFF7ED", borderBottom: "1px solid #FED7AA", color: "#92400E", padding: "8px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>⏳</span>
          <span><strong>{pending}</strong> offline operation{pending !== 1 ? "s" : ""} waiting to sync</span>
        </div>
        <button
          onClick={handleManualSync}
          style={{ padding: "4px 14px", borderRadius: 6, border: "none", background: "#F97316", color: "white", fontWeight: 700, fontSize: 12, cursor: "pointer" }}
        >
          Sync Now
        </button>
      </div>
    );
  }

  return null;
}
