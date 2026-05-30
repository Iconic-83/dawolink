import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl,
} from "react-native";
import { api } from "../../lib/api";
import { Colors } from "../../constants/colors";

const POINTS_PER_REDEEM = 10;

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export default function LoyaltyScreen() {
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const { data } = await api.get("/v1/marketplace/loyalty");
      setAccount(data);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator size="large" color={Colors.accent} /></View>;
  }

  const points = account?.points ?? 0;
  const lifetime = account?.lifetimeEarned ?? 0;
  const transactions: any[] = account?.transactions ?? [];
  const discountValue = Math.floor(points / POINTS_PER_REDEEM);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.gray50 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.accent} />}
    >
      {/* Balance card */}
      <View style={s.card}>
        <Text style={s.cardLabel}>YOUR POINTS</Text>
        <Text style={s.points}>{points.toLocaleString()}</Text>
        <Text style={s.sub}>= ${discountValue.toFixed(2)} discount at checkout</Text>
        <View style={s.row}>
          <View style={s.stat}>
            <Text style={s.statLabel}>LIFETIME EARNED</Text>
            <Text style={s.statValue}>{lifetime.toLocaleString()}</Text>
          </View>
          <View style={[s.stat, { borderLeftWidth: 1, borderLeftColor: "rgba(255,255,255,0.2)", paddingLeft: 20 }]}>
            <Text style={s.statLabel}>EARN RATE</Text>
            <Text style={s.statValue}>1pt / $1</Text>
          </View>
        </View>
      </View>

      {/* How it works */}
      <View style={s.howBox}>
        <Text style={s.howTitle}>How it works</Text>
        {[
          { icon: "🛍️", text: "Earn 1 point for every $1 spent on delivered orders" },
          { icon: "💸", text: "Redeem 10 points = $1 off your next order" },
          { icon: "⚡", text: "Points applied at checkout automatically" },
        ].map((item, i) => (
          <View key={i} style={s.howRow}>
            <Text style={s.howIcon}>{item.icon}</Text>
            <Text style={s.howText}>{item.text}</Text>
          </View>
        ))}
      </View>

      {/* Transactions */}
      <Text style={s.sectionTitle}>Transaction History</Text>
      {transactions.length === 0 ? (
        <View style={s.empty}>
          <Text style={{ fontSize: 40, marginBottom: 8 }}>🏆</Text>
          <Text style={s.emptyText}>No transactions yet — start ordering!</Text>
        </View>
      ) : (
        transactions.map(tx => (
          <View key={tx.id} style={s.tx}>
            <View>
              <Text style={s.txLabel}>{tx.type === "EARNED" ? "Points Earned" : "Points Redeemed"}</Text>
              <Text style={s.txTime}>{tx.note ?? timeAgo(tx.createdAt)}</Text>
            </View>
            <Text style={[s.txPoints, { color: tx.points > 0 ? Colors.accent : Colors.red }]}>
              {tx.points > 0 ? "+" : ""}{tx.points}
            </Text>
          </View>
        ))
      )}
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: Colors.primary, margin: 16, borderRadius: 24,
    padding: 24, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8,
  },
  cardLabel: { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.5)", letterSpacing: 1.5 },
  points: { fontSize: 56, fontWeight: "900", color: Colors.accent, lineHeight: 64 },
  sub: { fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 20 },
  row: { flexDirection: "row" },
  stat: { flex: 1 },
  statLabel: { fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: "700", letterSpacing: 1 },
  statValue: { fontSize: 22, fontWeight: "900", color: "#fff", marginTop: 2 },
  howBox: { backgroundColor: "#fff", marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 12 },
  howTitle: { fontSize: 15, fontWeight: "700", color: Colors.gray900, marginBottom: 12 },
  howRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10, gap: 10 },
  howIcon: { fontSize: 18 },
  howText: { flex: 1, fontSize: 13, color: Colors.gray600, lineHeight: 18 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: Colors.gray900, marginHorizontal: 16, marginBottom: 8 },
  empty: { alignItems: "center", padding: 32 },
  emptyText: { fontSize: 14, color: Colors.gray400, textAlign: "center" },
  tx: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "#fff", marginHorizontal: 16, marginBottom: 8, borderRadius: 14, padding: 14,
  },
  txLabel: { fontSize: 14, fontWeight: "600", color: Colors.gray900 },
  txTime: { fontSize: 12, color: Colors.gray400, marginTop: 2 },
  txPoints: { fontSize: 20, fontWeight: "900" },
});
