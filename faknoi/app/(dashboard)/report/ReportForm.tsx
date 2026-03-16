"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { AlertTriangle, Upload, ImageIcon, CheckCircle, X, Clock } from "lucide-react";

const MAX_SIZE = 1024 * 1024;

const statusLabel: Record<string, { label: string; color: string; emoji: string }> = {
  pending:   { label: "รอดำเนินการ", color: "bg-yellow-100 text-yellow-700", emoji: "⏳" },
  reviewing: { label: "กำลังตรวจสอบ", color: "bg-blue-100 text-blue-700",   emoji: "🔍" },
  resolved:  { label: "แก้ไขแล้ว",   color: "bg-green-100 text-green-700",  emoji: "✅" },
};

export default function ReportForm() {
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
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadHistory() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from("reports")
        .select("id, subject, body, role, report_status, created_at")
        .eq("reporter_id", user?.id)
        .order("created_at", { ascending: false });
      setHistory(data || []);
      setLoadingHistory(false);
    }
    loadHistory();
  }, [success]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setFileError("");
    if (!f) return;
    if (f.size > MAX_SIZE) { setFileError("ไฟล์ใหญ่เกิน 1MB"); return; }
    if (!f.type.startsWith("image/")) { setFileError("รองรับเฉพาะรูปภาพ"); return; }
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
      if (upErr) { setError("อัปโหลดรูปไม่สำเร็จ"); setLoading(false); return; }
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
    });
    if (insertErr) { setError("ส่งรายงานไม่สำเร็จ: " + insertErr.message); setLoading(false); return; }
    setSuccess(true);
    setLoading(false);
  }

  function resetForm() {
    setSuccess(false); setBody(""); setSubject("");
    setPhone(""); setGmail(""); setFile(null); setPreview(null);
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-10">
      <div>
        <h1 className="text-xl font-black text-brand-navy">🚨 รายงานปัญหา</h1>
        <p className="text-sm text-gray-400 mt-0.5">แจ้งปัญหาให้ทีมงาน FakNoi ทราบ</p>
      </div>

      {/* Form */}
      {success ? (
        <div className="card text-center py-12">
          <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-brand-navy mb-2">ส่งรายงานสำเร็จ!</h2>
          <p className="text-sm text-gray-400 font-medium mb-6">ทีมงาน FakNoi จะตรวจสอบและติดต่อกลับโดยเร็ว</p>
          <button onClick={resetForm} className="btn-primary text-sm py-2.5 px-6">รายงานปัญหาอื่น</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role */}
          <div className="card space-y-3">
            <p className="text-sm font-black text-brand-navy">คุณเป็น</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { val: "buyer",   label: "👤 ผู้สั่ง (Buyer)" },
                { val: "shopper", label: "🛵 ผู้รับหิ้ว (Shopper)" },
              ] as const).map(({ val, label }) => (
                <button key={val} type="button" onClick={() => setRole(val)}
                  className={`py-3 rounded-2xl text-sm font-black border-2 transition-all duration-150 ${role === val ? "border-brand-blue text-white" : "border-gray-100 text-gray-500 bg-gray-50"}`}
                  style={role === val ? {background:"linear-gradient(135deg,#5478FF,#53CBF3)"} : {}}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div className="card space-y-2">
            <label className="text-sm font-black text-brand-navy block">หัวข้อปัญหา <span className="text-red-400">*</span></label>
            <input type="text" className="input-field" placeholder="เช่น ผู้รับหิ้วไม่ตอบแชท, ออเดอร์หาย..."
              value={subject} onChange={(e) => setSubject(e.target.value)} required />
          </div>

          {/* Body */}
          <div className="card space-y-2">
            <label className="text-sm font-black text-brand-navy block">รายละเอียดปัญหา <span className="text-red-400">*</span></label>
            <textarea className="input-field resize-none" rows={4} placeholder="อธิบายปัญหาที่พบให้ละเอียดที่สุด..."
              value={body} onChange={(e) => setBody(e.target.value)} required />
          </div>

          {/* Contact */}
          <div className="card space-y-3">
            <p className="text-sm font-black text-brand-navy">ข้อมูลติดต่อ</p>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1.5">เบอร์โทรศัพท์ <span className="text-red-400">*</span></label>
              <input type="tel" className="input-field" placeholder="0812345678"
                value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1.5">Gmail <span className="text-red-400">*</span></label>
              <input type="email" className="input-field" placeholder="yourname@gmail.com"
                value={gmail} onChange={(e) => setGmail(e.target.value)} required />
            </div>
          </div>

          {/* Image */}
          <div className="card space-y-2">
            <label className="text-sm font-black text-brand-navy block">แนบรูปภาพ (ไม่บังคับ · ไม่เกิน 1MB)</label>
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
                <><ImageIcon className="w-8 h-8 text-gray-300" /><p className="text-xs text-gray-400 font-medium">แตะเพื่อเลือกรูป</p></>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            {fileError && <p className="text-xs text-red-500 font-medium flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />{fileError}</p>}
          </div>

          {error && <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-2xl font-medium">{error}</div>}

          <button type="submit"
            disabled={loading || !body.trim() || !subject.trim() || !phone.trim() || !gmail.trim()}
            className="btn-primary w-full py-3.5 text-base">
            {loading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><Upload className="w-4 h-4" /> ส่งรายงาน</>}
          </button>
        </form>
      )}

      {/* History */}
      <div>
        <h2 className="font-black text-brand-navy mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-blue" /> ประวัติการรายงาน
        </h2>
        {loadingHistory ? (
          <div className="flex justify-center py-6">
            <span className="w-5 h-5 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-sm text-gray-400 font-medium">ยังไม่มีประวัติการรายงาน</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {history.map((r) => {
              const s = statusLabel[r.report_status] || statusLabel.pending;
              return (
                <div key={r.id} className="card space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-black text-brand-navy text-sm">{r.subject}</p>
                    <span className={`pill ${s.color} flex-shrink-0`}>{s.emoji} {s.label}</span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium line-clamp-2">{r.body}</p>
                  <p className="text-xs text-gray-300 font-medium">
                    {new Date(r.created_at).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
