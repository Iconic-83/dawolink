import { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../lib/api";
import { Colors } from "../constants/colors";

export default function ChatsScreen() {
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
    <>
      <Stack.Screen
        options={{
          title: "Messages",
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "800" },
        }}
      />
      <FlatList
        data={orders}
        keyExtractor={o => o.id}
        style={{ flex: 1, backgroundColor: Colors.gray50 }}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={Colors.accent}
          />
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="chatbubble-outline" size={52} color={Colors.gray200} />
            <Text style={s.emptyTitle}>No messages yet</Text>
            <Text style={s.emptySub}>Place an order to start chatting with a pharmacy</Text>
          </View>
        }
        renderItem={({ item: o }) => (
          <TouchableOpacity style={s.item} onPress={() => router.push(`/chat/${o.id}`)}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>
                {o.pharmacy?.name?.charAt(0)?.toUpperCase() ?? "P"}
              </Text>
            </View>
            <View style={s.info}>
              <Text style={s.phName}>{o.pharmacy?.name ?? "Pharmacy"}</Text>
              <Text style={s.orderNo}>Order #{o.orderNo}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.gray400} />
          </TouchableOpacity>
        )}
      />
    </>
  );
}

const s = StyleSheet.create({
  empty: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingTop: 80, gap: 12,
  },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: Colors.gray900 },
  emptySub: { fontSize: 14, color: Colors.gray400, textAlign: "center", lineHeight: 20 },
  item: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
    borderRadius: 16, padding: 14, marginBottom: 10, gap: 12,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 20 },
  info: { flex: 1 },
  phName: { fontSize: 15, fontWeight: "700", color: Colors.gray900 },
  orderNo: { fontSize: 13, color: Colors.gray400, marginTop: 2 },
});
