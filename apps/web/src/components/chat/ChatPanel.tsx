"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Send, MessageCircle, X, Loader2 } from "lucide-react";

interface Message {
  id: string;
  senderId: string;
  senderType: "CUSTOMER" | "PHARMACY";
  content: string | null;
  imageUrl: string | null;
  readAt: string | null;
  createdAt: string;
}

interface ChatPanelProps {
  orderId: string;
  orderNo: string;
  myType: "CUSTOMER" | "PHARMACY";
  apiBase?: string; // "customer/order" or "order"
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function ChatPanel({ orderId, orderNo, myType, apiBase = "order" }: ChatPanelProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const endpoint = myType === "CUSTOMER" ? `customer/order/${orderId}` : `order/${orderId}`;

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["chat", orderId],
    queryFn: () => api.get(`/v1/chat/${endpoint}/messages`).then(r => r.data),
    enabled: open,
    refetchInterval: open ? false : undefined,
  });

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["chat-unread", orderId],
    queryFn: () => api.get(`/v1/chat/${endpoint}/unread`).then(r => r.data),
    refetchInterval: 15_000,
    staleTime: 10_000,
  });

  useEffect(() => { setUnread(unreadData?.count ?? 0); }, [unreadData]);

  // SSE stream for new messages
  useEffect(() => {
    if (!open) return;
    const token = localStorage.getItem("dawolink_token") || localStorage.getItem("customer_token");
    const es = new EventSource(`${process.env.NEXT_PUBLIC_API_URL}/v1/chat/${endpoint}/stream?token=${token}`);
    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "ping") return;
        qc.setQueryData<Message[]>(["chat", orderId], prev => [...(prev ?? []), msg]);
        qc.invalidateQueries({ queryKey: ["chat-unread", orderId] });
      } catch {}
    };
    return () => es.close();
  }, [open, orderId, endpoint]);

  // Mark read when opened
  useEffect(() => {
    if (!open) return;
    api.patch(`/v1/chat/${endpoint}/read`).catch(() => {});
    qc.invalidateQueries({ queryKey: ["chat-unread", orderId] });
  }, [open]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const { mutate: send, isPending: sending } = useMutation({
    mutationFn: (content: string) =>
      api.post(`/v1/chat/${endpoint}/messages`, { content }).then(r => r.data),
    onSuccess: (msg) => {
      qc.setQueryData<Message[]>(["chat", orderId], prev => [...(prev ?? []), msg]);
      setText("");
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || sending) return;
    send(t);
  };

  return (
    <div className="relative">
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition"
        style={{ background: open ? "#180D62" : "#E8E4FF", color: open ? "#fff" : "#2D1B8E" }}
      >
        <MessageCircle className="h-4 w-4" />
        Chat
        {unread > 0 && (
          <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white">
            {unread}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="absolute right-0 bottom-12 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col z-50"
          style={{ height: 420 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <div>
              <p className="font-semibold text-gray-900 text-sm">Order Chat</p>
              <p className="text-xs text-gray-400">#{orderNo}</p>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {isLoading && (
              <div className="flex items-center justify-center h-full text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
              </div>
            )}
            {!isLoading && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <MessageCircle className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">No messages yet</p>
                <p className="text-xs mt-0.5">Start the conversation</p>
              </div>
            )}
            {messages.map((msg) => {
              const isMe = msg.senderType === myType;
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                      isMe
                        ? "rounded-br-md text-white"
                        : "rounded-bl-md bg-gray-100 text-gray-800"
                    }`}
                    style={isMe ? { background: "linear-gradient(135deg,#00C897,#009E78)" } : undefined}
                  >
                    {msg.content && <p className="leading-snug">{msg.content}</p>}
                    <div className={`flex items-center gap-1 mt-0.5 ${isMe ? "justify-end" : "justify-start"}`}>
                      <span className={`text-[10px] ${isMe ? "text-white/70" : "text-gray-400"}`}>
                        {timeAgo(msg.createdAt)}
                      </span>
                      {isMe && msg.readAt && (
                        <span className="text-[10px] text-white/70">✓✓</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="flex items-center gap-2 px-3 py-3 border-t border-gray-100 flex-shrink-0">
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Type a message…"
              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ "--tw-ring-color": "#00C897" } as any}
            />
            <button
              type="submit"
              disabled={!text.trim() || sending}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white disabled:opacity-40 transition flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#00C897,#009E78)" }}
            >
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
