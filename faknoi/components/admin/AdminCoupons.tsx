"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, ImageIcon, X, Loader2, ChevronUp } from "lucide-react";

type CouponStatus = "open" | "paused" | "sold_out";

interface Coupon {
  id: string;
  name: string;
  description: string;
  company: string | null;
  coins_required: number;
  valid_from: string | null;
  valid_until: string | null;
  contact_info: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_line: string | null;
  contact_facebook: string | null;
  contact_instagram: string | null;
  status: CouponStatus;
  is_active: boolean;
  notice: string | null;
  image_url: string | null;
  max_redemptions: number | null;
  created_at: string;
}

const STATUS_OPTIONS: { value: CouponStatus; label: string; active: string; inactive: string }[] = [
  { value: "open",     label: "เปิดอยู่",             active: "border-green-400 bg-green-100 text-green-700",   inactive: "border-gray-100 text-gray-400 bg-white" },
  { value: "paused",   label: "ปิดปรับปรุงชั่วคราว", active: "border-yellow-400 bg-yellow-100 text-yellow-700", inactive: "border-gray-100 text-gray-400 bg-white" },
  { value: "sold_out", label: "หมดแล้ว",              active: "border-red-400 bg-red-100 text-red-600",          inactive: "border-gray-100 text-gray-400 bg-white" },
];

function StatusBadge({ status }: { status: CouponStatus }) {
  const opt = STATUS_OPTIONS.find((o) => o.value === status)!;
  return <span className={`px-2 py-0.5 rounded-full border-2 text-xs font-black ${opt.active}`}>{opt.label}</span>;
}

