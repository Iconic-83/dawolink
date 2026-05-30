import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { Colors } from "../../constants/colors";

const STEPS = [
  { key: "PENDING",            label: "Placed",      icon: "time-outline" },
  { key: "CONFIRMED",          label: "Confirmed",   icon: "checkmark-circle-outline" },
  { key: "PREPARING",          label: "Preparing",   icon: "construct-outline" },
  { key: "READY_FOR_PICKUP",   label: "Ready",       icon: "bag-check-outline" },
  { key: "OUT_FOR_DELIVERY",   label: "On the Way",  icon: "bicycle-outline" },
  { key: "DELIVERED",          label: "Delivered",   icon: "checkmark-done-circle-outline" },
];

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [hasReview, setHasReview] = useState(false);

  useEffect(() => {
    api.get(`/v1/marketplace/orders/${id}`)
      .then(r => {
        setOrder(r.data);
        if (r.data.status === "DELIVERED") {
          api.get(`/v1/marketplace/orders/${id}/review`)
            .then(rev => setHasReview(!!rev.data))
            .catch(() => {});
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function cancel() {
    Alert.alert("Cancel Order", "Are you sure?", [
      { text: "No", style: "cancel" },
      {
        text: "Cancel Order", style: "destructive", onPress: async () => {
          setCancelling(true);
          try {
            const { data } = await api.patch(`/v1/marketplace/orders/${id}/cancel`);
            setOrder(data);
          } catch (e: any) {
            Alert.alert("Error", e.response?.data?.message ?? "Failed");
          } finally { setCancelling(false); }
        },
      },
    ]);
  }

  if (loading) return <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator size="large" color={Colors.accent} /></View>;
  if (!order) return <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><Text>Order not found</Text></View>;

  const currentIdx = STEPS.findIndex(s => s.key === order.status);
  const isCancelled = order.status === "CANCELLED";
  const canCancel = order.status === "PENDING";
  const isDelivered = order.status === "DELIVERED";

  return (
    <>
      <Stack.Screen options={{ title: `#${order.orderNo}` }} />
      <ScrollView style={{ flex: 1, backgroundColor: Colors.gray50 }}>

        {/* Status timeline */}
        {!isCancelled ? (
          <View style={s.timeline}>
            {STEPS.map((step, i) => {
              const done = i <= currentIdx;
              const active = i === currentIdx;
              return (
                <View key={step.key} style={s.step}>
                  <View style={[s.dot, done && s.dotDone, active && s.dotActive]}>
                    <Ionicons name={step.icon as any} size={14} color={done ? "#fff" : Colors.gray400} />
                  </View>
                  {i < STEPS.length - 1 && <View style={[s.line, i < currentIdx && s.lineDone]} />}
                  <Text style={[s.stepLabel, done && s.stepLabelDone]}>{step.label}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={s.cancelledBanner}>
            <Ionicons name="close-circle" size={20} color={Colors.red} />
            <Text style={s.cancelledText}>Order Cancelled</Text>
          </View>
        )}

        {/* Order info */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Order Summary</Text>
          {order.items?.map((item: any) => (
            <View key={item.id} style={s.item}>
              <Text style={s.itemName}>{item.medicineName}</Text>
              <Text style={s.itemQty}>×{item.quantity}</Text>
              <Text style={s.itemTotal}>${Number(item.total).toFixed(2)}</Text>
            </View>
          ))}
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total</Text>
            <Text style={s.total}>${Number(order.total).toFixed(2)}</Text>
          </View>
        </View>

        {/* Delivery info */}
        {order.deliveryAddress && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Delivery Address</Text>
            <Text style={s.address}>📍 {order.deliveryAddress}{order.deliveryCity ? `, ${order.deliveryCity}` : ""}</Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={s.actions}>
          <TouchableOpacity style={s.chatBtn} onPress={() => router.push(`/chat/${order.id}`)}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.primary} />
            <Text style={s.chatBtnText}>Chat with Pharmacy</Text>
          </TouchableOpacity>

          {isDelivered && (
            <TouchableOpacity
              style={[s.rateBtn, hasReview && s.rateBtnDone]}
              onPress={() => router.push(`/rate/${order.id}`)}
            >
              <Ionicons
                name={hasReview ? "star" : "star-outline"}
                size={18}
                color={hasReview ? Colors.amber : Colors.primary}
              />
              <Text style={[s.rateBtnText, hasReview && s.rateBtnTextDone]}>
                {hasReview ? "View Your Review" : "Rate Pharmacy"}
              </Text>
            </TouchableOpacity>
          )}

          {canCancel && (
            <TouchableOpacity style={s.cancelBtn} onPress={cancel} disabled={cancelling}>
              {cancelling
                ? <ActivityIndicator size="small" color={Colors.red} />
                : <><Ionicons name="close-circle-outline" size={18} color={Colors.red} />
                  <Text style={s.cancelBtnText}>Cancel Order</Text></>}
            </TouchableOpacity>
          )}
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </>
  );
}

const s = StyleSheet.create({
  timeline: { flexDirection: "row", backgroundColor: "#fff", padding: 20, margin: 16, borderRadius: 16, justifyContent: "space-between", alignItems: "flex-start" },
  step: { alignItems: "center", flex: 1 },
  dot: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.gray200, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  dotDone: { backgroundColor: Colors.accent },
  dotActive: { backgroundColor: Colors.primary, shadowColor: Colors.primary, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  line: { position: "absolute", top: 13, left: "60%", right: "-40%", height: 2, backgroundColor: Colors.gray200 },
  lineDone: { backgroundColor: Colors.accent },
  stepLabel: { fontSize: 9, color: Colors.gray400, textAlign: "center", fontWeight: "600" },
  stepLabelDone: { color: Colors.accent },
  cancelledBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.red + "15", margin: 16, borderRadius: 14, padding: 14 },
  cancelledText: { fontSize: 15, fontWeight: "700", color: Colors.red },
  card: { backgroundColor: "#fff", marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 16 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: Colors.gray900, marginBottom: 12 },
  item: { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 },
  itemName: { flex: 1, fontSize: 14, color: Colors.gray900 },
  itemQty: { fontSize: 13, color: Colors.gray400 },
  itemTotal: { fontSize: 14, fontWeight: "700", color: Colors.gray900, minWidth: 50, textAlign: "right" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: Colors.gray100, paddingTop: 10, marginTop: 6 },
  totalLabel: { fontSize: 15, fontWeight: "700", color: Colors.gray900 },
  total: { fontSize: 18, fontWeight: "900", color: Colors.primary },
  address: { fontSize: 14, color: Colors.gray600, lineHeight: 22 },
  actions: { paddingHorizontal: 16, gap: 10 },
  chatBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderWidth: 2, borderColor: Colors.primary, borderRadius: 14, paddingVertical: 13,
  },
  chatBtnText: { fontSize: 15, fontWeight: "700", color: Colors.primary },
  rateBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderWidth: 2, borderColor: Colors.primary, borderRadius: 14, paddingVertical: 13,
  },
  rateBtnDone: { borderColor: Colors.amber, backgroundColor: Colors.amber + "10" },
  rateBtnText: { fontSize: 15, fontWeight: "700", color: Colors.primary },
  rateBtnTextDone: { color: Colors.amber },
  cancelBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderWidth: 2, borderColor: Colors.red, borderRadius: 14, paddingVertical: 13,
  },
  cancelBtnText: { fontSize: 15, fontWeight: "700", color: Colors.red },
});
