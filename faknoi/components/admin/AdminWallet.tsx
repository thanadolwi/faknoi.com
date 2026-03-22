"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Loader2, ChevronDown, BadgeCheck, CheckCircle, XCircle, History } from "lucide-react";
import Link from "next/link";
import type { University } from "@/lib/universities";
import { createClient } from "@/lib/supabase/client";

type SlipStatus = "pending" | "verified" | "updated" | "rejected";

const statusMeta: Record<SlipStatus, { label: string; color: string }> = {
  pending:  { label: "กำลังตรวจสลิป",       color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  verified: { label: "ตรวจสอบเรียบร้อย",    color: "bg-blue-100 text-blue-700 border-blue-200" },
  updated:  { label: "อัปเดตข้อมูลเสร็จสิ้น", color: "bg-green-100 text-green-700 border-green-200" },
  rejected: { label: "ไม่ผ่านการตรวจสอบ",   color: "bg-red-100 text-red-700 border-red-200" },
};

export default function AdminWallet({ universities }: { universities: University[] }) {
  const [tab, setTab] = useState<"pending" | "history">("pending");
  const [selectedUni, setSelectedUni] = useState("all");
  const [slips, setSlips] = useState<any[]>([]);
  const [historySlips, setHistorySlips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSlips = useCallback(async () => {
    setLoading(true);
    const [pendingRes, historyRes, verifiedRes] = await Promise.all([
      fetch(`/api/admin/slips?status=pending${selectedUni !== "all" ? `&uni=${selectedUni}` : ""}`),
      fetch(`/api/admin/slips?status=updated${selectedUni !== "all" ? `&uni=${selectedUni}` : ""}`),
      fetch(`/api/admin/slips?status=verified${selectedUni !== "all" ? `&uni=${selectedUni}` : ""}`),
    ]);
    const [pendingData, historyData, verifiedData] = await Promise.all([
      pendingRes.json(), historyRes.json(), verifiedRes.json(),
    ]);
    setSlips([...(pendingData.slips || []), ...(verifiedData.slips || [])]);
    setHistorySlips(historyData.slips || []);
    setLoading(false);
  }, [selectedUni]);

  useEffect(() => {
    loadSlips();

    const supabase = createClient();
    const channel = supabase
      .channel("admin-wallet-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "payment_slips" }, () => loadSlips())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadSlips]);

  async function updateSlip(slip: any, status: SlipStatus, extra?: { rejectedNote?: string; amountVerified?: number; verifiedNote?: string }) {
    await fetch("/api/admin/slips", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slipId: slip.id, status, slip, ...extra }),
    });
    await loadSlips();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-brand-navy">💰 ตรวจสลิป</h1>
          <p className="text-sm text-gray-400">ตรวจสอบการชำระค่าบริการ</p>
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

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab("pending")}
          className={`flex-1 py-2.5 rounded-2xl text-sm font-black border-2 transition-all ${tab === "pending" ? "border-brand-blue text-white" : "border-gray-100 text-gray-500 bg-white"}`}
          style={tab === "pending" ? { background: "linear-gradient(135deg,#5478FF,#53CBF3)" } : {}}>
          ตรวจสลิปค้างชำระ ({slips.length})
        </button>
        <button onClick={() => setTab("history")}
          className={`flex-1 py-2.5 rounded-2xl text-sm font-black border-2 transition-all ${tab === "history" ? "border-brand-blue text-white" : "border-gray-100 text-gray-500 bg-white"}`}
          style={tab === "history" ? { background: "linear-gradient(135deg,#5478FF,#53CBF3)" } : {}}>
          <History className="w-3.5 h-3.5 inline mr-1" />ประวัติ ({historySlips.length})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 text-brand-blue animate-spin" />
        </div>
      ) : tab === "pending" ? (
        <SlipList slips={slips} onUpdate={updateSlip} />
      ) : (
        <HistoryList slips={historySlips} />
      )}
    </div>
  );
}

function SlipList({ slips, onUpdate }: { slips: any[]; onUpdate: (slip: any, status: SlipStatus, extra?: any) => Promise<void> }) {
  if (slips.length === 0) return (
    <div className="card text-center py-12">
      <p className="text-4xl mb-3">✅</p>
      <p className="text-sm text-gray-400">ไม่มีสลิปค้างตรวจ</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {slips.map((slip) => <SlipCard key={slip.id} slip={slip} onUpdate={onUpdate} />)}
    </div>
  );
}