const EMPTY_FORM = {
  name: "", description: "", company: "", coins_required: "", max_redemptions: "",
  valid_from: "", valid_until: "", contact_info: "", contact_email: "", contact_phone: "",
  contact_line: "", contact_facebook: "", contact_instagram: "", status: "open" as CouponStatus, notice: "",
};

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadCoupons() {
    setLoading(true);
    const res = await fetch("/api/admin/coupons");
    const json = await res.json();
    setCoupons(json.coupons || []);
    setLoading(false);
  }

  useEffect(() => {
    loadCoupons();
    const supabase = createClient();
    const ch = supabase.channel("admin-coupons-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "coupons" }, () => loadCoupons())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setImageError("");
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setImageError("ไฟล์ใหญ่เกิน 5MB"); return; }
    if (!f.type.startsWith("image/")) { setImageError("รองรับเฉพาะไฟล์รูปภาพ"); return; }
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  }

  async function handleSubmit() {
    setError("");
    if (!form.name.trim()) { setError("กรุณากรอกชื่อคูปอง"); return; }
    if (!form.coins_required || isNaN(Number(form.coins_required)) || Number(form.coins_required) <= 0) {
      setError("กรุณากรอกจำนวนคอยน์ที่ถูกต้อง"); return;
    }
    setSaving(true);
    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("description", form.description);
    fd.append("company", form.company);
    fd.append("coins_required", form.coins_required);
    fd.append("max_redemptions", form.max_redemptions);
    fd.append("valid_from", form.valid_from);
    fd.append("valid_until", form.valid_until);
    fd.append("contact_info", form.contact_info);
    fd.append("contact_email", form.contact_email);
    fd.append("contact_phone", form.contact_phone);
    fd.append("contact_line", form.contact_line);
    fd.append("contact_facebook", form.contact_facebook);
    fd.append("contact_instagram", form.contact_instagram);
    fd.append("status", form.status);
    fd.append("is_active", String(form.status === "open"));
    fd.append("notice", form.notice);
    if (imageFile) fd.append("image", imageFile);
    const res = await fetch("/api/admin/coupons", { method: "POST", body: fd });
    const json = await res.json();
    if (!res.ok) { setError(json.error || "เกิดข้อผิดพลาด"); setSaving(false); return; }
    setForm(EMPTY_FORM);
    setImageFile(null); setImagePreview(null);
    setShowForm(false);
    setSaving(false);
  }

  async function updateStatus(coupon: Coupon, status: CouponStatus) {
    await fetch("/api/admin/coupons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: coupon.id, status, is_active: status === "open" }),
    });
  }

  async function deleteCoupon(id: string) {
    if (!confirm("ลบคูปองนี้?")) return;
    await fetch("/api/admin/coupons", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
  }

  async function updateNotice(coupon: Coupon, notice: string) {
    await fetch("/api/admin/coupons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: coupon.id, notice }),
    });
  }

  const grouped: Record<CouponStatus, Coupon[]> = {
    open: coupons.filter((c) => c.status === "open"),
    paused: coupons.filter((c) => c.status === "paused"),
    sold_out: coupons.filter((c) => c.status === "sold_out"),
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-black text-brand-navy text-sm">🎟️ จัดการคูปอง</h2>
        <button onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20 transition-colors">
          {showForm ? <ChevronUp className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? "ซ่อน" : "เพิ่มคูปอง"}
        </button>
      </div>

      {showForm && (
        <div className="card space-y-3 border-2 border-brand-blue/20">
          <p className="font-black text-brand-navy text-sm">เพิ่มคูปองใหม่</p>
          <input className="input-field text-sm" placeholder="ชื่อคูปอง *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input-field text-sm" placeholder="บริษัท / ร้านค้า" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          <textarea className="input-field text-sm resize-none" rows={2} placeholder="รายละเอียดคูปอง" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <input className="input-field text-sm" type="number" min="1" placeholder="คอยน์ที่ต้องใช้ *" value={form.coins_required} onChange={(e) => setForm({ ...form, coins_required: e.target.value })} />
            <input className="input-field text-sm" type="number" min="1" placeholder="จำนวนคูปอง (ใบ)" value={form.max_redemptions} onChange={(e) => setForm({ ...form, max_redemptions: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block">วันเริ่มต้น</label>
              <input className="input-field text-sm" type="datetime-local" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block">วันสิ้นสุด</label>
              <input className="input-field text-sm" type="datetime-local" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} />
            </div>
          </div>
          <p className="text-xs font-black text-gray-500 uppercase tracking-wider">ข้อมูลการติดต่อ (ไม่บังคับ)</p>
          <input className="input-field text-sm" placeholder="📧 อีเมล" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
          <input className="input-field text-sm" placeholder="📞 เบอร์โทรศัพท์" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
          <input className="input-field text-sm" placeholder="💬 Line ID" value={form.contact_line} onChange={(e) => setForm({ ...form, contact_line: e.target.value })} />
          <input className="input-field text-sm" placeholder="📘 Facebook (URL หรือชื่อ)" value={form.contact_facebook} onChange={(e) => setForm({ ...form, contact_facebook: e.target.value })} />
          <input className="input-field text-sm" placeholder="📸 Instagram (@username)" value={form.contact_instagram} onChange={(e) => setForm({ ...form, contact_instagram: e.target.value })} />
          <textarea className="input-field text-sm resize-none" rows={2} placeholder="หมายเหตุ (แสดงให้ user เห็น)" value={form.notice} onChange={(e) => setForm({ ...form, notice: e.target.value })} />
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">สถานะเริ่มต้น</label>
            <div className="flex gap-1.5">
              {STATUS_OPTIONS.map((opt) => (
                <button key={opt.value} type="button" onClick={() => setForm({ ...form, status: opt.value })}
                  className={`flex-1 text-xs font-bold py-2 rounded-xl border-2 transition-all ${form.status === opt.value ? opt.active : opt.inactive}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-2xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-brand-blue/40 transition-colors">
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="preview" className="max-h-32 rounded-xl object-contain" />
                  <button type="button" onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <>
                  <ImageIcon className="w-6 h-6 text-gray-300" />
                  <p className="text-xs text-gray-400">แนบรูปภาพ (ไม่เกิน 5MB)</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
            {imageError && <p className="text-xs text-red-500 mt-1">{imageError}</p>}
          </div>
          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl border border-red-100">⚠️ {error}</p>}
          <button onClick={handleSubmit} disabled={saving}
            className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {saving ? "กำลังบันทึก..." : "เพิ่มคูปอง"}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-brand-blue animate-spin" /></div>
      ) : (
        <>
          {(["open", "paused", "sold_out"] as CouponStatus[]).map((s) =>
            grouped[s].length > 0 && (
              <div key={s} className="space-y-2">
                <div className="flex items-center gap-2">
                  <StatusBadge status={s} />
                  <span className="text-xs text-gray-400">({grouped[s].length})</span>
                </div>
                {grouped[s].map((c) => (
                  <CouponAdminCard key={c.id} coupon={c} onUpdateStatus={updateStatus} onDelete={deleteCoupon} onUpdateNotice={updateNotice} />
                ))}
              </div>
            )
          )}
          {coupons.length === 0 && (
            <div className="card text-center py-8">
              <p className="text-3xl mb-2">🎟️</p>
              <p className="text-sm text-gray-400">ยังไม่มีคูปอง</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CouponAdminCard({ coupon, onUpdateStatus, onDelete, onUpdateNotice }: {
  coupon: Coupon;
  onUpdateStatus: (c: Coupon, s: CouponStatus) => void;
  onDelete: (id: string) => void;
  onUpdateNotice: (c: Coupon, notice: string) => void;
}) {
  const [editNotice, setEditNotice] = useState(false);
  const [notice, setNotice] = useState(coupon.notice || "");
  const now = new Date();
  const expired = coupon.valid_until && new Date(coupon.valid_until) < now;

  return (
    <div className="card space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-black text-brand-navy text-sm truncate">{coupon.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-gray-400">{coupon.coins_required} คอยน์</p>
            {coupon.max_redemptions && <p className="text-xs text-gray-400">· จำกัด {coupon.max_redemptions} ใบ</p>}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <StatusBadge status={coupon.status} />
          <button onClick={() => onDelete(coupon.id)} className="p-1.5 rounded-lg bg-red-100 text-red-500 hover:bg-red-200 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-1.5">
        {STATUS_OPTIONS.map((opt) => (
          <button key={opt.value} onClick={() => onUpdateStatus(coupon, opt.value)}
            className={`flex-1 text-xs font-bold py-1.5 rounded-xl border-2 transition-all ${coupon.status === opt.value ? opt.active : opt.inactive}`}>
            {opt.label}
          </button>
        ))}
      </div>

      {coupon.image_url && <img src={coupon.image_url} alt={coupon.name} className="w-full max-h-24 object-cover rounded-xl" />}
      {(coupon.valid_from || coupon.valid_until) && (
        <p className="text-xs text-gray-400">
          {coupon.valid_from && `เริ่ม: ${new Date(coupon.valid_from).toLocaleDateString("th-TH")}`}
          {coupon.valid_from && coupon.valid_until && " · "}
          {coupon.valid_until && `สิ้นสุด: ${new Date(coupon.valid_until).toLocaleDateString("th-TH")}`}
          {expired && <span className="ml-1 text-red-500 font-bold">(หมดอายุ)</span>}
        </p>
      )}

      {!editNotice ? (
        <div className="flex items-center gap-2">
          {coupon.notice && <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg flex-1">📢 {coupon.notice}</p>}
          <button onClick={() => setEditNotice(true)} className="text-xs text-brand-blue hover:underline flex-shrink-0">
            {coupon.notice ? "แก้หมายเหตุ" : "+ หมายเหตุ"}
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          <textarea className="input-field text-xs resize-none" rows={2} value={notice} onChange={(e) => setNotice(e.target.value)} placeholder="หมายเหตุสำหรับ user..." />
          <div className="flex gap-2">
            <button onClick={() => { onUpdateNotice(coupon, notice); setEditNotice(false); }}
              className="flex-1 text-xs font-bold py-1.5 rounded-xl bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20 transition-colors">บันทึก</button>
            <button onClick={() => { setNotice(coupon.notice || ""); setEditNotice(false); }}
              className="flex-1 text-xs py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">ยกเลิก</button>
          </div>
        </div>
      )}
    </div>
  );
}
