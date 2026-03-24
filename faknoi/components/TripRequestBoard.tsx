"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Clock, MapPin, Edit2, Trash2, Loader2, X, Check } from "lucide-react";
import Link from "next/link";
import { UNIVERSITIES } from "@/lib/universities";
import CountdownTimer from "./CountdownTimer";

interface TripRequest {
  id: string;
  user_id: string;
  university_id: string;
  zone: string;
  cutoff_time: string;
  estimated_delivery_time: string | null;
  expires_at: string;
  note: string | null;
  created_at: string;
  profiles?: { username: string };
}

interface Props {
  currentUserId: string;
}

const emptyForm = {
  university_id: "",
  zone: "",
  cutoff_time: "",
  estimated_delivery_time: "",
  expires_at: "",
  note: "",
};

export default function TripRequestBoard({ currentUserId }: Props) {
  const [requests, setRequests] = useState<TripRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const zones = form.university_id
    ? UNIVERSITIES.find((u) => u.id === form.university_id)?.zones || []
    : [];

  async function loadRequests() {
    const supabase = createClient();
    const now = new Date().toISOString();
    const { data } = await supabase
      .from("trip_requests")
      .select("*, profiles(username)")
      .gt("expires_at", now)
      .order("created_at", { ascending: false });
    setRequests((data || []) as TripRequest[]);
    setLoading(false);
  }

  useEffect(() => {
    loadRequests();
    const supabase = createClient();
    const channel = supabase
      .channel("trip-requests-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "trip_requests" }, () => {
        loadRequests();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    setEditId(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  }

  function openEdit(r: TripRequest) {
    setEditId(r.id);
    setForm({
      university_id: r.university_id,
      zone: r.zone,
      cutoff_time: r.cutoff_time.slice(0, 16),
      estimated_delivery_time: r.estimated_delivery_time ? r.estimated_delivery_time.slice(0, 16) : "",
      expires_at: r.expires_at.slice(0, 16),
      note: r.note || "",
    });
    setError("");
    setShowForm(true);
  }

  async function handleSave() {
    setError("");
    if (!form.university_id) { setError("กรุณาเลือกมหาวิทยาลัย"); return; }
    if (!form.zone) { setError("กรุณาเลือกโซน"); return; }
    if (!form.cutoff_time) { setError("กรุณากรอกเวลาตัดรอบ"); return; }
    if (!form.expires_at) { setError("กรุณากรอกเวลาสิ้นสุดกระทู้"); return; }

    setSaving(true);
    const supabase = createClient();
    const payload = {
      university_id: form.university_id,
      zone: form.zone,
      cutoff_time: new Date(form.cutoff_time).toISOString(),
      estimated_delivery_time: form.estimated_delivery_time ? new Date(form.estimated_delivery_time).toISOString() : null,
      expires_at: new Date(form.expires_at).toISOString(),
      note: form.note || null,
      updated_at: new Date().toISOString(),
    };

    if (editId) {
      await supabase.from("trip_requests").update(payload).eq("id", editId);
    } else {
      await supabase.from("trip_requests").insert({ ...payload, user_id: currentUserId });
    }

    setSaving(false);
    setShowForm(false);
    setEditId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("ลบกระทู้นี้?")) return;
    const supabase = createClient();
    await supabase.from("trip_requests").delete().eq("id", id);
  }

  const uni = (id: string) => UNIVERSITIES.find((u) => u.id === id);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-black text-brand-navy">📢 หาคนรับหิ้ว</h2>
        {currentUserId && (
          <button onClick={openCreate}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20 transition-colors">
            <Plus className="w-3.5 h-3.5" /> โพสหาคนรับหิ้ว
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="card border-2 border-brand-blue/20 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-black text-brand-navy text-sm">{editId ? "แก้ไขกระทู้" : "โพสหาคนรับหิ้ว"}</p>
            <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">มหาวิทยาลัย *</label>
            <select className="input-field text-sm" value={form.university_id}
              onChange={(e) => setForm({ ...form, university_id: e.target.value, zone: "" })}>
              <option value="">เลือกมหาวิทยาลัย</option>
              {UNIVERSITIES.map((u) => (
                <option key={u.id} value={u.id}>{u.shortName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">โซน *</label>
            <select className="input-field text-sm" value={form.zone === "" || zones.includes(form.zone) ? form.zone : "other"}
              onChange={(e) => {
                if (e.target.value === "other") {
                  setForm({ ...form, zone: "__other__" });
                } else {
                  setForm({ ...form, zone: e.target.value });
                }
              }}
              disabled={!form.university_id}>
              <option value="">เลือกโซน</option>
              {zones.map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
              <option value="other">อื่นๆ (กรอกเอง)</option>
            </select>
            {(form.zone === "__other__" || (form.zone !== "" && !zones.includes(form.zone) && form.zone !== "__other__")) && (
              <input
                className="input-field text-sm mt-2"
                placeholder="กรอกชื่อโซน..."
                value={form.zone === "__other__" ? "" : form.zone}
                onChange={(e) => setForm({ ...form, zone: e.target.value })}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block">เวลาตัดรอบ *</label>
              <input type="datetime-local" className="input-field text-sm" value={form.cutoff_time}
                onChange={(e) => setForm({ ...form, cutoff_time: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block">ประมาณการส่ง</label>
              <input type="datetime-local" className="input-field text-sm" value={form.estimated_delivery_time}
                onChange={(e) => setForm({ ...form, estimated_delivery_time: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">กระทู้หมดอายุเมื่อ *</label>
            <input type="datetime-local" className="input-field text-sm" value={form.expires_at}
              onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
          </div>

          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">หมายเหตุ</label>
            <textarea className="input-field text-sm resize-none" rows={2} placeholder="เช่น ต้องการหิ้วของจากร้าน..."
              value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </div>

          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl border border-red-100">⚠️ {error}</p>}

          <button onClick={handleSave} disabled={saving}
            className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? "กำลังบันทึก..." : editId ? "บันทึกการแก้ไข" : "โพสกระทู้"}
          </button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-brand-blue animate-spin" /></div>
      ) : requests.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-3xl mb-2">📭</p>
          <p className="text-sm text-gray-400">ยังไม่มีกระทู้หาคนรับหิ้ว</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {requests.map((r) => {
            const u = uni(r.university_id);
            const isOwner = r.user_id === currentUserId;
            return (
              <div key={r.id} className="card space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-brand-blue/10 text-brand-blue">
                        {u?.shortName || r.university_id}
                      </span>
                      <span className="font-black text-brand-navy text-sm">{r.zone}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">โดย @{r.profiles?.username}</p>
                  </div>
                  {isOwner && (
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => openEdit(r)}
                        className="p-1.5 rounded-lg bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20 transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(r.id)}
                        className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    ตัดรอบ {new Date(r.cutoff_time).toLocaleString("th-TH", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                  </span>
                  {r.estimated_delivery_time && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      ส่งประมาณ {new Date(r.estimated_delivery_time).toLocaleString("th-TH", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                    </span>
                  )}
                </div>

                {r.note && (
                  <p className="text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-xl">{r.note}</p>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    หมดใน <CountdownTimer cutoffTime={r.expires_at} />
                  </div>
                  {!isOwner && (
                    <Link href="/trips/create"
                      className="text-xs font-black px-3 py-2 rounded-xl text-white transition-all active:scale-95"
                      style={{ background: "linear-gradient(135deg,#5478FF,#53CBF3)" }}>
                      ไปเปิดทริปรับหิ้ว
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
