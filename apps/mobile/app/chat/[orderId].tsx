import { useState, useEffect, useRef } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { Colors } from "../../constants/colors";

function timeStr(d: string) {
  const date = new Date(d);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatRef = useRef<FlatList>(null);

  useEffect(() => {
    api.get(`/v1/chat/customer/order/${orderId}/messages`)
      .then(r => { setMessages(r.data); setLoading(false); })
      .catch(() => setLoading(false));

    // Mark as read
    api.patch(`/v1/chat/customer/order/${orderId}/read`).catch(() => {});
  }, [orderId]);

  async function send() {
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    setText("");
    try {
      const { data } = await api.post(`/v1/chat/customer/order/${orderId}/messages`, { content: t });
      setMessages(prev => [...prev, data]);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    } catch { setText(t); }
    finally { setSending(false); }
  }

  if (loading) return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" color={Colors.accent} />
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: "Chat with Pharmacy" }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={s.list}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="chatbubble-outline" size={48} color={Colors.gray200} />
              <Text style={s.emptyText}>No messages yet. Start the conversation!</Text>
            </View>
          }
          renderItem={({ item: msg }) => {
            const isMe = msg.senderType === "CUSTOMER";
            return (
              <View style={[s.msgWrap, isMe ? s.msgRight : s.msgLeft]}>
                <View style={[s.bubble, isMe ? s.bubbleMe : s.bubbleThem]}>
                  {msg.content && <Text style={[s.msgText, isMe ? s.msgTextMe : s.msgTextThem]}>{msg.content}</Text>}
                  <View style={s.msgMeta}>
                    <Text style={[s.time, isMe ? s.timeMe : s.timeThem]}>{timeStr(msg.createdAt)}</Text>
                    {isMe && msg.readAt && <Ionicons name="checkmark-done" size={12} color="rgba(255,255,255,0.7)" />}
                  </View>
                </View>
              </View>
            );
          }}
        />

        <View style={s.inputBar}>
          <TextInput
            style={s.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a message…"
            placeholderTextColor={Colors.gray400}
            multiline
            maxLength={500}
          />
          <TouchableOpacity style={[s.sendBtn, !text.trim() && s.sendBtnDisabled]} onPress={send} disabled={!text.trim() || sending}>
            {sending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="send" size={18} color="#fff" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const s = StyleSheet.create({
  list: { padding: 16, flexGrow: 1 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyText: { color: Colors.gray400, fontSize: 14, textAlign: "center" },
  msgWrap: { marginBottom: 8, maxWidth: "80%" },
  msgLeft: { alignSelf: "flex-start" },
  msgRight: { alignSelf: "flex-end" },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMe: { backgroundColor: Colors.accent, borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: "#fff", borderBottomLeftRadius: 4, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  msgText: { fontSize: 15, lineHeight: 22 },
  msgTextMe: { color: "#fff" },
  msgTextThem: { color: Colors.gray900 },
  msgMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3, justifyContent: "flex-end" },
  time: { fontSize: 10 },
  timeMe: { color: "rgba(255,255,255,0.7)" },
  timeThem: { color: Colors.gray400 },
  inputBar: {
    flexDirection: "row", alignItems: "flex-end", gap: 10,
    padding: 12, backgroundColor: "#fff",
    borderTopWidth: 1, borderTopColor: Colors.gray100,
  },
  input: {
    flex: 1, minHeight: 40, maxHeight: 120, backgroundColor: Colors.gray50,
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, color: Colors.gray900,
  },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.accent, alignItems: "center", justifyContent: "center" },
  sendBtnDisabled: { backgroundColor: Colors.gray200 },
});
