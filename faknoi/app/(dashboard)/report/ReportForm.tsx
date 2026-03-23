"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { AlertTriangle, Upload, ImageIcon, CheckCircle, X, Clock, GraduationCap, MessageCircle, ChevronDown, ChevronUp, Bell, Send } from "lucide-react";
import { useLang } from "@/lib/LangContext";
import { t } from "@/lib/i18n";
import { UNIVERSITIES } from "@/lib/universities";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB for report image
const MAX_CHAT_SIZE = 5 * 1024 * 1024; // 5MB for chat images

function getStatusLabel(lang: string, status: string) {
  const map: Record<string, { labelKey: string; color: string; emoji: string }> = {
    pending:   { labelKey: "rs_pending",   color: "bg-yellow-100 text-yellow-700", emoji: "⏳" },
    reviewing: { labelKey: "rs_reviewing", color: "bg-blue-100 text-blue-700",     emoji: "🔍" },
    resolved:  { labelKey: "rs_resolved",  color: "bg-green-100 text-green-700",   emoji: "✅" },
  };
  return map[status] || map.pending;
}

export default function ReportForm() {
  const { lang } = useLang();
  const [role, setRole]       = useState<"shopper"|"buyer">("buyer");
  const [subject, setSubject] = useState("");
  const [body, setBody]       = useState("");
  const [phone, setPhone]     = useState("");
  const [gmail, setGmail]     = useState("");
  const [file, setFile]       = useState<File|null>(null);
  const [preview, setPreview] = useState<string|null>(null);
  const [fileError, setFileError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [universityId, setUniversityId] = useState("");
  const [userUnis, setUserUnis] = useState<{ id: string; shortName: string }[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [newMsgPopup, setNewMsgPopup] = useState<{ reportSubject: string; message: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let userId: string | undefined;
    async function loadHistory() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
      setCurrentUserId(user?.id || "");
      // Load report history
      const { data } = await supabase
        .from("reports")
        .select("id, subject, body, role, report_status, created_at")
        .eq("reporter_id", user?.id)
        .order("created_at", { ascending: false });
      setHistory(data || []);
      setLoadingHistory(false);
      // Load universities from user's trips (as buyer or shopper)
      const { data: buyerOrders } = await supabase
        .from("orders")
        .select("trips(university_id)")
        .eq("buyer_id", user?.id);
      const { data: shopperTrips } = await supabase
        .from("trips")
        .select("university_id")
        .eq("shopper_id", user?.id);
      const uniIds = new Set<string>();
      for (const o of buyerOrders || []) {
        const uid = (o as any).trips?.university_id;
        if (uid) uniIds.add(uid);
      }
      for (const t of shopperTrips || []) {
        if (t.university_id) uniIds.add(t.university_id);
      }
      const unis = UNIVERSITIES.filter((u) => uniIds.has(u.id)).map((u) => ({ id: u.id, shortName: u.shortName }));
      setUserUnis(unis);
    }
    loadHistory();

    // Realtime: update report status in history
    const supabase = createClient();
    const channel = supabase
      .channel("report-form-realtime")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "reports" }, (payload) => {
        setHistory((prev) =>
          prev.map((r) => r.id === payload.new.id ? { ...r, ...payload.new } : r)
        );
      })
      // Realtime: new message from admin → show popup
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "report_messages" }, async (payload) => {
        if (!userId || payload.new.sender_id === userId) return;
        // find report subject
        const supabase2 = createClient();
        const { data: rep } = await supabase2.from("reports").select("subject").eq("id", payload.new.report_id).single();
        setNewMsgPopup({ reportSubject: rep?.subject || "รายงาน", message: payload.new.message });
        setTimeout(() => setNewMsgPopup(null), 6000);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [success]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setFileError("");
    if (!f) return;
    if (f.size > MAX_SIZE) { setFileError(t(lang, "rf_file_too_big")); return; }
    if (!f.type.startsWith("image/")) { setFileError(t(lang, "rf_file_type")); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !subject.trim() || !phone.trim() || !gmail.trim()) return;
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    let imageUrl: string|null = null;
    if (file && user) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("report-images").upload(path, file);
      if (upErr) { setError(t(lang, "rf_upload_fail")); setLoading(false); return; }
      const { data: { publicUrl } } = supabase.storage.from("report-images").getPublicUrl(path);
      imageUrl = publicUrl;
    }
    const { data: profile } = await supabase.from("profiles").select("username").eq("id", user?.id).single();
    const { error: insertErr } = await supabase.from("reports").insert({
      reporter_id: user?.id,
      reporter_username: profile?.username,
      role, subject: subject.trim(), body: body.trim(),
      phone: phone.trim(), gmail: gmail.trim(),
      image_url: imageUrl,
      report_status: "pending",
      university_id: universityId || null,
    });
    if (insertErr) { setError(t(lang, "rf_send_fail") + ": " + insertErr.message); setLoading(false); return; }
    setSuccess(true);
    setLoading(false);
  }

  function resetForm() {
    setSuccess(false); setBody(""); setSubject("");
    setPhone(""); setGmail(""); setFile(null); setPreview(null);
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-10">
      {/* Admin message popup */}
      {newMsgPopup && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[90vw] max-w-sm bg-brand-blue text-white rounded-3xl shadow-blue-md px-4 py-3 flex items-start gap-3 animate-pop">
          <Bell className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black">💬 แอดมินตอบกลับรายงาน</p>
            <p className="text-xs font-bold opacity-80 truncate">{newMsgPopup.reportSubject}</p>
            <p className="text-sm mt-0.5 line-clamp-2">{newMsgPopup.message}</p>
          </div>
          <button onClick={() => setNewMsgPopup(null)} className="flex-shrink-0 opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div>
        <h1 className="text-xl font-black text-brand-navy">{t(lang, "rf_title")}</h1>
        <p className="text-sm text-gray-400 mt-0.5">{t(lang, "rf_subtitle")}</p>
      </div>

      {success ? (
        <div className="card text-center py-12">
          <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-brand-navy mb-2">{t(lang, "rf_success_title")}</h2>
          <p className="text-sm text-gray-400 font-medium mb-6">{t(lang, "rf_success_body")}</p>
          <button onClick={resetForm} className="btn-primary text-sm py-2.5 px-6">{t(lang, "rf_report_other")}</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="card space-y-3">
            <p className="text-sm font-black text-brand-navy">{t(lang, "rf_you_are")}</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { val: "buyer",   labelKey: "rf_buyer" },
                { val: "shopper", labelKey: "rf_shopper" },
              ] as const).map(({ val, labelKey }) => (
                <button key={val} type="button" onClick={() => setRole(val)}
                  className={`py-3 rounded-2xl text-sm font-black border-2 transition-all duration-150 ${role === val ? "border-brand-blue text-white" : "border-gray-100 text-gray-500 bg-gray-50"}`}
                  style={role === val ? {background:"linear-gradient(135deg,#5478FF,#53CBF3)"} : {}}>
                  {t(lang, labelKey)}
                </button>
              ))}
            </div>
          </div>

          {/* University selector */}
          <div className="card space-y-2">
            <label className="text-sm font-black text-brand-navy flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-brand-blue" />
              พื้นที่มหาวิทยาลัย <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <select
                value={universityId}
                onChange={(e) => setUniversityId(e.target.value)}
                className="input-field text-sm appearance-none pr-8"
                required
              >
                <option value="" disabled>เลือกมหาวิทยาลัย</option>
                {userUnis.length > 0
                  ? userUnis.map((u) => <option key={u.id} value={u.id}>{u.shortName}</option>)
                  : UNIVERSITIES.map((u) => <option key={u.id} value={u.id}>{u.shortName}</option>)
                }
              </select>
              <GraduationCap className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {userUnis.length > 0 && (
              <p className="text-xs text-gray-400">แสดงเฉพาะมหาวิทยาลัยที่คุณมีทริป/ออเดอร์</p>
            )}
          </div>

          <div className="card space-y-2">
            <label className="text-sm font-black text-brand-navy block">{t(lang, "rf_subject")} <span className="text-red-400">*</span></label>
            <input type="text" className="input-field" placeholder={t(lang, "rf_subject_placeholder")}
              value={subject} onChange={(e) => setSubject(e.target.value)} required />
          </div>

          <div className="card space-y-2">
            <label className="text-sm font-black text-brand-navy block">{t(lang, "rf_body")} <span className="text-red-400">*</span></label>
            <textarea className="input-field resize-none" rows={4} placeholder={t(lang, "rf_body_placeholder")}
              value={body} onChange={(e) => setBody(e.target.value)} required />
          </div>

          <div className="card space-y-3">
            <p className="text-sm font-black text-brand-navy">{t(lang, "rf_contact")}</p>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1.5">{t(lang, "rf_phone")} <span className="text-red-400">*</span></label>
              <input type="tel" className="input-field" placeholder="0812345678"
                value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1.5">{t(lang, "rf_gmail")} <span className="text-red-400">*</span></label>
              <input type="email" className="input-field" placeholder="yourname@gmail.com"
                value={gmail} onChange={(e) => setGmail(e.target.value)} required />
            </div>
          </div>

          <div className="card space-y-2">
            <label className="text-sm font-black text-brand-navy block">{t(lang, "rf_image")}</label>
            <div onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-2xl p-5 flex flex-col items-center gap-2 cursor-pointer hover:border-brand-blue/40 hover:bg-brand-blue/5 transition-colors">
              {preview ? (
                <div className="relative">
                  <img src={preview} alt="preview" className="max-h-40 rounded-xl object-contain" />
                  <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <><ImageIcon className="w-8 h-8 text-gray-300" /><p className="text-xs text-gray-400 font-medium">{t(lang, "rf_image_tap")}</p></>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            {fileError && <p className="text-xs text-red-500 font-medium flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />{fileError}</p>}
          </div>

          {error && <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-2xl font-medium">{error}</div>}

          <button type="submit"
            disabled={loading || !body.trim() || !subject.trim() || !phone.trim() || !gmail.trim() || !universityId}
            className="btn-primary w-full py-3.5 text-base">
            {loading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><Upload className="w-4 h-4" /> {t(lang, "rf_submit")}</>}
          </button>
        </form>
      )}

      <div>
        <h2 className="font-black text-brand-navy mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-blue" /> {t(lang, "report_history")}
        </h2>
        {loadingHistory ? (
          <div className="flex justify-center py-6">
            <span className="w-5 h-5 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-sm text-gray-400 font-medium">{t(lang, "report_no_history")}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {history.map((r) => {
              const s = getStatusLabel(lang, r.report_status);
              return (
                <ReportHistoryCard key={r.id} report={r} lang={lang} currentUserId={currentUserId} statusMeta={s} />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ReportHistoryCard({ report, lang, currentUserId, statusMeta }: {
  report: any; lang: import("@/lib/LangContext").Lang; currentUserId: string;
  statusMeta: { labelKey: string; color: string; emoji: string };
}) {
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

  // Realtime chat + load initial unread count
  useEffect(() => {
    // Load unread count from existing messages
    async function loadUnread() {
      const supabase = createClient();
      const lastRead = parseInt(localStorage.getItem(`report-read-${report.id}`) || "0");
      const { data } = await supabase
        .from("report_messages")
        .select("id, sender_id, created_at")
        .eq("report_id", report.id)
        .neq("sender_id", currentUserId)
        .order("created_at", { ascending: false });
      if (data) {
        const unreadCount = data.filter((m) => new Date(m.created_at).getTime() > lastRead).length;
        setUnread(unreadCount);
      }
    }
    if (currentUserId) loadUnread();

    const supabase = createClient();
    const channel = supabase
      .channel(`report-user-chat-${report.id}`)
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
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  async function toggleChat() {
    if (!showChat) {
      await loadMessages();
      localStorage.setItem(`report-read-${report.id}`, Date.now().toString());
    }
    setUnread(0);
    setShowChat(!showChat);
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setImageError("");
    if (!f) return;
    if (f.size > MAX_CHAT_SIZE) { setImageError("รูปภาพต้องไม่เกิน 5MB"); return; }
    if (!f.type.startsWith("image/")) { setImageError("กรุณาเลือกไฟล์รูปภาพเท่านั้น"); return; }
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    setImageError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function sendMessage() {
    if (!msgText.trim() && !imageFile) return;
    if (!currentUserId) return;
    setSending(true);
    setUploading(!!imageFile);

    const supabase = createClient();
    let imageUrl: string | null = null;

    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `report-chat/${report.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("chat-images").upload(path, imageFile, { upsert: false });
      if (upErr) {
        setImageError("อัปโหลดรูปไม่สำเร็จ");
        setSending(false);
        setUploading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("chat-images").getPublicUrl(path);
      imageUrl = urlData?.publicUrl || null;
    }

    await supabase.from("report_messages").insert({
      report_id: report.id,
      sender_id: currentUserId,
      message: msgText.trim() || null,
      image_url: imageUrl,
    });

    setMsgText("");
    clearImage();
    setSending(false);
    setUploading(false);
  }

  return (
    <div className="card space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="font-black text-brand-navy text-sm">{report.subject}</p>
        <span className={`pill ${statusMeta.color} flex-shrink-0`}>{statusMeta.emoji} {t(lang, statusMeta.labelKey)}</span>
      </div>
      <p className="text-xs text-gray-500 font-medium line-clamp-2">{report.body}</p>
      <p className="text-xs text-gray-300 font-medium">
        {new Date(report.created_at).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}
      </p>

      {/* Chat toggle */}
      <button onClick={toggleChat}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors relative">
        <MessageCircle className="w-3.5 h-3.5 text-brand-blue" />
        แชทกับแอดมิน
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black px-1 py-0.5 rounded-full min-w-[16px] text-center leading-none">
            {unread}
          </span>
        )}
        {showChat ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {showChat && (
        <div className="border-t border-gray-100 pt-2 space-y-2">
          {/* Messages */}
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-3">ยังไม่มีข้อความ</p>
            ) : messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender_id === currentUserId ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl overflow-hidden ${m.sender_id === currentUserId ? "bg-brand-blue text-white" : "bg-gray-100 text-gray-800"}`}>
                  {m.sender_id !== currentUserId && <p className="text-[10px] font-black text-brand-blue px-3 pt-2">แอดมิน</p>}
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

          {/* Image preview */}
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

          {/* Input */}
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
