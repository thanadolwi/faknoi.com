"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MapPin, Clock, Users, ArrowLeft, Plus, GraduationCap, Banknote, CreditCard } from "lucide-react";
import Link from "next/link";
import { UNIVERSITIES } from "@/lib/universities";

function ZoneSelect({
  label, icon, value, zones, onChange,
}: {
  label: string; icon: React.ReactNode; value: string;
  zones: string[]; onChange: (v: string) => void;
}) {
  const [showCustom, setShowCustom] = useState(false);
  const [customValue, setCustomValue] = useState("");

  function handleSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    if (e.target.value === "__custom__") {
      setShowCustom(true);
      onChange("");
    } else {
      setShowCustom(false);
      setCustomValue("");
      onChange(e.target.value);
    }
  }

  function handleCustomInput(e: React.ChangeEvent<HTMLInputElement>) {
    setCustomValue(e.target.value);
    onChange(e.target.value);
  }

  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5 block">
        {icon}{label}
      </label>
      <select
        className="input-field"
        value={showCustom ? "__custom__" : value}
        onChange={handleSelect}
        required={!showCustom}
      >
        <option value="">เลือกโซน</option>
        {zones.map((z) => <option key={z} value={z}>{z}</option>)}
        <option value="__custom__">อื่นๆ (พิมพ์เอง)</option>
      </select>
      {showCustom && (
        <input
          type="text"
          className="input-field mt-2"
          placeholder="ระบุโซนของคุณ"
          value={customValue}
          onChange={handleCustomInput}
          required
          autoFocus
        />
      )}
    </div>
  );
}

export default function CreateTripPage() {
  const router = useRouter();
  const [selectedUniId, setSelectedUniId] = useState("");
  const [form, setForm] = useState({
    origin_zone: "",
    destination_zone: "",
    cutoff_time: "",
    max_orders: 5,
    fee_per_item: 5,
    payment_info: "",
    note: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedUni = UNIVERSITIES.find((u) => u.id === selectedUniId);

  function update(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.origin_zone || form.origin_zone === "__custom__") {
      setError("กรุณาระบุโซนที่จะไปซื้อ"); return;
    }
    if (!form.destination_zone || form.destination_zone === "__custom__") {
      setError("กรุณาระบุโซนที่จะไปส่ง"); return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { error } = await supabase.from("trips").insert({
      shopper_id: user.id,
      university_id: selectedUniId,
      origin_zone: form.origin_zone,
      destination_zone: form.destination_zone,
      cutoff_time: new Date(form.cutoff_time).toISOString(),
      max_orders: form.max_orders,
      fee_per_item: form.fee_per_item,
      payment_info: form.payment_info || null,
      note: form.note || null,
      status: "open",
      current_orders: 0,
    });

    if (error) {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
      setLoading(false);
      return;
    }
    router.push("/trips");
    router.refresh();
  }

  return (
    <div className="max-w-lg mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/trips" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-brand-navy">เปิดทริปใหม่</h1>
          <p className="text-sm text-gray-400">ระบุรายละเอียดทริปของคุณ</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Section: Location */}
        <div className="card space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">📍 เส้นทาง</p>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5 block">
              <GraduationCap className="w-3.5 h-3.5 text-brand-blue" />
              มหาวิทยาลัย
            </label>
            <select
              className="input-field"
              value={selectedUniId}
              onChange={(e) => {
                setSelectedUniId(e.target.value);
                update("origin_zone", "");
                update("destination_zone", "");
              }}
              required
            >
              <option value="">เลือกมหาวิทยาลัย</option>
              {UNIVERSITIES.map((uni) => (
                <option key={uni.id} value={uni.id}>{uni.name}</option>
              ))}
            </select>
          </div>

          {selectedUni && (
            <div className="grid grid-cols-2 gap-3">
              <ZoneSelect
                label="โซนที่จะไปซื้อ"
                icon={<MapPin className="w-3.5 h-3.5 text-brand-blue" />}
                value={form.origin_zone}
                zones={selectedUni.zones}
                onChange={(v) => update("origin_zone", v)}
              />
              <ZoneSelect
                label="โซนที่จะไปส่ง"
                icon={<MapPin className="w-3.5 h-3.5 text-brand-cyan" />}
                value={form.destination_zone}
                zones={selectedUni.zones}
                onChange={(v) => update("destination_zone", v)}
              />
            </div>
          )}
        </div>

        {/* Section: Time & Capacity */}
        <div className="card space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">⏰ เวลาและจำนวน</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5 block">
                <Clock className="w-3.5 h-3.5 text-brand-blue" />เวลาตัดรอบ
              </label>
              <input type="datetime-local" className="input-field" value={form.cutoff_time}
                onChange={(e) => update("cutoff_time", e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5 block">
                <Users className="w-3.5 h-3.5 text-brand-blue" />ออเดอร์สูงสุด
              </label>
              <input type="number" className="input-field" min={1} max={20} value={form.max_orders}
                onChange={(e) => update("max_orders", parseInt(e.target.value))} required />
            </div>
          </div>
        </div>

        {/* Section: Fee & Payment */}
        <div className="card space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">💰 ค่าบริการและการชำระเงิน</p>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5 block">
              <Banknote className="w-3.5 h-3.5 text-brand-blue" />
              ค่าหิ้วต่อชิ้น (บาท)
            </label>
            <input type="number" className="input-field" min={0} step={0.5} value={form.fee_per_item}
              onChange={(e) => update("fee_per_item", parseFloat(e.target.value))} />
            <p className="text-xs text-gray-400 mt-1.5">ระบุ 0 หากไม่คิดค่าบริการ</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5 block">
              <CreditCard className="w-3.5 h-3.5 text-brand-blue" />
              ข้อมูลการชำระเงิน
            </label>
            <textarea className="input-field resize-none" rows={3}
              placeholder={"เช่น PromptPay 0812345678 ชื่อ นายสมชาย ใจดี\nหรือ กรุณาโอนก่อนรับของ"}
              value={form.payment_info}
              onChange={(e) => update("payment_info", e.target.value)} />
            <p className="text-xs text-amber-600 mt-1.5 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
              ⚠️ ข้อมูลนี้จะแสดงต่อผู้ซื้อหลังจากที่คุณกดสถานะ "ซื้อสินค้าเสร็จแล้ว" เท่านั้น
            </p>
          </div>
        </div>

        {/* Section: Note */}
        <div className="card">
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">📝 หมายเหตุ (ไม่บังคับ)</label>
          <textarea className="input-field resize-none" rows={2}
            placeholder="เช่น รับเฉพาะอาหาร ไม่รับเครื่องดื่ม"
            value={form.note} onChange={(e) => update("note", e.target.value)} />
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">{error}</div>
        )}

        <button type="submit" disabled={loading || !selectedUniId} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
          {loading
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <Plus className="w-4 h-4" />}
          {loading ? "กำลังสร้าง..." : "เปิดทริป"}
        </button>
      </form>
    </div>
  );
}
