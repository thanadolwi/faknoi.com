"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Send, MessageCircle, ChevronDown } from "lucide-react";
import { useLang } from "@/lib/LangContext";
import { t } from "@/lib/i18n";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  profiles?: { username: string };
}

interface Props {
  orderId: string;
  currentUserId: string;
  currentUsername: string;
  embedded?: boolean;
}

export default function OrderChat({ orderId, currentUserId, currentUsername, embedded = false }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const { lang } = useLang();

  // Load initial messages
  useEffect(() => {
    if (!embedded && !open) return;
    async function load() {
      const { data } = await supabase
        .from("messages")
        .select("*, profiles(username)")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });
      setMessages(data || []);
      setUnread(0);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, embedded, orderId]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`order-chat-${orderId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `order_id=eq.${orderId}` },
        async (payload) => {
          // fetch with profile
          const { data } = await supabase
            .from("messages")
            .select("*, profiles(username)")
            .eq("id", payload.new.id)
            .single();
          if (data) {
            setMessages((prev) => [...prev, data]);
            if (!open || payload.new.sender_id !== currentUserId) {
              setUnread((n) => n + 1);
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId, open, currentUserId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setUnread(0);
    }
  }, [messages, open]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    await supabase.from("messages").insert({
      order_id: orderId,
      sender_id: currentUserId,
      content: input.trim(),
    });
    setInput("");
    setLoading(false);
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="card overflow-hidden p-0">
      {/* Chat header toggle */}
      <button
        onClick={() => { setOpen(!open); setUnread(0); }}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-brand-blue" />
          <span className="text-sm font-semibold text-brand-navy">{t(lang,"chat_title")}</span>
          {unread > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {unread}
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Chat body */}
      {open && (
        <div className="border-t border-gray-100">
          {/* Messages */}
          <div className="h-72 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-gray-400">{t(lang,"chat_no_msg")}</p>
              </div>
            )}
            {messages.map((msg) => {
              const isMe = msg.sender_id === currentUserId;
              return (
                <div key={msg.id} className={`flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}>
                  {!isMe && (
                    <span className="text-xs text-gray-400 px-1">{msg.profiles?.username}</span>
                  )}
                  <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? "bg-brand-blue text-white rounded-br-sm"
                      : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm shadow-sm"
                  }`}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-gray-400 px-1">{formatTime(msg.created_at)}</span>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="flex items-center gap-2 px-3 py-3 bg-white border-t border-gray-100">
            <input
              type="text"
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue text-sm transition-all"
              placeholder={t(lang,"chat_placeholder")}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-xl bg-brand-blue text-white flex items-center justify-center disabled:opacity-40 active:bg-brand-navy transition-colors flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
