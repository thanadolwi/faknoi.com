"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Send, MessageCircle, ChevronDown, ImageIcon, X } from "lucide-react";
import { useLang } from "@/lib/LangContext";
import { t } from "@/lib/i18n";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

interface Message {
  id: string;
  content: string | null;
  image_url: string | null;
  sender_id: string;
  created_at: string;
  profiles?: { username: string };
}

interface Props {
  orderId: string;
  currentUserId: string;
  currentUsername: string;
  embedded?: boolean;
  isShopper?: boolean;
}

export default function OrderChat({ orderId, currentUserId, embedded = false, isShopper = false }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState("");
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
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
      // mark as read
      localStorage.setItem(`chat-read-${orderId}`, Date.now().toString());
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, open, currentUserId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setUnread(0);
      localStorage.setItem(`chat-read-${orderId}`, Date.now().toString());
      // แจ้ง Navbar ว่าอ่านแล้ว
      window.dispatchEvent(new CustomEvent("chat-all-read"));
    }
  }, [messages, open]);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setImageError("");
    if (!f) return;
    if (f.size > MAX_IMAGE_SIZE) {
      setImageError("รูปภาพต้องไม่เกิน 5MB");
      return;
    }
    if (!f.type.startsWith("image/")) {
      setImageError("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
      return;
    }
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    setImageError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() && !imageFile) return;
    setLoading(true);
    setUploading(!!imageFile);

    let imageUrl: string | null = null;

    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `chat/${orderId}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("chat-images")
        .upload(path, imageFile, { upsert: false });
      if (uploadErr) {
        setImageError("อัปโหลดรูปไม่สำเร็จ: " + uploadErr.message);
        setLoading(false);
        setUploading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("chat-images").getPublicUrl(path);
      imageUrl = urlData?.publicUrl || null;
    }

    await supabase.from("messages").insert({
      order_id: orderId,
      sender_id: currentUserId,
      content: input.trim() || null,
      image_url: imageUrl,
    });

    setInput("");
    clearImage();
    setLoading(false);
    setUploading(false);
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
          <span className="text-sm font-semibold text-brand-navy">{t(lang, isShopper ? "chat_title_shopper" : "chat_title")}</span>
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
                <p className="text-sm text-gray-400">{t(lang, "chat_no_msg")}</p>
              </div>
            )}
            {messages.map((msg) => {
              const isMe = msg.sender_id === currentUserId;
              return (
                <div key={msg.id} className={`flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}>
                  {!isMe && (
                    <span className="text-xs text-gray-400 px-1">{msg.profiles?.username}</span>
                  )}
                  <div className={`max-w-[75%] rounded-2xl overflow-hidden ${
                    isMe
                      ? "bg-brand-blue text-white rounded-br-sm"
                      : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm shadow-sm"
                  }`}>
                    {msg.image_url && (
                      <a href={msg.image_url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={msg.image_url}
                          alt="chat image"
                          className="max-w-[220px] max-h-[200px] object-cover w-full"
                        />
                      </a>
                    )}
                    {msg.content && (
                      <p className="px-3.5 py-2.5 text-sm leading-relaxed">{msg.content}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 px-1">{formatTime(msg.created_at)}</span>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Image preview */}
          {imagePreview && (
            <div className="px-3 pt-2 flex items-start gap-2 bg-white border-t border-gray-100">
              <div className="relative">
                <img src={imagePreview} alt="preview" className="h-16 w-16 object-cover rounded-xl border border-gray-200" />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              {imageError && <p className="text-xs text-red-500 mt-1">{imageError}</p>}
            </div>
          )}
          {imageError && !imagePreview && (
            <p className="px-3 pt-2 text-xs text-red-500 bg-white border-t border-gray-100">{imageError}</p>
          )}

          {/* Input */}
          <form onSubmit={sendMessage} className="flex items-center gap-2 px-3 py-3 bg-white border-t border-gray-100">
            {/* Image button */}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-10 h-10 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400 hover:text-brand-blue hover:border-brand-blue/40 transition-colors flex-shrink-0"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />

            <input
              type="text"
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue text-sm transition-all"
              placeholder={t(lang, "chat_placeholder")}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || (!input.trim() && !imageFile)}
              className="w-10 h-10 rounded-xl bg-brand-blue text-white flex items-center justify-center disabled:opacity-40 active:bg-brand-navy transition-colors flex-shrink-0"
            >
              {uploading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
