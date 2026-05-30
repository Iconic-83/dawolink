import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuthStore } from "../store/auth.store";
import { getToken } from "../lib/api";
import { api } from "../lib/api";

export default function RootLayout() {
  const { user, setAuth, logout } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (token) {
        try {
          const { data } = await api.get("/v1/marketplace/auth/me");
          await setAuth(data, token);
        } catch {
          await logout();
        }
      }
    })();
  }, []);

  useEffect(() => {
    const inAuth = segments[0] === "(auth)";
    if (!user && !inAuth) {
      router.replace("/(auth)/login");
    } else if (user && inAuth) {
      router.replace("/(tabs)");
    }
  }, [user, segments]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="pharmacy/[id]" options={{ headerShown: true, title: "" }} />
        <Stack.Screen name="order/[id]" options={{ headerShown: true, title: "Order Details" }} />
        <Stack.Screen name="chat/[orderId]" options={{ headerShown: true, title: "Chat" }} />
        <Stack.Screen name="chats" options={{ headerShown: true, title: "Messages" }} />
        <Stack.Screen name="rate/[orderId]" options={{ headerShown: true, title: "Rate Experience" }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
