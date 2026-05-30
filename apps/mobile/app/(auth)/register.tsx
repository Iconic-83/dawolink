import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from "react-native";
import { Link } from "expo-router";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth.store";
import { Colors } from "../../constants/colors";

export default function RegisterScreen() {
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleRegister() {
    if (!form.name.trim() || !form.phone.trim() || !form.password) {
      Alert.alert("Error", "Name, phone, and password are required");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/v1/marketplace/auth/register", {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        password: form.password,
      });
      await setAuth(data.user, data.token);
    } catch (e: any) {
      Alert.alert("Registration Failed", e.response?.data?.message ?? "Please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <Text style={s.brand}>Dawo<Text style={{ color: Colors.accent }}>Link</Text></Text>
          <Text style={s.tagline}>Create your account</Text>
        </View>

        <View style={s.form}>
          {[
            { key: "name",     label: "Full Name",    placeholder: "Ahmed Hassan",    keyboard: "default" as const },
            { key: "phone",    label: "Phone Number", placeholder: "0615000000",      keyboard: "phone-pad" as const },
            { key: "email",    label: "Email (optional)", placeholder: "you@example.com", keyboard: "email-address" as const },
          ].map(f => (
            <View key={f.key}>
              <Text style={s.label}>{f.label}</Text>
              <TextInput
                style={s.input}
                value={(form as any)[f.key]}
                onChangeText={v => set(f.key, v)}
                placeholder={f.placeholder}
                keyboardType={f.keyboard}
                autoCapitalize="none"
              />
            </View>
          ))}

          <Text style={s.label}>Password</Text>
          <TextInput
            style={s.input}
            value={form.password}
            onChangeText={v => set("password", v)}
            placeholder="Min 8 characters"
            secureTextEntry
          />

          <TouchableOpacity style={s.btn} onPress={handleRegister} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>Create Account</Text>}
          </TouchableOpacity>

          <View style={s.footer}>
            <Text style={s.footerText}>Already have an account? </Text>
            <Link href="/(auth)/login">
              <Text style={s.link}>Sign in →</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: Colors.primary, padding: 24 },
  header: { alignItems: "center", paddingTop: 60, paddingBottom: 36 },
  brand: { fontSize: 28, fontWeight: "900", color: "#fff" },
  tagline: { fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 6 },
  form: { backgroundColor: "#fff", borderRadius: 24, padding: 24 },
  label: { fontSize: 13, fontWeight: "600", color: Colors.gray600, marginBottom: 6, marginTop: 14 },
  input: {
    borderWidth: 1.5, borderColor: Colors.gray200, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.gray900,
  },
  btn: {
    backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 15,
    alignItems: "center", marginTop: 24,
  },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  footerText: { color: Colors.gray400, fontSize: 14 },
  link: { color: Colors.accent, fontWeight: "700", fontSize: 14 },
});
