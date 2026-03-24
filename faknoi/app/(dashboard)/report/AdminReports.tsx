"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/LangContext";
import { t } from "@/lib/i18n";
import { MessageCircle, ChevronDown, ChevronUp, Send, ImageIcon, X } from "lucide-react";

const statusMeta: Record<string, { labelKey: string; color: string; emoji: string }> = {
  pending:   { labelKey: "rs_pending",   color: "bg-yellow-100 text-yellow-700", emoji: "⏳" },
  reviewing: { labelKey: "rs_reviewing", color: "bg-blue-100 text-blue-700",     emoji: "🔍" },
  resolved:  { labelKey: "rs_resolved",  color: "bg-green-100 text-green-700",   emoji: "✅" },
};

function AdminReportCard({ report, currentUserId }: { report: any; currentUserId: string }) {
  const { lang } = useLang();
  const [status, setStatus] = useState(report.report_status || "pending");
  const [saving, setSaving] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState("");
  const [uploading, setUploading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const s = statusMeta[status] || statusMeta.pending;

  const roleLabel: Record<string, string> = {
    buyer:   t(lang, "ar_role_buyer"),
    shopper: t(lang, "ar_role_shopper"),
  };

  // Load initial unread + realtime
  useEffect(() => {
    if (!currentUserId) return;
    async function loadUnread() {
      const supabase = createClient();
      const lastRead = parseInt(localStorage.getItem(`report-read-${report.id}`) || "0");
      const { data } = await supabase
        .from("report_messages")
        .select("id, sender_id, created_at")
        .eq("report_id", report.id)
        .neq("sender_id", currentUserId);
      if (data) {
        setUnread(data.filter((m) => new Date(m.created_at).getTime() > lastRead).length);
      }
    }
    loadUnread();

    const supabase = createClient();
    const channel = supabase
      .channel(`admin-report-chat-${report.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "report_messages", filter: `report_id=eq.${report.id}` }, (payload) => {
        setMessages((prev) => {
          if (prev.find((m) => m.id === payload.new.id)) return prev;
          return [...prev, payload.new as any];
        });
        if (payload.new.sender_id !== currentUserId) {
          setShowChat((isOpen) => {
            if (isOpen) {
              localStorage.setItem(`report-read-${report.id}`, Date.now().toString());
              return isOpen;
            }
            setUnread((n) => n + 1);
            return isOpen;
          });
        }
        setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [report.id, currentUserId]);

  async function loadMessages() {
    const supabase = createClient();
    const { data } = await supabase
      .from("report_messages")
      .select("*")
      .eq("report_id", report.id)
      .order("created_at", { ascending: true });
    setMessages(data || []);
    setUnread(0);
    localStorage.setItem(`report-read-${report.id}`, Date.now().toString());
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  async function toggleChat() {
    if (!showChat) await loadMessages();
    else setUnread(0);
    setShowChat(!showChat);
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

  async function sendMessage() {
    if (!msgText.trim() && !imageFile) return;
    if (!currentUserId) return;
    setSending(true); setUploading(!!imageFile);
    const supabase = createClient();
    let imageUrl: string | null = null;
    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `report-chat/${report.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("chat-images").upload(path, imageFile, { upsert: false });
      if (upErr) { setImageError("อัปโหลดรูปไม่สำเร็จ"); setSending(false); setUploading(false); return; }
      const { data: urlData } = supabase.storage.from("chat-images").getPublicUrl(path);
      imageUrl = urlData?.publicUrl || null;
    }
    await supabase.from("report_messages").insert({
      report_id: report.id,
      sender_id: currentUserId,
      message: msgText.trim() || null,
      image_url: imageUrl,
    });
    setMsgText(""); clearImage(); setSending(false); setUploading(false);
  }

  async function updateStatus(newStatus: string) {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("reports").update({ report_status: newStatus }).eq("id", report.id);
    if (error) alert(t(lang, "ar_update_fail") + ": " + error.message);
    else setStatus(newStatus);
    setSaving(false);
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="pill bg-brand-blue/10 text-brand-blue">{roleLabel[report.role] || report.role}</span>
            <span className={`pill ${s.color}`}>{s.emoji} {t(lang, s.labelKey)}</span>
            <span className="text-xs text-gray-400 font-medium">
              {new Date(report.created_at).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}
            </span>
          </div>
          <p className="font-black text-brand-navy">{report.subject}</p>
          <p className="text-xs text-gray-400 font-medium mt-0.5">
            {t(lang, "ar_by")} <span className="font-black text-brand-blue">{report.reporter_username || t(lang, "ar_unknown")}</span>
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-2xl px-4 py-3 font-medium">{report.body}</p>

      <div className="grid grid-cols-2 gap-2 text-xs font-medium">
        {report.phone && (
          <div className="bg-brand-blue/5 rounded-xl px-3 py-2">
            <span className="text-gray-400">📞 </span>
            <span className="text-brand-navy font-black">{report.phone}</span>
          </div>
        )}
        {report.gmail && (
          <div className="bg-brand-blue/5 rounded-xl px-3 py-2">
            <span className="text-gray-400">📧 </span>
            <span className="text-brand-navy font-black">{report.gmail}</span>
          </div>
        )}
      </div>

      {report.image_url && (
        <a href={report.image_url} target="_blank" rel="noopener noreferrer">
          <img src={report.image_url} alt="report"
            className="max-h-48 rounded-2xl object-contain border border-gray-100 hover:opacity-90 transition-opacity" />
        </a>
      )}

      <div className="flex gap-2 pt-1">
        {Object.entries(statusMeta).map(([val, { labelKey, emoji }]) => (
          <button key={val} onClick={() => updateStatus(val)} disabled={saving || status === val}
            className={`flex-1 py-2 rounded-2xl text-xs font-black border-2 transition-all duration-150 ${
              status === val ? "border-brand-blue text-white" : "border-gray-100 text-gray-500 bg-gray-50 hover:border-brand-blue/30"
            }`}
            style={status === val ? {background:"linear-gradient(135deg,#5478FF,#53CBF3)"} : {}}>
            {emoji} {t(lang, labelKey)}
          </button>
        ))}
      </div>

      {/* Chat toggle */}
      <button onClick={toggleChat}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors relative">
        <MessageCircle className="w-3.5 h-3.5 text-brand-blue" />
        แชทกับผู้ใช้
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black px-1 py-0.5 rounded-full min-w-[16px] text-center leading-none">
            {unread}
          </span>
        )}
        {showChat ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {showChat && (
        <div className="border-t border-gray-100 pt-2 space-y-2">
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-3">ยังไม่มีข้อความ</p>
            ) : messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender_id === currentUserId ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl overflow-hidden ${m.sender_id === currentUserId ? "bg-brand-blue text-white" : "bg-gray-100 text-gray-800"}`}>
                  {m.sender_id !== currentUserId && <p className="text-[10px] font-black text-brand-blue px-3 pt-2">{report.reporter_username || "ผู้ใช้"}</p>}
                  {m.image_url && (
                    <a href={m.image_url} target="_blank" rel="noopener noreferrer">
                      <img src={m.image_url} alt="chat" className="max-w-[180px] max-h-[140px] object-cover w-full" />
                    </a>
                  )}
                  {m.message && <p className="px-3 py-2 text-xs">{m.message}</p>}
                </div>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {imagePreview && (
            <div className="flex items-start gap-2">
              <div className="relative">
                <img src={imagePreview} alt="preview" className="h-12 w-12 object-cover rounded-xl border border-gray-200" />
                <button type="button" onClick={clearImage}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center">
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          )}
          {imageError && <p className="text-xs text-red-500">{imageError}</p>}

          <div className="flex gap-2">
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-8 h-8 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400 hover:text-brand-blue hover:border-brand-blue/40 transition-colors flex-shrink-0">
              <ImageIcon className="w-3.5 h-3.5" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            <input type="text" className="input-field flex-1 text-xs py-2" placeholder="พิมพ์ข้อความ..."
              value={msgText} onChange={(e) => setMsgText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} />
            <button onClick={sendMessage} disabled={sending || (!msgText.trim() && !imageFile)}
              className="btn-primary px-3 text-xs py-2 flex-shrink-0">
              {uploading
                ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Send className="w-3 h-3" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminReports({ reports: initial }: { reports: any[] }) {
  const { lang } = useLang();
  const [filter, setFilter] = useState<string>("all");
  const [currentUserId, setCurrentUserId] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  const filtered = filter === "all" ? initial : initial.filter((r) => r.report_status === filter);

  const filterOptions = [
    { val: "all",       labelKey: "ar_all",        emoji: "" },
    { val: "pending",   labelKey: "rs_pending",    emoji: "⏳" },
    { val: "reviewing", labelKey: "rs_reviewing",  emoji: "🔍" },
    { val: "resolved",  labelKey: "rs_resolved",   emoji: "✅" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">
      <div>
        <h1 className="text-xl font-black text-brand-navy">{t(lang, "ar_title")}</h1>
        <p className="text-sm text-gray-400 mt-0.5">{initial.length} {t(lang, "ar_items")}</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {filterOptions.map(({ val, labelKey, emoji }) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-4 py-2 rounded-2xl text-xs font-black border-2 transition-all duration-150 ${
              filter === val ? "border-brand-blue text-white" : "border-gray-100 text-gray-500 bg-white"
            }`}
            style={filter === val ? {background:"linear-gradient(135deg,#5478FF,#53CBF3)"} : {}}>
            {emoji} {t(lang, labelKey)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-sm text-gray-400 font-medium">{t(lang, "ar_no_items")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => <AdminReportCard key={r.id} report={r} currentUserId={currentUserId} />)}
        </div>
      )}
    </div>
  );
}
