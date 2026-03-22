"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, ToggleLeft, ToggleRight, Save } from "lucide-react";
import Link from "next/link";
import type { University } from "@/lib/universities";

interface AreaState {
  is_open: boolean;
  note: string;
  saving: boolean;
}

export default function AdminAreas({ universities }: { universities: University[] }) {
  const [areas, setAreas] = useState<Record<string, AreaState>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/areas")
      .then((r) => r.json())
      .then((d) => {
        const map: Record<string, AreaState> = {};
        for (const u of universities) {
          const existing = (d.areas || []).find((a: any) => a.university_id === u.id);
          map[u.id] = { is_open: existing?.is_open ?? true, note: existing?.note || "", saving: false };
        }
        setAreas(map);
        setLoading(false);
      });
  }, [universities]);

  async function saveArea(uniId: string) {
    setAreas((prev) => ({ ...prev, [uniId]: { ...prev[uniId], saving: true } }));
    await fetch("/api/admin/areas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ universityId: uniId, isOpen: areas[uniId].is_open, note: areas[uniId].note }),
    });
    setAreas((prev) => ({ ...prev, [uniId]: { ...prev[uniId], saving: false } }));
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 text-brand-blue animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-brand-navy">🏫 พื้นที่</h1>
          <p className="text-sm text-gray-400">เปิด/ปิดการใช้งานแต่ละมหาวิทยาลัย</p>
        </div>
      </div>

      <div className="space-y-3">
        {universities.map((u) => {
          const area = areas[u.id];
          if (!area) return null;
          return (
            <div key={u.id} className={`card space-y-3 ${!area.is_open ? "border-2 border-red-200 bg-red-50/30" : ""}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-black text-brand-navy">{u.shortName}</p>
                  <p className="text-xs text-gray-400">{u.name}</p>
                </div>
                <button
                  onClick={() => setAreas((prev) => ({ ...prev, [u.id]: { ...prev[u.id], is_open: !prev[u.id].is_open } }))}
                  className="flex items-center gap-2"
                >
                  {area.is_open
                    ? <ToggleRight className="w-8 h-8 text-green-500" />
                    : <ToggleLeft className="w-8 h-8 text-gray-300" />}
                  <span className={`text-xs font-bold ${area.is_open ? "text-green-600" : "text-gray-400"}`}>
                    {area.is_open ? "เปิด" : "ปิด"}
                  </span>
                </button>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">หมายเหตุ (แสดงให้ผู้ใช้เห็น)</label>
                <input
                  type="text"
                  className="input-field text-sm"
                  placeholder="เช่น ปิดปรับปรุงชั่วคราว"
                  value={area.note}
                  onChange={(e) => setAreas((prev) => ({ ...prev, [u.id]: { ...prev[u.id], note: e.target.value } }))}
                />
              </div>
              <button onClick={() => saveArea(u.id)} disabled={area.saving}
                className="btn-primary w-full text-sm py-2 flex items-center justify-center gap-2">
                {area.saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                บันทึก
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
