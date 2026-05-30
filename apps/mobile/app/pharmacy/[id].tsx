import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, TextInput, Modal,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { Colors } from "../../constants/colors";

const DELIVERY_METHODS = [
  { id: "CASH",     label: "Cash" },
  { id: "EVC_PLUS", label: "EVC Plus" },
  { id: "ZAAD",     label: "Zaad" },
  { id: "SAHAL",    label: "Sahal" },
];

export default function PharmacyScreen() {
  const { id, medicineId } = useLocalSearchParams<{ id: string; medicineId?: string }>();
  const router = useRouter();
  const [medicine, setMedicine] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showOrder, setShowOrder] = useState(false);
  const [qty, setQty] = useState(1);
  const [address, setAddress] = useState("");
  const [deliveryType, setDeliveryType] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [evcPhone, setEvcPhone] = useState("");
  const [ordering, setOrdering] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoResult, setPromoResult] = useState<any>(null);

  useEffect(() => {
    if (!medicineId) return;
    api.get(`/v1/marketplace/medicines/${medicineId}`)
      .then(r => setMedicine(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [medicineId]);

  const pharmacy = medicine?.pharmacies?.find((p: any) => p.pharmacyId === id) ?? medicine?.pharmacies?.[0];
  const price = pharmacy?.price ?? 0;
  const subtotal = price * qty;
  const deliveryFee = deliveryType === "DELIVERY" ? 2 : 0;
  const promoDiscount = promoResult?.discount ?? 0;
  const total = Math.max(0, subtotal + deliveryFee - promoDiscount);

  async function applyPromo() {
    if (!promoCode.trim()) return;
    try {
      const { data } = await api.post("/v1/marketplace/promotions/validate", {
        pharmacyId: id, code: promoCode.trim(), subtotal,
      });
      setPromoResult(data);
      Alert.alert("Promo Applied", `${data.description ?? data.code} — -$${data.discount.toFixed(2)} off`);
    } catch (e: any) {
      Alert.alert("Invalid Code", e.response?.data?.message ?? "Code not valid");
    }
  }

  async function placeOrder() {
    if (deliveryType === "DELIVERY" && !address.trim()) {
      Alert.alert("Address required", "Enter your delivery address"); return;
    }
    setOrdering(true);
    try {
      const { data } = await api.post("/v1/marketplace/orders", {
        pharmacyId: id,
        items: [{ medicineName: medicine.name, quantity: qty, unitPrice: price }],
        deliveryType,
        deliveryAddress: deliveryType === "DELIVERY" ? address : undefined,
        paymentMethod,
        promoCode: promoResult ? promoCode : undefined,
      });
      setShowOrder(false);
      Alert.alert("Order Placed! 🎉", `Order #${data.orderNo} confirmed. Track it in My Orders.`, [
        { text: "View Order", onPress: () => router.push(`/order/${data.id}`) },
        { text: "OK" },
      ]);
    } catch (e: any) {
      Alert.alert("Order Failed", e.response?.data?.message ?? "Please try again");
    } finally { setOrdering(false); }
  }

  if (loading) {
    return <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator size="large" color={Colors.accent} /></View>;
  }

  if (!medicine) {
    return <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><Text>Medicine not found</Text></View>;
  }

  return (
    <>
      <Stack.Screen options={{ title: medicine.name }} />
      <ScrollView style={{ flex: 1, backgroundColor: Colors.gray50 }}>
        {/* Medicine header */}
        <View style={s.medCard}>
          <View style={s.medIcon}><Text style={{ fontSize: 40 }}>💊</Text></View>
          <Text style={s.medName}>{medicine.name}</Text>
          {medicine.genericName && <Text style={s.medGeneric}>{medicine.genericName}</Text>}
          <View style={s.medMeta}>
            <Text style={s.metaBadge}>{medicine.form}</Text>
            <Text style={s.metaBadge}>{medicine.category}</Text>
            {medicine.requiresPrescription && <Text style={[s.metaBadge, { backgroundColor: Colors.red + "20", color: Colors.red }]}>Rx Required</Text>}
          </View>
        </View>

        {/* Pharmacy info */}
        {pharmacy && (
          <View style={s.phCard}>
            <Text style={s.phName}>{pharmacy.pharmacyName}</Text>
            <Text style={s.phCity}>📍 {pharmacy.city}</Text>
            <View style={s.priceRow}>
              <Text style={s.price}>${price.toFixed(2)}</Text>
              <View style={[s.avail, { backgroundColor: pharmacy.availability === "available" ? Colors.accent + "20" : Colors.amber + "20" }]}>
                <Text style={[s.availText, { color: pharmacy.availability === "available" ? Colors.accent : Colors.amber }]}>
                  {pharmacy.availability === "available" ? "In Stock" : "Low Stock"}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={s.orderBtn} onPress={() => setShowOrder(true)}>
              <Ionicons name="cart-outline" size={20} color="#fff" />
              <Text style={s.orderBtnText}>Order Now</Text>
            </TouchableOpacity>
          </View>
        )}

        {medicine.description && (
          <View style={s.descCard}>
            <Text style={s.descTitle}>About this medicine</Text>
            <Text style={s.desc}>{medicine.description}</Text>
          </View>
        )}
      </ScrollView>

      {/* Order modal */}
      <Modal visible={showOrder} animationType="slide" presentationStyle="pageSheet">
        <ScrollView style={{ flex: 1, backgroundColor: "#fff" }} keyboardShouldPersistTaps="handled">
          <View style={m.header}>
            <Text style={m.title}>Place Order</Text>
            <TouchableOpacity onPress={() => setShowOrder(false)}>
              <Ionicons name="close" size={24} color={Colors.gray600} />
            </TouchableOpacity>
          </View>

          <View style={m.summary}>
            <Text style={m.summaryText}>{medicine.name} — ${price.toFixed(2)} each</Text>
          </View>

          {/* Qty */}
          <View style={m.section}>
            <Text style={m.label}>Quantity</Text>
            <View style={m.qtyRow}>
              <TouchableOpacity style={m.qtyBtn} onPress={() => setQty(q => Math.max(1, q - 1))}>
                <Ionicons name="remove" size={20} color={Colors.primary} />
              </TouchableOpacity>
              <Text style={m.qty}>{qty}</Text>
              <TouchableOpacity style={m.qtyBtn} onPress={() => setQty(q => q + 1)}>
                <Ionicons name="add" size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Delivery type */}
          <View style={m.section}>
            <Text style={m.label}>Delivery</Text>
            <View style={m.toggleRow}>
              {(["DELIVERY", "PICKUP"] as const).map(t => (
                <TouchableOpacity key={t}
                  style={[m.toggle, deliveryType === t && m.toggleActive]}
                  onPress={() => setDeliveryType(t)}>
                  <Text style={[m.toggleText, deliveryType === t && m.toggleTextActive]}>
                    {t === "DELIVERY" ? "🚚 Delivery" : "🏪 Pickup"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {deliveryType === "DELIVERY" && (
            <View style={m.section}>
              <Text style={m.label}>Delivery Address</Text>
              <TextInput style={m.input} value={address} onChangeText={setAddress} placeholder="Enter your delivery address" multiline />
            </View>
          )}

          {/* Payment */}
          <View style={m.section}>
            <Text style={m.label}>Payment Method</Text>
            <View style={m.methodGrid}>
              {DELIVERY_METHODS.map(pm => (
                <TouchableOpacity key={pm.id}
                  style={[m.method, paymentMethod === pm.id && m.methodActive]}
                  onPress={() => setPaymentMethod(pm.id)}>
                  <Text style={[m.methodText, paymentMethod === pm.id && m.methodTextActive]}>{pm.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* EVC phone */}
          {paymentMethod !== "CASH" && (
            <View style={m.section}>
              <Text style={m.label}>{DELIVERY_METHODS.find(x => x.id === paymentMethod)?.label} Phone</Text>
              <TextInput style={m.input} value={evcPhone} onChangeText={setEvcPhone} placeholder="0615000000" keyboardType="phone-pad" />
            </View>
          )}

          {/* Promo code */}
          <View style={m.section}>
            <Text style={m.label}>Promo Code</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput
                style={[m.input, { flex: 1 }]}
                value={promoCode}
                onChangeText={v => { setPromoCode(v.toUpperCase()); setPromoResult(null); }}
                placeholder="Enter code"
                editable={!promoResult}
              />
              <TouchableOpacity style={m.promoBtn} onPress={promoResult ? () => { setPromoResult(null); setPromoCode(""); } : applyPromo}>
                <Text style={m.promoBtnText}>{promoResult ? "Remove" : "Apply"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Total */}
          <View style={m.totalBox}>
            <View style={m.totalRow}><Text style={m.totalLabel}>Subtotal</Text><Text style={m.totalVal}>${subtotal.toFixed(2)}</Text></View>
            {deliveryFee > 0 && <View style={m.totalRow}><Text style={m.totalLabel}>Delivery</Text><Text style={m.totalVal}>${deliveryFee.toFixed(2)}</Text></View>}
            {promoDiscount > 0 && <View style={m.totalRow}><Text style={[m.totalLabel, { color: Colors.accent }]}>Promo</Text><Text style={[m.totalVal, { color: Colors.accent }]}>-${promoDiscount.toFixed(2)}</Text></View>}
            <View style={[m.totalRow, { borderTopWidth: 1, borderTopColor: Colors.gray100, paddingTop: 8, marginTop: 4 }]}>
              <Text style={[m.totalLabel, { fontWeight: "800", color: Colors.gray900, fontSize: 16 }]}>Total</Text>
              <Text style={[m.totalVal, { fontWeight: "900", fontSize: 20 }]}>${total.toFixed(2)}</Text>
            </View>
          </View>

          <TouchableOpacity style={m.confirmBtn} onPress={placeOrder} disabled={ordering}>
            {ordering ? <ActivityIndicator color="#fff" /> : <Text style={m.confirmText}>Confirm Order · ${total.toFixed(2)}</Text>}
          </TouchableOpacity>
          <View style={{ height: 32 }} />
        </ScrollView>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  medCard: { backgroundColor: Colors.primary, alignItems: "center", padding: 24, paddingTop: 16 },
  medIcon: { width: 80, height: 80, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  medName: { fontSize: 22, fontWeight: "800", color: "#fff", textAlign: "center" },
  medGeneric: { fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 4, textAlign: "center" },
  medMeta: { flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap", justifyContent: "center" },
  metaBadge: { backgroundColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, fontSize: 12, fontWeight: "600" },
  phCard: { backgroundColor: "#fff", margin: 16, borderRadius: 20, padding: 20, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  phName: { fontSize: 18, fontWeight: "800", color: Colors.gray900 },
  phCity: { fontSize: 13, color: Colors.gray400, marginTop: 4, marginBottom: 12 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  price: { fontSize: 28, fontWeight: "900", color: Colors.primary },
  avail: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  availText: { fontSize: 12, fontWeight: "700" },
  orderBtn: { backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  orderBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  descCard: { backgroundColor: "#fff", marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 24 },
  descTitle: { fontSize: 15, fontWeight: "700", color: Colors.gray900, marginBottom: 8 },
  desc: { fontSize: 14, color: Colors.gray600, lineHeight: 22 },
});
const m = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  title: { fontSize: 18, fontWeight: "800", color: Colors.gray900 },
  summary: { backgroundColor: Colors.primary + "10", margin: 16, borderRadius: 12, padding: 14 },
  summaryText: { fontSize: 14, fontWeight: "600", color: Colors.primary },
  section: { paddingHorizontal: 20, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", color: Colors.gray600, marginBottom: 8 },
  input: { borderWidth: 1.5, borderColor: Colors.gray200, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: Colors.gray900 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 20 },
  qtyBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.primary + "10", alignItems: "center", justifyContent: "center" },
  qty: { fontSize: 22, fontWeight: "800", color: Colors.primary, minWidth: 30, textAlign: "center" },
  toggleRow: { flexDirection: "row", gap: 8 },
  toggle: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.gray200, alignItems: "center" },
  toggleActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + "10" },
  toggleText: { fontSize: 14, fontWeight: "600", color: Colors.gray600 },
  toggleTextActive: { color: Colors.accent },
  methodGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  method: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.gray200 },
  methodActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + "10" },
  methodText: { fontSize: 13, fontWeight: "600", color: Colors.gray600 },
  methodTextActive: { color: Colors.accent },
  promoBtn: { backgroundColor: Colors.gray100, paddingHorizontal: 16, borderRadius: 12, justifyContent: "center" },
  promoBtnText: { fontWeight: "700", color: Colors.gray900 },
  totalBox: { marginHorizontal: 20, marginBottom: 16, backgroundColor: Colors.gray50, borderRadius: 16, padding: 16 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  totalLabel: { fontSize: 14, color: Colors.gray600 },
  totalVal: { fontSize: 14, fontWeight: "700", color: Colors.gray900 },
  confirmBtn: { marginHorizontal: 20, backgroundColor: Colors.accent, borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  confirmText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