function SlipCard({ slip, onUpdate }: { slip: any; onUpdate: (slip: any, status: SlipStatus, extra?: any) => Promise<void> }) {
  const [loading, setLoading] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [showVerifyAmount, setShowVerifyAmount] = useState(false);
  const [amountVerified, setAmountVerified] = useState(String(slip.amount_paid || ""));
  const [verifiedNote, setVerifiedNote] = useState("");

  const s = statusMeta[slip.status as SlipStatus] || statusMeta.pending;
  const remaining = Math.max(0, Number(slip.outstanding_before) - Number(slip.amount_paid));

  async function act(status: SlipStatus, extra?: any) {
    setLoading(true);
    await onUpdate(slip, status, extra);
    setLoading(false);
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-black text-brand-navy">@{slip.profiles?.username}</span>
        <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border ${s.color}`}>
          {s.label}
        </span>
      </div>
      <div className="text-xs text-gray-600 space-y-0.5">
        <p>ยอดที่กรอก: <span className="font-black text-brand-navy">฿{Number(slip.amount_paid).toFixed(2)}</span></p>
        <p>ค้างก่อนชำระ: <span className="font-black text-brand-navy">฿{Number(slip.outstanding_before).toFixed(2)}</span></p>
        {remaining > 0 && <p className="text-orange-600 font-bold">ยังค้างอยู่: ฿{remaining.toFixed(2)}</p>}
      </div>
      <a href={slip.slip_url} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden border border-gray-200">
        <img src={slip.slip_url} alt="slip" className="w-full max-h-48 object-contain bg-white" />
      </a>

      {slip.status === "pending" && (
        <div className="space-y-2">
          {!showReject ? (
            <div className="flex gap-2">
              <button onClick={() => act("verified")} disabled={loading}
                className="flex-1 text-xs font-bold py-2 rounded-xl bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors flex items-center justify-center gap-1">
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BadgeCheck className="w-3.5 h-3.5" />}
                ตรวจสอบเรียบร้อย
              </button>
              <button onClick={() => setShowReject(true)} disabled={loading}
                className="flex-1 text-xs font-bold py-2 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition-colors flex items-center justify-center gap-1">
                <XCircle className="w-3.5 h-3.5" />ไม่ผ่าน
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <input type="text" className="input-field text-sm" placeholder="หมายเหตุที่ไม่ผ่าน *"
                value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} />
              <div className="flex gap-2">
                <button onClick={() => act("rejected", { rejectedNote: rejectNote })} disabled={loading || !rejectNote.trim()}
                  className="flex-1 text-xs font-bold py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors">
                  ยืนยันไม่ผ่าน
                </button>
                <button onClick={() => setShowReject(false)}
                  className="flex-1 text-xs py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                  ยกเลิก
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {slip.status === "verified" && (
        <div className="space-y-2">
          {!showVerifyAmount ? (
            <div className="flex gap-2">
              <button onClick={() => setShowVerifyAmount(true)}
                className="flex-1 text-xs font-bold py-2 rounded-xl bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20 transition-colors">
                กรอกจำนวนเงิน
              </button>
              <button onClick={() => act("updated")} disabled={loading}
                className="flex-1 text-xs font-bold py-2 rounded-xl bg-green-100 text-green-700 hover:bg-green-200 transition-colors flex items-center justify-center gap-1">
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                อัปเดตข้อมูลเสร็จสิ้น
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <input type="number" className="input-field text-sm" placeholder="จำนวนเงินที่ยืนยัน (บาท)"
                value={amountVerified} onChange={(e) => setAmountVerified(e.target.value)} />
              <input type="text" className="input-field text-sm" placeholder="หมายเหตุการปรับยอด (ถ้ามี)"
                value={verifiedNote} onChange={(e) => setVerifiedNote(e.target.value)} />
              {amountVerified && (
                <p className="text-xs text-orange-600 font-bold">
                  ยังค้างอยู่: ฿{Math.max(0, Number(slip.outstanding_before) - parseFloat(amountVerified || "0")).toFixed(2)}
                </p>
              )}
              <div className="flex gap-2">
                <button onClick={() => act("updated", { amountVerified: parseFloat(amountVerified), verifiedNote })}
                  disabled={loading || !amountVerified}
                  className="flex-1 text-xs font-bold py-2 rounded-xl bg-green-100 text-green-700 hover:bg-green-200 transition-colors">
                  ยืนยันและอัปเดต
                </button>
                <button onClick={() => setShowVerifyAmount(false)}
                  className="flex-1 text-xs py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                  ยกเลิก
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {slip.rejected_note && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-xl border border-red-100">
          ❌ หมายเหตุ: {slip.rejected_note}
        </p>
      )}
    </div>
  );
}

function HistoryList({ slips }: { slips: any[] }) {
  if (slips.length === 0) return (
    <div className="card text-center py-12">
      <p className="text-4xl mb-3">📂</p>
      <p className="text-sm text-gray-400">ยังไม่มีประวัติ</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {slips.map((slip) => (
        <div key={slip.id} className="card space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-black text-brand-navy">@{slip.profiles?.username}</span>
            <span className="text-xs text-gray-400">{new Date(slip.created_at).toLocaleDateString("th-TH")}</span>
          </div>
          <div className="text-xs text-gray-600 space-y-0.5">
            <p>ยอดที่กรอก: <span className="font-black">฿{Number(slip.amount_paid).toFixed(2)}</span></p>
            {slip.amount_verified != null && (
              <p>ยอดที่ยืนยัน: <span className="font-black text-green-700">฿{Number(slip.amount_verified).toFixed(2)}</span></p>
            )}
            {slip.verified_note && <p className="text-gray-500">หมายเหตุ: {slip.verified_note}</p>}
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border bg-green-100 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3" />อัปเดตข้อมูลเสร็จสิ้น
          </span>
        </div>
      ))}
    </div>
  );
}
