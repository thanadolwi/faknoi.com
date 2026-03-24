"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { MessageCircle, ChevronDown, ChevronUp, Send, ImageIcon, X, Search } from "lucide-react";

interface Order {
  id: string;
  status: string;
  item_name: string;
  created_at: string;
  buyer_id: string;
  profiles: { username: string } | null;
  trips: { shopper_id: string; profiles: { username: string } | null } | null;
  lastMsg?: string;
  lastMsgTime?: string;
  unread: number;
}

function AdminOrderChat({ order, currentUserId }: { order: Order; currentUserId: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(order.unread);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState("");
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`admin-chat-${order.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `order_id=eq.${order.id}` }, async (payload) => {
        const supabase2 = createClient();
        const { data } = await supabase2.from("messages").select("*, profiles(username)").eq("id", payload.new.id).single();
        if (data) {
          setMessages((prev) => [...prev, data]);
          if (payload.new.sender_id !== currentUserId) {
            setOpen((isOpen) => {
              if (isOpen) {
                localStorage.setItem(`chat-read-${order.id}`, Date.now().toString());
                return isOpen;
              }
              setUnread((n) => n + 1);
              return isOpen;
            });
          }
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [order.id, currentUserId]);

  async function loadMessages() {
    const res = await fetch(`/api/admin/messages?order_id=${order.id}`);
    const { data } = await res.json();
    setMessages(data || []);
    setUnread(0);
    localStorage.setItem(`chat-read-${order.id}`, Date.now().toString());
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  async function toggleChat() {
    if (!open) await loadMessages();
    setOpen(!open);
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setImageError("");
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setImageError("รูปภาพต้องไม่เกิน 5MB"); return; }
    if (!f.type.startsWith("image/")) { setImageError("กรุณาเลือกไฟล์รูปภาพเท่านั้น"); return; }
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  }

  function clearImage() {
    setImageFile(null); setImagePreview(null); setImageError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() && !imageFile) return;
    setSending(true); setUploading(!!imageFile);
    const supabase = createClient();
    let imageUrl: string | null = null;
    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `chat/${order.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("chat-images").upload(path, imageFile, { upsert: false });
      if (upErr) { setImageError("อัปโหลดรูปไม่สำเร็จ"); setSending(false); setUploading(false); return; }
      const { data: urlData } = supabase.storage.from("chat-images").getPublicUrl(path);
      imageUrl = urlData?.publicUrl || null;
    }
    // ใช้ API route เพราะ admin ไม่ใช่ buyer/shopper ของ order (RLS บล็อก direct insert)
    const res = await fetch("/api/admin/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: order.id, content: input.trim() || null, image_url: imageUrl }),
    });
    if (!res.ok) { setImageError("ส่งข้อความไม่สำเร็จ"); setSending(false); setUploading(false); return; }
    setInput(""); clearImage(); setSending(false); setUploading(false);
  }

  const buyerName = order.profiles?.username || "ผู้ซื้อ";
  const shopperName = order.trips?.profiles?.username || "ผู้รับหิ้ว";

  return (
    <div className="card overflow-hidden p-0">
      <button onClick={toggleChat}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex-shrink-0">
            <MessageCircle className="w-5 h-5 text-brand-blue" />
            {unread > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black px-1 py-0.5 rounded-full min-w-[16px] text-center leading-none">
                {unread}
              </span>
            )}
          </div>
          <div className="min-w-0 text-left">
            <p className="text-sm font-black text-brand-navy truncate">{order.item_name || "ออเดอร์"}</p>
            <p className="text-xs text-gray-400 font-medium">
              🛒 {buyerName} → 🛵 {shopperName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`pill text-[10px] ${order.status === "completed" ? "bg-green-100 text-green-700" : order.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
            {order.status}
          </span>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100">
          <div className="h-64 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-gray-400">ยังไม่มีข้อความ</p>
              </div>
            ) : messages.map((msg) => {
              const isMe = msg.sender_id === currentUserId;
              return (
                <div key={msg.id} className={`flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}>
                  {!isMe && <span className="text-xs text-gray-400 px-1">{msg.profiles?.username}</span>}
                  <div className={`max-w-[75%] rounded-2xl overflow-hidden ${isMe ? "bg-brand-blue text-white rounded-br-sm" : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm shadow-sm"}`}>
                    {msg.image_url && (
                      <a href={msg.image_url} target="_blank" rel="noopener noreferrer">
                        <img src={msg.image_url} alt="chat" className="max-w-[220px] max-h-[200px] object-cover w-full" />
                      </a>
                    )}
                    {msg.content && <p className="px-3.5 py-2.5 text-sm leading-relaxed">{msg.content}</p>}
                  </div>
                  <span className="text-[10px] text-gray-400 px-1">
                    {new Date(msg.created_at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {imagePreview && (
            <div className="px-3 pt-2 flex items-start gap-2 bg-white border-t border-gray-100">
              <div className="relative">
                <img src={imagePreview} alt="preview" className="h-16 w-16 object-cover rounded-xl border border-gray-200" />
                <button type="button" onClick={clearImage}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
          {imageError && <p className="px-3 pt-1 text-xs text-red-500 bg-white border-t border-gray-100">{imageError}</p>}

          <form onSubmit={sendMessage} className="flex items-center gap-2 px-3 py-3 bg-white border-t border-gray-100">
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-10 h-10 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400 hover:text-brand-blue hover:border-brand-blue/40 transition-colors flex-shrink-0">
              <ImageIcon className="w-4 h-4" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            <input type="text" className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue text-sm transition-all"
              placeholder="พิมพ์ข้อความ..." value={input} onChange={(e) => setInput(e.target.value)} disabled={sending} />
            <button type="submit" disabled={sending || (!input.trim() && !imageFile)}
              className="w-10 h-10 rounded-xl bg-brand-blue text-white flex items-center justify-center disabled:opacity-40 active:bg-brand-navy transition-colors flex-shrink-0">
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

export default function AdminChats({ orders: initial, currentUserId }: { orders: Order[]; currentUserId: string }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");

  const filtered = initial.filter((o) => {
    const matchStatus = statusFilter === "all" ? true
      : statusFilter === "active" ? !["completed", "cancelled"].includes(o.status)
      : o.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || (o.item_name || "").toLowerCase().includes(q)
      || (o.profiles?.username || "").toLowerCase().includes(q)
      || (o.trips?.profiles?.username || "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const statusOptions = [
    { val: "active", label: "กำลังดำเนินการ" },
    { val: "all",    label: "ทั้งหมด" },
    { val: "completed", label: "เสร็จสิ้น" },
    { val: "cancelled", label: "ยกเลิก" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-10">
      <div>
        <h1 className="text-xl font-black text-brand-navy">💬 แชทออเดอร์ทั้งหมด</h1>
        <p className="text-sm text-gray-400 mt-0.5">{initial.length} ออเดอร์</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" className="input-field pl-9 text-sm" placeholder="ค้นหาออเดอร์ / username..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {statusOptions.map(({ val, label }) => (
          <button key={val} onClick={() => setStatusFilter(val)}
            className={`px-3 py-1.5 rounded-2xl text-xs font-black border-2 transition-all ${statusFilter === val ? "border-brand-blue text-white" : "border-gray-100 text-gray-500 bg-white"}`}
            style={statusFilter === val ? { background: "linear-gradient(135deg,#5478FF,#53CBF3)" } : {}}>
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-4xl mb-3">💬</div>
          <p className="text-sm text-gray-400 font-medium">ไม่พบออเดอร์</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => (
            <AdminOrderChat key={o.id} order={o} currentUserId={currentUserId} />
          ))}
        </div>
      )}
    </div>
  );
}
