import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from "react-native";
import { Link } from "expo-router";
import * as LocalAuthentication from "expo-local-authentication";
import { api, getToken, setToken } from "../../lib/api";
import { useAuthStore } from "../../store/auth.store";
import { Colors } from "../../constants/colors";

export default function LoginScreen() {
  const { setAuth } = useAuthStore();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!phone.trim() || !password.trim()) {
      Alert.alert("Error", "Enter your phone number and password");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/v1/marketplace/auth/login", { phone: phone.trim(), password });
      await setAuth(data.user, data.token);
    } catch (e: any) {
      Alert.alert("Login Failed", e.response?.data?.message ?? "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  async function handleBiometric() {
    const saved = await getToken();
    if (!saved) { Alert.alert("Not available", "Log in with password first"); return; }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Sign in to DawoLink",
      fallbackLabel: "Use Password",
    });
    if (result.success) {
      try {
        const { data } = await api.get("/v1/marketplace/auth/me");
        await setAuth(data, saved);
      } catch {
        Alert.alert("Session expired", "Please log in again");
      }
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={s.header}>
          <View style={s.logoBox}>
            <Text style={s.logoIcon}>💊</Text>
          </View>
          <Text style={s.brand}>
            Dawo<Text style={{ color: Colors.accent }}>Link</Text>
          </Text>
          <Text style={s.tagline}>Your pharmacy, anywhere</Text>
        </View>

        {/* Form */}
        <View style={s.form}>
          <Text style={s.label}>Phone Number</Text>
          <TextInput
            style={s.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="0615000000"
            keyboardType="phone-pad"
            autoComplete="tel"
          />

          <Text style={s.label}>Password</Text>
          <TextInput
            style={s.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />

          <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>Sign In</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={s.biometricBtn} onPress={handleBiometric}>
            <Text style={s.biometricText}>🔑  Sign in with Face ID / Fingerprint</Text>
          </TouchableOpacity>

          <View style={s.footer}>
            <Text style={s.footerText}>Don't have an account? </Text>
            <Link href="/(auth)/register">
              <Text style={s.link}>Create one →</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: Colors.primary, padding: 24 },
  header: { alignItems: "center", paddingTop: 80, paddingBottom: 48 },
  logoBox: {
    width: 72, height: 72, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  logoIcon: { fontSize: 36 },
  brand: { fontSize: 32, fontWeight: "900", color: "#fff" },
  tagline: { fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 6 },
  form: {
    backgroundColor: "#fff", borderRadius: 24, padding: 24,
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
  },
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
  biometricBtn: {
    borderWidth: 1.5, borderColor: Colors.gray200, borderRadius: 14,
    paddingVertical: 13, alignItems: "center", marginTop: 12,
  },
  biometricText: { color: Colors.gray600, fontSize: 14, fontWeight: "600" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  footerText: { color: Colors.gray400, fontSize: 14 },
  link: { color: Colors.accent, fontWeight: "700", fontSize: 14 },
});
