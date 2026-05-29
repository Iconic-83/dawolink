"use client";

import { useEffect, useState } from "react";
import { customerApi } from "@/lib/customer-auth";

/** Convert a base64url VAPID public key to a Uint8Array for pushManager.subscribe */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

type State = "idle" | "asking" | "subscribing" | "done" | "denied" | "unsupported";

interface Props {
  /** The logged-in AppUser id — component only renders when truthy */
  appUserId: string | undefined;
}

export function PushPermissionBanner({ appUserId }: Props) {
  const [state, setState] = useState<State>("idle");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!appUserId) return;
    if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "granted") { setState("done"); return; }
    if (Notification.permission === "denied")  { setState("denied");  return; }
    // permission === "default" — show the banner
    setState("asking");
  }, [appUserId]);

  async function handleEnable() {
    setState("subscribing");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setState("denied"); return; }

      // Get VAPID public key
      const { data } = await customerApi.get("/v1/marketplace/push/vapid-public-key");
      if (!data.key) { setState("done"); return; } // push disabled server-side

      // Subscribe via service worker
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.key) as unknown as ArrayBuffer,
      });

      const sub = subscription.toJSON();
      await customerApi.post("/v1/marketplace/push/subscribe", {
        endpoint: sub.endpoint,
        p256dh:   sub.keys?.p256dh,
        auth:     sub.keys?.auth,
      });

      setState("done");
    } catch {
      setState("asking"); // let them try again
    }
  }

  // Only render for a logged-in user who hasn't decided yet
  if (!appUserId || dismissed || state !== "asking" && state !== "subscribing") {
    return null;
  }

  return (
    <div style={{
      position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)",
      zIndex: 60, width: "calc(100% - 32px)", maxWidth: 480,
      background: "#fff", borderRadius: 16,
      boxShadow: "0 8px 32px rgba(24,13,98,0.18)",
      border: "1px solid #EDE9FF",
      padding: "16px 18px",
      display: "flex", alignItems: "flex-start", gap: 14,
      animation: "slideUp 0.3s ease",
    }}>
      <style>{`
        @keyframes slideUp {
          from { transform: translateX(-50%) translateY(20px); opacity: 0; }
          to   { transform: translateX(-50%) translateY(0);   opacity: 1; }
        }
      `}</style>

      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        background: "linear-gradient(135deg, #EDE9FF, #E6FAF4)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
      }}>
        🔔
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 14, color: "#180D62" }}>
          Enable order notifications
        </p>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: "#6B6B9A", lineHeight: 1.5 }}>
          Get notified when your order is confirmed, ready, or delivered — even when the app is closed.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleEnable}
            disabled={state === "subscribing"}
            style={{
              padding: "8px 16px", borderRadius: 10, border: "none",
              background: "linear-gradient(90deg, #00C897, #009E78)",
              color: "#fff", fontWeight: 700, fontSize: 13,
              cursor: state === "subscribing" ? "not-allowed" : "pointer",
              opacity: state === "subscribing" ? 0.7 : 1,
            }}
          >
            {state === "subscribing" ? "Enabling…" : "Enable Notifications"}
          </button>
          <button
            onClick={() => setDismissed(true)}
            style={{
              padding: "8px 12px", borderRadius: 10,
              background: "#F3F0FF", border: "none",
              color: "#6B6B9A", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            Not now
          </button>
        </div>
      </div>

      <button
        onClick={() => setDismissed(true)}
        style={{ background: "none", border: "none", cursor: "pointer", color: "#9B9BC0", fontSize: 18, padding: 0, flexShrink: 0 }}
      >
        ×
      </button>
    </div>
  );
}
