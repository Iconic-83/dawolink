import { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { Colors } from "../../constants/colors";

const STATUS_META: Record<string, { label: string; color: string; icon: string }> = {
  PENDING:            { label: "Pending",         color: Colors.amber,  icon: "time-outline" },
  CONFIRMED:          { label: "Confirmed",        color: Colors.blue,   icon: "checkmark-circle-outline" },
  PREPARING:          { label: "Preparing",        color: "#7C3AED",     icon: "construct-outline" },
  READY_FOR_PICKUP:   { label: "Ready",            color: Colors.accent, icon: "bag-check-outline" },
  OUT_FOR_DELIVERY:   { label: "On the way",       color: Colors.blue,   icon: "bicycle-outline" },
  DELIVERED:          { label: "Delivered",        color: Colors.accent, icon: "checkmark-done-circle-outline" },
  CANCELLED:          { label: "Cancelled",        color: Colors.red,    icon: "close-circle-outline" },
};

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/v1/marketplace/orders");
      setOrders(data.orders ?? data);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.gray50 }}>
      <FlatList
        data={orders}
        keyExtractor={o => o.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.accent} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🛍️</Text>
            <Text style={s.emptyTitle}>No orders yet</Text>
            <Text style={s.emptySub}>Search for medicines to place your first order</Text>
          </View>
        }
        renderItem={({ item: o }) => {
          const meta = STATUS_META[o.status] ?? STATUS_META.PENDING;
          return (
            <TouchableOpacity style={s.card} onPress={() => router.push(`/order/${o.id}`)}>
              <View style={s.cardTop}>
                <View>
                  <Text style={s.orderNo}>#{o.orderNo}</Text>
                  <Text style={s.pharmacy}>{o.pharmacy?.name}</Text>
                </View>
                <View style={[s.badge, { backgroundColor: meta.color + "20" }]}>
                  <Ionicons name={meta.icon as any} size={14} color={meta.color} />
                  <Text style={[s.badgeText, { color: meta.color }]}>{meta.label}</Text>
                </View>
              </View>
              <View style={s.cardBottom}>
                <Text style={s.items}>{o.items?.length} item{o.items?.length !== 1 ? "s" : ""}</Text>
                <Text style={s.total}>${Number(o.total).toFixed(2)}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 80 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: Colors.gray900, marginBottom: 8 },
  emptySub: { fontSize: 14, color: Colors.gray400, textAlign: "center" },
  card: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  orderNo: { fontSize: 15, fontWeight: "800", color: Colors.primary },
  pharmacy: { fontSize: 13, color: Colors.gray400, marginTop: 2 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  cardBottom: { flexDirection: "row", justifyContent: "space-between", paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.gray100 },
  items: { fontSize: 13, color: Colors.gray400 },
  total: { fontSize: 15, fontWeight: "800", color: Colors.gray900 },
});
