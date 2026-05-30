import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/auth.store";
import { Colors } from "../../constants/colors";

interface MenuItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
}

function MenuItem({ icon, label, onPress, danger }: MenuItemProps) {
  return (
    <TouchableOpacity style={s.menuItem} onPress={onPress}>
      <View style={[s.menuIcon, { backgroundColor: danger ? Colors.red + "15" : Colors.primary + "10" }]}>
        <Ionicons name={icon as any} size={20} color={danger ? Colors.red : Colors.primary} />
      </View>
      <Text style={[s.menuLabel, danger && { color: Colors.red }]}>{label}</Text>
      {!danger && <Ionicons name="chevron-forward" size={16} color={Colors.gray400} />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  function handleLogout() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: logout },
    ]);
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.gray50 }}>
      {/* Avatar */}
      <View style={s.header}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{user?.name?.charAt(0)?.toUpperCase() ?? "U"}</Text>
        </View>
        <Text style={s.name}>{user?.name ?? "Guest"}</Text>
        <Text style={s.phone}>{user?.phone ?? ""}</Text>
        {user?.email && <Text style={s.email}>{user.email}</Text>}
      </View>

      {/* Menu */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Account</Text>
        <View style={s.card}>
          <MenuItem icon="receipt-outline"   label="My Orders"        onPress={() => router.push("/(tabs)/orders")} />
          <MenuItem icon="trophy-outline"    label="Loyalty Points"   onPress={() => router.push("/(tabs)/loyalty")} />
          <MenuItem icon="chatbubble-outline" label="My Chats"         onPress={() => router.push("/chats")} />
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Help</Text>
        <View style={s.card}>
          <MenuItem icon="help-circle-outline" label="FAQ & Support"  onPress={() => Alert.alert("Support", "Contact: support@dawolink.com")} />
          <MenuItem icon="shield-checkmark-outline" label="Privacy Policy" onPress={() => {}} />
        </View>
      </View>

      <View style={s.section}>
        <View style={s.card}>
          <MenuItem icon="log-out-outline" label="Sign Out" onPress={handleLogout} danger />
        </View>
      </View>

      <Text style={s.version}>DawoLink v1.0.0</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  header: { backgroundColor: Colors.primary, alignItems: "center", paddingTop: 56, paddingBottom: 32 },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.accent,
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  avatarText: { color: "#fff", fontSize: 30, fontWeight: "900" },
  name: { fontSize: 22, fontWeight: "800", color: "#fff" },
  phone: { fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 4 },
  email: { fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 2 },
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 12, fontWeight: "700", color: Colors.gray400, letterSpacing: 0.8, marginBottom: 8, textTransform: "uppercase" },
  card: { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden" },
  menuItem: {
    flexDirection: "row", alignItems: "center", padding: 14, gap: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.gray100,
  },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: "600", color: Colors.gray900 },
  version: { textAlign: "center", color: Colors.gray400, fontSize: 12, padding: 24, paddingTop: 12 },
});
