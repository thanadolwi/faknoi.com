"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Clock, Users, Pencil, X, Check } from "lucide-react";

interface Props {
  tripId: string;
  cutoffTime: string;
  maxOrders: number;
  currentOrders: number;
  note?: string;
}

export default function EditTripForm({ tripId, cutoffTime, maxOrders, currentOrders, note }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // format datetime-local value
  const toLocalInput = (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [form, setForm] = useState({
    cutoff_time: toLocalInput(cutoffTime),
    max_orders: maxOrders,
    note: note || "",
  });

  function update(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setError("");
    if (form.max_orders < currentOrders) {
      setError(`มีออเดอร์อยู่แล้ว ${currentOrders} รายการ ไม่สามารถลดต่ำกว่านี้ได้`);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("trips")
      .update({
        cutoff_time: new Date(form.cutoff_time).toISOString(),
        max_orders: form.max_orders,
        note: form.note || null,
      })
      .eq("id", tripId);

    if (updateError) {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
      setLoading(false);
      return;
    }

    setOpen(false);
    setLoading(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-blue border border-gray-200 hover:border-brand-blue/40 px-3 py-2 rounded-xl transition-all"
      >
        <Pencil className="w-3.5 h-3.5" />
        แก้ไขทริป
      </button>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-brand-navy">แก้ไขการตั้งค่าทริป</span>
        <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-gray-200 transition-colors">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5 block">
          <Clock className="w-3.5 h-3.5 text-brand-blue" />
          เวลาตัดรอบใหม่
        </label>
        <input
          type="datetime-local"
          className="input-field text-sm"
          value={form.cutoff_time}
          onChange={(e) => update("cutoff_time", e.target.value)}
        />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5 block">
          <Users className="w-3.5 h-3.5 text-brand-blue" />
          จำนวนออเดอร์สูงสุด (ปัจจุบัน {currentOrders} รายการ)
        </label>
        <input
          type="number"
          className="input-field text-sm"
          min={currentOrders}
          max={30}
          value={form.max_orders}
          onChange={(e) => update("max_orders", parseInt(e.target.value))}
        />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-600 mb-1.5 block">หมายเหตุ</label>
        <textarea
          className="input-field text-sm resize-none"
          rows={2}
          value={form.note}
          onChange={(e) => update("note", e.target.value)}
          placeholder="เช่น รับเฉพาะอาหาร ไม่รับเครื่องดื่ม"
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-xl border border-red-100">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={loading}
          className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm py-2"
        >
          {loading
            ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <Check className="w-3.5 h-3.5" />}
          {loading ? "กำลังบันทึก..." : "บันทึก"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="flex-1 text-sm py-2 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
        >
          ยกเลิก
        </button>
      </div>
    </div>
  );
}
