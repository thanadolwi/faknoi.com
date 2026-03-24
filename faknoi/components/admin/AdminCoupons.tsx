"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, ToggleLeft, ToggleRight, ImageIcon, X, Loader2, ChevronDown, ChevronUp } from "lucide-react";

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
  is_active: boolean;
  notice: string | null;
  image_url: string | null;
  created_at: string;
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", company: "", coins_required: "", valid_from: "", valid_until: "",
    contact_info: "", contact_email: "", contact_phone: "", contact_line: "", contact_facebook: "",
    contact_instagram: "", is_active: true, notice: "",
  });
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
    const channel = supabase
      .channel("admin-coupons-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "coupons" }, () => loadCoupons())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
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
    fd.append("valid_from", form.valid_from);
    fd.append("valid_until", form.valid_until);
    fd.append("contact_info", form.contact_info);
    fd.append("contact_email", form.contact_email);
    fd.append("contact_phone", form.contact_phone);
    fd.append("contact_line", form.contact_line);
    fd.append("contact_facebook", form.contact_facebook);
    fd.append("contact_instagram", form.contact_instagram);
    fd.append("is_active", String(form.is_active));
    fd.append("notice", form.notice);
    if (imageFile) fd.append("image", imageFile);

    const res = await fetch("/api/admin/coupons", { method: "POST", body: fd });
    const json = await res.json();
    if (!res.ok) { setError(json.error || "เกิดข้อผิดพลาด"); setSaving(false); return; }
    setForm({ name: "", description: "", company: "", coins_required: "", valid_from: "", valid_until: "", contact_info: "", contact_email: "", contact_phone: "", contact_line: "", contact_facebook: "", contact_instagram: "", is_active: true, notice: "" });
    setImageFile(null); setImagePreview(null);
    setShowForm(false);
    setSaving(false);
    await loadCoupons();
  }

  async function toggleActive(coupon: Coupon) {
    const newNotice = !coupon.is_active ? "" : coupon.notice;
    await fetch("/api/admin/coupons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: coupon.id, is_active: !coupon.is_active, notice: newNotice }),
    });
    await loadCoupons();
  }

  async function deleteCoupon(id: string) {
    if (!confirm("ลบคูปองนี้?")) return;
    await fetch("/api/admin/coupons", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await loadCoupons();
  }

  async function updateNotice(coupon: Coupon, notice: string) {
    await fetch("/api/admin/coupons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: coupon.id, notice }),
    });
    await loadCoupons();
  }

  const activeCoupons = coupons.filter((c) => c.is_active);
  const inactiveCoupons = coupons.filter((c) => !c.is_active);

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

      {/* Add Form */}
      {showForm && (
        <div className="card space-y-3 border-2 border-brand-blue/20">
          <p className="font-black text-brand-navy text-sm">เพิ่มคูปองใหม่</p>
          <input className="input-field text-sm" placeholder="ชื่อคูปอง *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input-field text-sm" placeholder="บริษัท / ร้านค้า" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          <textarea className="input-field text-sm resize-none" rows={2} placeholder="รายละเอียดคูปอง" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input className="input-field text-sm" type="number" min="1" placeholder="จำนวนคอยน์ที่ต้องใช้ *" value={form.coins_required} onChange={(e) => setForm({ ...form, coins_required: e.target.value })} />
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
          <textarea className="input-field text-sm resize-none" rows={2} placeholder="หมายเหตุ (แสดงให้ user เห็น เช่น ปิดรับการแลกชั่วคราว)" value={form.notice} onChange={(e) => setForm({ ...form, notice: e.target.value })} />

          {/* Image upload */}
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

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setForm({ ...form, is_active: !form.is_active })}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-colors ${form.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {form.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              {form.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
            </button>
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
          {/* Active coupons */}
          {activeCoupons.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-black text-gray-500 uppercase tracking-wider">คูปองที่เปิดใช้งาน ({activeCoupons.length})</p>
              {activeCoupons.map((c) => <CouponAdminCard key={c.id} coupon={c} onToggle={toggleActive} onDelete={deleteCoupon} onUpdateNotice={updateNotice} />)}
            </div>
          )}
          {/* Inactive coupons */}
          {inactiveCoupons.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-black text-gray-500 uppercase tracking-wider">คูปองที่ปิด/หมดอายุ ({inactiveCoupons.length})</p>
              {inactiveCoupons.map((c) => <CouponAdminCard key={c.id} coupon={c} onToggle={toggleActive} onDelete={deleteCoupon} onUpdateNotice={updateNotice} />)}
            </div>
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

function CouponAdminCard({ coupon, onToggle, onDelete, onUpdateNotice }: {
  coupon: Coupon;
  onToggle: (c: Coupon) => void;
  onDelete: (id: string) => void;
  onUpdateNotice: (c: Coupon, notice: string) => void;
}) {
  const [editNotice, setEditNotice] = useState(false);
  const [notice, setNotice] = useState(coupon.notice || "");
  const now = new Date();
  const expired = coupon.valid_until && new Date(coupon.valid_until) < now;

  return (
    <div className={`card space-y-2 ${!coupon.is_active ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-black text-brand-navy text-sm truncate">{coupon.name}</p>
          <p className="text-xs text-gray-400">{coupon.coins_required} คอยน์</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={() => onToggle(coupon)}
            className={`p-1.5 rounded-lg transition-colors ${coupon.is_active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
            {coupon.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
          </button>
          <button onClick={() => onDelete(coupon.id)}
            className="p-1.5 rounded-lg bg-red-100 text-red-500 hover:bg-red-200 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {coupon.image_url && (
        <img src={coupon.image_url} alt={coupon.name} className="w-full max-h-24 object-cover rounded-xl" />
      )}
      {coupon.description && <p className="text-xs text-gray-500">{coupon.description}</p>}
      {(coupon.valid_from || coupon.valid_until) && (
        <p className="text-xs text-gray-400">
          {coupon.valid_from && `เริ่ม: ${new Date(coupon.valid_from).toLocaleDateString("th-TH")}`}
          {coupon.valid_from && coupon.valid_until && " · "}
          {coupon.valid_until && `สิ้นสุด: ${new Date(coupon.valid_until).toLocaleDateString("th-TH")}`}
          {expired && <span className="ml-1 text-red-500 font-bold">(หมดอายุ)</span>}
        </p>
      )}
      {coupon.contact_info && <p className="text-xs text-gray-500">📞 {coupon.contact_info}</p>}

      {/* Notice editor */}
      {!editNotice ? (
        <div className="flex items-center gap-2">
          {coupon.notice && <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg flex-1">📢 {coupon.notice}</p>}
          <button onClick={() => setEditNotice(true)} className="text-xs text-brand-blue hover:underline flex-shrink-0">
            {coupon.notice ? "แก้หมายเหตุ" : "+ หมายเหตุ"}
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          <textarea className="input-field text-xs resize-none" rows={2} value={notice} onChange={(e) => setNotice(e.target.value)}
            placeholder="หมายเหตุสำหรับ user..." />
          <div className="flex gap-2">
            <button onClick={() => { onUpdateNotice(coupon, notice); setEditNotice(false); }}
              className="flex-1 text-xs font-bold py-1.5 rounded-xl bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20 transition-colors">
              บันทึก
            </button>
            <button onClick={() => { setNotice(coupon.notice || ""); setEditNotice(false); }}
              className="flex-1 text-xs py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
              ยกเลิก
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
