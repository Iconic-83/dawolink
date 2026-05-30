"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { customerApi, useCustomerAuth } from "@/lib/customer-auth";
import Link from "next/link";

const POINTS_PER_REDEEM = 10;

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function LoyaltyPage() {
  const { user, loading: authLoading } = useCustomerAuth();
  const router = useRouter();
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { router.push("/shop/login"); return; }
    if (!authLoading) {
      customerApi.get("/v1/marketplace/loyalty")
        .then(r => { setAccount(r.data); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [authLoading, user]);

  if (authLoading || loading) return (
    <div style={{ textAlign: "center", padding: "80px 16px" }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #EDE9FF", borderTopColor: "#00C897", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const points = account?.points ?? 0;
  const lifetime = account?.lifetimeEarned ?? 0;
  const transactions: any[] = account?.transactions ?? [];
  const discountValue = Math.floor(points / POINTS_PER_REDEEM);

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px 80px" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ padding: "20px 0 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/shop" style={{ background: "none", border: "none", color: "#6B6B9A", fontSize: 14, cursor: "pointer", textDecoration: "none" }}>
          ← Back
        </Link>
      </div>

      {/* Balance card */}
      <div style={{
        background: "linear-gradient(135deg, #180D62, #2D1B8E)",
        borderRadius: 20, padding: "28px 24px", marginBottom: 20, color: "#fff",
        boxShadow: "0 8px 32px rgba(24,13,98,0.25)",
      }}>
        <p style={{ margin: "0 0 6px", fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
          Your Points
        </p>
        <p style={{ margin: "0 0 4px", fontSize: 52, fontWeight: 900, color: "#00C897", lineHeight: 1 }}>
          {points.toLocaleString()}
        </p>
        <p style={{ margin: "0 0 20px", fontSize: 14, color: "rgba(255,255,255,0.5)" }}>
          = ${discountValue.toFixed(2)} discount at checkout
        </p>
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "10px 14px", flex: 1 }}>
            <p style={{ margin: "0 0 2px", fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Lifetime Earned</p>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#fff" }}>{lifetime.toLocaleString()}</p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "10px 14px", flex: 1 }}>
            <p style={{ margin: "0 0 2px", fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Earn Rate</p>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#fff" }}>1pt / $1</p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div style={{ background: "#F4F2FF", borderRadius: 16, padding: "16px", marginBottom: 20, border: "1px solid #EDE9FF" }}>
        <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 14, color: "#180D62" }}>How it works</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { icon: "🛍️", text: "Earn 1 point for every $1 spent on delivered orders" },
            { icon: "💸", text: "Redeem 10 points = $1 off your next order" },
            { icon: "⚡", text: "Points are applied automatically at checkout" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <p style={{ margin: 0, fontSize: 13, color: "#6B6B9A" }}>{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction history */}
      <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 15, color: "#180D62" }}>
        Transaction History
      </p>

      {transactions.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#9B9BC0" }}>
          <p style={{ fontSize: 32, margin: "0 0 8px" }}>🏆</p>
          <p style={{ margin: 0, fontSize: 14 }}>No transactions yet</p>
          <p style={{ margin: "4px 0 0", fontSize: 13 }}>Start ordering to earn points!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {transactions.map((tx: any) => (
            <div key={tx.id} style={{
              background: "#fff", borderRadius: 14, padding: "14px 16px",
              border: "1px solid #EDE9FF", display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 600, color: "#180D62" }}>
                  {tx.type === "EARNED" ? "Points Earned" : tx.type === "REDEEMED" ? "Points Redeemed" : "Adjusted"}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "#9B9BC0" }}>{tx.note ?? timeAgo(tx.createdAt)}</p>
              </div>
              <p style={{
                margin: 0, fontSize: 18, fontWeight: 800,
                color: tx.points > 0 ? "#00C897" : "#EF4444",
              }}>
                {tx.points > 0 ? "+" : ""}{tx.points}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
