"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, ChevronDown, MessageCircle, ChevronUp, ImageIcon, X } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { University } from "@/lib/universities";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

const statusMeta: Record<string, { label: string; color: string; emoji: string }> = {
  pending:   { label: "รอดำเนินการ",   color: "bg-yellow-100 text-yellow-700", emoji: "⏳" },
  reviewing: { label: "กำลังตรวจสอบ", color: "bg-blue-100 text-blue-700",     emoji: "🔍" },
  resolved:  { label: "แก้ไขแล้ว",    color: "bg-green-100 text-green-700",   emoji: "✅" },
};

interface Props {
  reports: any[];
  universities: University[];
  adminId: string;
}

export default function AdminReportsPage({ reports: initial, universities, adminId }: Props) {
  const [reports, setReports] = useState(initial);
  const [filter, setFilter] = useState("all");
  const [selectedUni, setSelectedUni] = useState("all");

  // Realtime: subscribe to new reports + status updates
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("admin-reports-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reports" },
        (payload) => {
          setReports((prev) => [payload.new as any, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "reports" },
        (payload) => {
          setReports((prev) =>
            prev.map((r) => r.id === payload.new.id ? { ...r, ...payload.new } : r)
          );
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  let filtered = filter === "all" ? reports : reports.filter((r) => r.report_status === filter);
  if (selectedUni !== "all") {
    filtered = filtered.filter((r) => r.university_id === selectedUni);
  }

  async function updateStatus(reportId: string, newStatus: string) {
    // Optimistic update immediately
    setReports((prev) =>
      prev.map((r) => r.id === reportId ? { ...r, report_status: newStatus } : r)
    );
    await fetch("/api/admin/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId, status: newStatus }),
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-brand-navy">📋 รายงานปัญหาทั้งหมด</h1>
          <p className="text-sm text-gray-400">{reports.length} รายการ</p>
        </div>
      </div>

      {/* Uni filter */}
      <div className="relative">
        <select value={selectedUni} onChange={(e) => setSelectedUni(e.target.value)}
          className="w-full appearance-none input-field text-sm font-bold text-brand-navy pr-8">
          <option value="all">🏫 ทุกมหาวิทยาลัย</option>
          {universities.map((u) => <option key={u.id} value={u.id}>{u.shortName}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          { val: "all", label: "ทั้งหมด", emoji: "" },
          { val: "pending", label: "รอดำเนินการ", emoji: "⏳" },
          { val: "reviewing", label: "กำลังตรวจสอบ", emoji: "🔍" },
          { val: "resolved", label: "แก้ไขแล้ว", emoji: "✅" },
        ].map(({ val, label, emoji }) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-4 py-2 rounded-2xl text-xs font-black border-2 transition-all ${filter === val ? "border-brand-blue text-white" : "border-gray-100 text-gray-500 bg-white"}`}
            style={filter === val ? { background: "linear-gradient(135deg,#5478FF,#53CBF3)" } : {}}>
            {emoji} {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm text-gray-400">ไม่มีรายการ</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <AdminReportCard key={r.id} report={r} adminId={adminId} onStatusChange={updateStatus} />
          ))}
        </div>
      )}
    </div>
  );
}

function AdminReportCard({ report, adminId, onStatusChange }: {
  report: any;
  adminId: string;
  onStatusChange: (id: string, status: string) => void;
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
  const s = statusMeta[report.report_status] || statusMeta.pending;

  // Load initial unread count + realtime chat subscription
  useEffect(() => {
    // นับ unread จาก messages ที่ไม่ใช่ของ admin
    async function loadUnread() {
      const supabase = createClient();
      const lastRead = parseInt(localStorage.getItem(`report-read-${report.id}`) || "0");
      const { data } = await supabase
        .from("report_messages")
        .select("id, sender_id, created_at")
        .eq("report_id", report.id)
        .neq("sender_id", adminId);
      if (data) {
        setUnread(data.filter((m) => new Date(m.created_at).getTime() > lastRead).length);
      }
    }
    loadUnread();

    const supabase = createClient();
    const channel = supabase
      .channel(`report-chat-admin-${report.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "report_messages",
        filter: `report_id=eq.${report.id}`
      }, (payload) => {
        setMessages((prev) => {
          if (prev.find((m) => m.id === payload.new.id)) return prev;
          return [...prev, payload.new as any];
        });
        // ถ้าไม่ใช่ข้อความของ admin และ chat ยังปิดอยู่ → เพิ่ม unread
        if (payload.new.sender_id !== adminId) {
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
  }, [report.id, adminId]);

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
    if (f.size > MAX_IMAGE_SIZE) { setImageError("รูปภาพต้องไม่เกิน 5MB"); return; }
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
      sender_id: adminId,
      message: msgText.trim() || null,
      image_url: imageUrl,
    });

    setMsgText("");
    clearImage();
    setSending(false);
    setUploading(false);
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`pill ${s.color}`}>{s.emoji} {s.label}</span>
            <span className="text-xs text-gray-400">{new Date(report.created_at).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}</span>
          </div>
          <p className="font-black text-brand-navy">{report.subject}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            โดย <span className="font-black text-brand-blue">@{report.reporter_username || report.profiles?.username || "?"}</span>
            {" · "}{report.role === "buyer" ? "👤 ผู้สั่ง" : "🛵 ผู้รับหิ้ว"}
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-700 bg-gray-50 rounded-2xl px-4 py-3">{report.body}</p>

      {report.image_url && (
        <a href={report.image_url} target="_blank" rel="noopener noreferrer">
          <img src={report.image_url} alt="report" className="max-h-40 rounded-2xl object-contain border border-gray-100" />
        </a>
      )}

      {/* Status buttons */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(statusMeta).map(([val, { label, emoji }]) => (
          <button key={val} onClick={() => onStatusChange(report.id, val)}
            disabled={report.report_status === val}
            className={`flex-1 py-2 rounded-2xl text-xs font-black border-2 transition-all min-w-[80px] ${report.report_status === val ? "border-brand-blue text-white" : "border-gray-100 text-gray-500 bg-gray-50 hover:border-brand-blue/30"}`}
            style={report.report_status === val ? { background: "linear-gradient(135deg,#5478FF,#53CBF3)" } : {}}>
            {emoji} {label}
          </button>
        ))}
      </div>

      {/* Chat toggle */}
      <button onClick={toggleChat}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors relative">
        <MessageCircle className="w-4 h-4 text-brand-blue" />
        แชทกับผู้รายงาน
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black px-1 py-0.5 rounded-full min-w-[16px] text-center leading-none">
            {unread}
          </span>
        )}
        {showChat ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {showChat && (
        <div className="border-t border-gray-100 pt-3 space-y-3">
          {/* Messages */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">ยังไม่มีข้อความ</p>
            ) : messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender_id === adminId ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl overflow-hidden ${m.sender_id === adminId ? "bg-brand-blue text-white" : "bg-gray-100 text-gray-800"}`}>
                  {m.image_url && (
                    <a href={m.image_url} target="_blank" rel="noopener noreferrer">
                      <img src={m.image_url} alt="chat" className="max-w-[200px] max-h-[160px] object-cover w-full" />
                    </a>
                  )}
                  {m.message && <p className="px-3 py-2 text-sm">{m.message}</p>}
                </div>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* Image preview */}
          {imagePreview && (
            <div className="flex items-start gap-2">
              <div className="relative">
                <img src={imagePreview} alt="preview" className="h-14 w-14 object-cover rounded-xl border border-gray-200" />
                <button type="button" onClick={clearImage}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
          {imageError && <p className="text-xs text-red-500">{imageError}</p>}

          {/* Input */}
          <div className="flex gap-2">
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-9 h-9 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400 hover:text-brand-blue hover:border-brand-blue/40 transition-colors flex-shrink-0">
              <ImageIcon className="w-4 h-4" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            <input type="text" className="input-field flex-1 text-sm" placeholder="พิมพ์ข้อความ..."
              value={msgText} onChange={(e) => setMsgText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} />
            <button onClick={sendMessage} disabled={sending || (!msgText.trim() && !imageFile)}
              className="btn-primary px-4 text-sm py-2 flex-shrink-0">
              {uploading
                ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : "ส่ง"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
