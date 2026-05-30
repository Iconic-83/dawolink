import { useState, useCallback } from "react";
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { Colors } from "../../constants/colors";
import { useAuthStore } from "../../store/auth.store";

interface MedicineResult {
  id: string;
  name: string;
  genericName?: string;
  form: string;
  category: string;
  pharmacies: {
    pharmacyId: string;
    pharmacyName: string;
    city: string;
    price: number;
    availability: string;
    deliveryType: string[];
  }[];
}

function AvailabilityBadge({ status }: { status: string }) {
  const color = status === "available" ? Colors.accent : status === "low_stock" ? Colors.amber : Colors.gray400;
  const label = status === "available" ? "In Stock" : status === "low_stock" ? "Low Stock" : "Out of Stock";
  return (
    <View style={[badge.wrap, { backgroundColor: color + "20" }]}>
      <Text style={[badge.text, { color }]}>{label}</Text>
    </View>
  );
}
const badge = StyleSheet.create({
  wrap: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  text: { fontSize: 11, fontWeight: "700" },
});

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MedicineResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function search(q: string) {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true); setSearched(true);
    try {
      const { data } = await api.get(`/v1/marketplace/search?q=${encodeURIComponent(q)}&limit=30`);
      setResults(data.results ?? []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }

  return (
    <View style={s.container}>
      {/* Greeting */}
      <View style={s.topBar}>
        <View>
          <Text style={s.greeting}>Hello, {user?.name?.split(" ")[0] ?? "there"} 👋</Text>
          <Text style={s.sub}>Find medicines near you</Text>
        </View>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{user?.name?.charAt(0)?.toUpperCase() ?? "U"}</Text>
        </View>
      </View>

      {/* Search bar */}
      <View style={s.searchWrap}>
        <Ionicons name="search" size={18} color={Colors.gray400} style={s.searchIcon} />
        <TextInput
          style={s.searchInput}
          value={query}
          onChangeText={v => { setQuery(v); if (!v.trim()) { setResults([]); setSearched(false); } }}
          onSubmitEditing={() => search(query)}
          placeholder="Search medicines, e.g. Amoxicillin"
          placeholderTextColor={Colors.gray400}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(""); setResults([]); setSearched(false); }}>
            <Ionicons name="close-circle" size={18} color={Colors.gray400} />
          </TouchableOpacity>
        )}
      </View>

      {/* Results */}
      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={s.hint}>Searching pharmacies…</Text>
        </View>
      ) : !searched ? (
        <View style={s.centered}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>💊</Text>
          <Text style={s.emptyTitle}>Search for medicines</Text>
          <Text style={s.hint}>Find and compare prices across pharmacies near you</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={s.centered}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🔍</Text>
          <Text style={s.emptyTitle}>No results found</Text>
          <Text style={s.hint}>Try a different name or generic name</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={card.wrap}>
              <View style={card.header}>
                <View style={{ flex: 1 }}>
                  <Text style={card.name}>{item.name}</Text>
                  {item.genericName && <Text style={card.generic}>{item.genericName}</Text>}
                  <Text style={card.meta}>{item.form} · {item.category}</Text>
                </View>
              </View>

              {item.pharmacies.length === 0 ? (
                <Text style={card.unavailable}>Not available at any pharmacy</Text>
              ) : (
                item.pharmacies.map((ph, i) => (
                  <TouchableOpacity
                    key={ph.pharmacyId + i}
                    style={card.pharmacy}
                    onPress={() => router.push(`/pharmacy/${ph.pharmacyId}?medicineId=${item.id}`)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={card.phName}>{ph.pharmacyName}</Text>
                      <Text style={card.phCity}>📍 {ph.city}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 4 }}>
                      <Text style={card.price}>${ph.price.toFixed(2)}</Text>
                      <AvailabilityBadge status={ph.availability} />
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={Colors.gray400} style={{ marginLeft: 8 }} />
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },
  topBar: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: Colors.primary, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20,
  },
  greeting: { fontSize: 20, fontWeight: "800", color: "#fff" },
  sub: { fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 2 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.accent, alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  searchWrap: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
    margin: 16, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: Colors.gray900 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: Colors.gray900, marginBottom: 8, textAlign: "center" },
  hint: { fontSize: 13, color: Colors.gray400, textAlign: "center", lineHeight: 20 },
});
const card = StyleSheet.create({
  wrap: {
    backgroundColor: "#fff", borderRadius: 16, marginBottom: 12, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  header: { flexDirection: "row", padding: 14, paddingBottom: 10 },
  name: { fontSize: 16, fontWeight: "700", color: Colors.gray900 },
  generic: { fontSize: 13, color: Colors.gray400, marginTop: 1 },
  meta: { fontSize: 12, color: Colors.accent, marginTop: 4, fontWeight: "600" },
  pharmacy: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: Colors.gray100,
  },
  phName: { fontSize: 14, fontWeight: "600", color: Colors.gray900 },
  phCity: { fontSize: 12, color: Colors.gray400, marginTop: 2 },
  price: { fontSize: 16, fontWeight: "800", color: Colors.primary },
  unavailable: { paddingHorizontal: 14, paddingBottom: 12, fontSize: 13, color: Colors.gray400 },
});
