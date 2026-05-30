import { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet,
  Alert, ActivityIndicator, ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { Colors } from "../../constants/colors";

const LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

export default function RateScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [existing, setExisting] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/v1/marketplace/orders/${orderId}/review`)
      .then(r => {
        if (r.data) {
          setExisting(r.data);
          setRating(r.data.rating);
          setComment(r.data.comment ?? "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId]);

  async function submit() {
    if (rating === 0) { Alert.alert("Please select a rating"); return; }
    setSubmitting(true);
    try {
      await api.post("/v1/marketplace/reviews", {
        orderId,
        rating,
        comment: comment.trim() || undefined,
      });
      Alert.alert("Thank you! 🎉", "Your review has been submitted.", [
        { text: "Done", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.message ?? "Failed to submit review");
    } finally { setSubmitting(false); }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  const isReadOnly = !!existing;

  return (
    <>
      <Stack.Screen
        options={{
          title: isReadOnly ? "Your Review" : "Rate Experience",
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "800" },
        }}
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: Colors.gray50 }}
        contentContainerStyle={s.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.card}>
          {isReadOnly ? (
            <View style={s.reviewedBadge}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.accent} />
              <Text style={s.reviewedText}>Review submitted</Text>
            </View>
          ) : null}

          <Text style={s.title}>
            {isReadOnly ? "You rated this pharmacy" : "How was your experience?"}
          </Text>
          <Text style={s.sub}>
            {isReadOnly
              ? "Thank you for your feedback"
              : "Rate the pharmacy and help other customers"}
          </Text>

          {/* Stars */}
          <View style={s.stars}>
            {[1, 2, 3, 4, 5].map(i => (
              <TouchableOpacity
                key={i}
                onPress={() => !isReadOnly && setRating(i)}
                disabled={isReadOnly}
                activeOpacity={isReadOnly ? 1 : 0.7}
              >
                <Ionicons
                  name={i <= rating ? "star" : "star-outline"}
                  size={46}
                  color={i <= rating ? Colors.amber : Colors.gray200}
                />
              </TouchableOpacity>
            ))}
          </View>

          {rating > 0 && (
            <Text style={s.ratingLabel}>{LABELS[rating]}</Text>
          )}

          {/* Comment */}
          <Text style={s.label}>Comment {isReadOnly ? "" : "(optional)"}</Text>
          <TextInput
            style={[s.input, isReadOnly && s.inputReadOnly]}
            value={comment}
            onChangeText={setComment}
            placeholder={isReadOnly ? "No comment added" : "Share your experience…"}
            placeholderTextColor={Colors.gray400}
            multiline
            numberOfLines={4}
            editable={!isReadOnly}
          />
        </View>

        {!isReadOnly && (
          <TouchableOpacity
            style={[s.btn, (rating === 0 || submitting) && s.btnDisabled]}
            onPress={submit}
            disabled={submitting || rating === 0}
          >
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>Submit Review</Text>}
          </TouchableOpacity>
        )}
      </ScrollView>
    </>
  );
}

const s = StyleSheet.create({
  container: { padding: 16 },
  card: {
    backgroundColor: "#fff", borderRadius: 20, padding: 24, marginBottom: 16,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  reviewedBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: Colors.accent + "15", borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6, alignSelf: "center", marginBottom: 16,
  },
  reviewedText: { fontSize: 13, fontWeight: "700", color: Colors.accent },
  title: { fontSize: 20, fontWeight: "800", color: Colors.gray900, textAlign: "center", marginBottom: 6 },
  sub: { fontSize: 14, color: Colors.gray400, textAlign: "center", marginBottom: 24, lineHeight: 20 },
  stars: { flexDirection: "row", justifyContent: "center", gap: 10, marginBottom: 10 },
  ratingLabel: {
    fontSize: 17, fontWeight: "700", color: Colors.primary,
    textAlign: "center", marginBottom: 24,
  },
  label: { fontSize: 13, fontWeight: "600", color: Colors.gray600, marginBottom: 8 },
  input: {
    borderWidth: 1.5, borderColor: Colors.gray200, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.gray900,
    minHeight: 100, textAlignVertical: "top",
  },
  inputReadOnly: { backgroundColor: Colors.gray50, color: Colors.gray600 },
  btn: {
    backgroundColor: Colors.accent, borderRadius: 16,
    paddingVertical: 16, alignItems: "center",
  },
  btnDisabled: { backgroundColor: Colors.gray200 },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
