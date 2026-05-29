"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import { ShoppingBag } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const RECONNECT_DELAY = 5_000;

/** Plays a short two-tone alert using the Web Audio API — no audio files needed. */
function playAlertSound() {
  try {
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    gain.connect(ctx.destination);

    [880, 1100].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
      osc.connect(gain);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.25);
    });
  } catch {
    // AudioContext blocked (e.g. no user gesture yet) — silent fallback
  }
}

/** Requests Notification permission once and shows a browser notification
 *  when the page is not visible (tab in background). */
function showBrowserNotification(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (document.visibilityState === "visible") return;

  if (Notification.permission === "default") {
    Notification.requestPermission();
    return;
  }
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: "/logo.png", tag: "new-order" });
  }
}

export function OrderNotificationListener() {
  const token = useAuthStore(s => s.token);
  const qc = useQueryClient();
  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Request notification permission early, after first user interaction
    if ("Notification" in window && Notification.permission === "default") {
      document.addEventListener("click", () => Notification.requestPermission(), { once: true });
    }
  }, []);

  useEffect(() => {
    if (!token) return;

    function connect() {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }

      const url = `${API_URL}/v1/orders/stream?token=${encodeURIComponent(token!)}`;
      const es = new EventSource(url);
      esRef.current = es;

      es.onmessage = (e) => {
        let data: { type: string; payload?: any };
        try { data = JSON.parse(e.data); } catch { return; }
        if (data.type !== "new_order") return;

        const p = data.payload;
        const label = p.deliveryType === "DELIVERY" ? "Delivery" : "Pickup";
        const itemWord = p.itemCount === 1 ? "item" : "items";

        // In-app toast
        toast.custom(() => (
          <div className="flex items-start gap-3 bg-white border border-amber-200 shadow-lg rounded-xl px-4 py-3 w-80">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <ShoppingBag className="h-4 w-4 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm">New Order!</p>
              <p className="text-xs text-gray-600 mt-0.5 truncate">
                {p.customerName} · {p.itemCount} {itemWord} · ${Number(p.total).toFixed(2)}
              </p>
              <p className="text-xs text-amber-700 font-semibold mt-1">{p.orderNo} · {label}</p>
            </div>
          </div>
        ), { duration: 8000 });

        // Sound
        playAlertSound();

        // Browser notification when tab is hidden
        showBrowserNotification(
          `New Order — ${p.orderNo}`,
          `${p.customerName} · ${p.itemCount} ${itemWord} · $${Number(p.total).toFixed(2)} · ${label}`,
        );

        // Refresh order data
        qc.invalidateQueries({ queryKey: ["orders"] });
        qc.invalidateQueries({ queryKey: ["order-stats"] });
      };

      es.onerror = () => {
        es.close();
        esRef.current = null;
        // Reconnect after delay — handles token expiry, server restarts, network blips
        retryRef.current = setTimeout(connect, RECONNECT_DELAY);
      };
    }

    connect();

    return () => {
      esRef.current?.close();
      esRef.current = null;
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, [token, qc]);

  return null;
}
