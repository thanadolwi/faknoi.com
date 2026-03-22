"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { TrendingUp, AlertCircle, Upload, ImageIcon, X, CheckCircle, Clock, BadgeCheck, RefreshCw, Wallet } from "lucide-react";
import { useLang } from "@/lib/LangContext";
import { t } from "@/lib/i18n";

const MAX_SIZE = 500 * 1024;

type SlipStatus = "pending" | "verified" | "updated";

export default function WalletPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [outstanding, setOutstanding] = useState(0);
  const [mySlips, setMySlips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [amountInput, setAmountInput] = useState("");
  const [amountError, setAmountError] = useState("");
  const [userId, setUserId] = useState("");
  // Admin
  const [isAdmin, setIsAdmin] = useState(false);
  const [allSlips, setAllSlips] = useState<any[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const { lang } = useLang();

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Check admin by role
      const { data: profile } = await supabase
        .from("profiles")
        .select("outstanding_balance, role")
        .eq("id", user.id)
        .single();
      const adminMode = profile?.role === "admin";
      setIsAdmin(adminMode);
      setOutstanding(Number(profile?.outstanding_balance || 0));

      // Load completed orders
      const { data: myTrips } = await supabase.from("trips").select("id").eq("shopper_id", user.id);
      const tripIds = (myTrips || []).map((t: any) => t.id);
      if (tripIds.length) {
        const { data } = await supabase
          .from("orders")
          .select("id, final_price, created_at, trips(origin_zone, destination_zone)")
          .in("trip_id", tripIds)
          .eq("status", "completed")
          .not("final_price", "is", null)
          .order("created_at", { ascending: false });
        setOrders(data || []);
      }

      // Load my slips
      const { data: slips } = await supabase
        .from("payment_slips")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setMySlips(slips || []);

      // Admin: load all slips via API (bypasses RLS)
      if (adminMode) {
        const res = await fetch("/api/admin/slips");
        const json = await res.json();
        console.log("admin slips response:", json);
        setAllSlips(json.slips || []);
      }

      setLoading(false);
    }
    load();
  }, []);

  const totalActual = orders.reduce((s, o) => s + Number(o.final_price), 0);
  const totalFee = Math.round(totalActual * 0.05 * 100) / 100;
  const hasFee = totalFee > 0 || outstanding > 0;

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setFileError("");
    if (!f) return;
    if (f.size > MAX_SIZE) { setFileError(t(lang, "w_file_too_big")); return; }
    if (!f.type.startsWith("image/")) { setFileError(t(lang, "w_file_type")); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function validateAmount(): boolean {
    const val = parseFloat(amountInput);
    if (!amountInput || isNaN(val) || val <= 0) {
      setAmountError("กรุณากรอกยอดชำระ");
      return false;
    }
    if (val > outstanding) {
      setAmountError(`คุณค้างชำระ FakNoi เพียงจำนวนเงิน ${outstanding.toFixed(2)} บาท`);
      return false;
    }
    setAmountError("");
    return true;
  }

  async function handleUpload() {
    if (!file || !validateAmount()) return;
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${userId}/fee-slip-${Date.now()}.${ext}`;
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from("payment-slips")
      .upload(path, file, { upsert: true });
    if (uploadErr) { setFileError(t(lang, "w_upload_fail")); setUploading(false); return; }

    const { data: urlData } = supabase.storage.from("payment-slips").getPublicUrl(path);
    const slipUrl = urlData?.publicUrl || path;
    const amountPaid = parseFloat(amountInput);

    await supabase.from("payment_slips").insert({
      user_id: userId,
      slip_url: slipUrl,
      amount_paid: amountPaid,
      outstanding_before: outstanding,
      status: "pending",
    });

    setUploaded(true);
    setUploading(false);
    // Refresh slips
    const { data: slips } = await supabase
      .from("payment_slips")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setMySlips(slips || []);
  }

  async function adminUpdateSlip(slipId: string, slip: any, newStatus: SlipStatus) {
    await fetch("/api/admin/slips", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slipId, status: newStatus, slip }),
    });
    // Refresh
    const res = await fetch("/api/admin/slips");
    const json = await res.json();
    setAllSlips(json.slips || []);
  }

  const statusBadge: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    pending:  { label: "กำลังตรวจสลิปการโอนเงิน", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: <Clock className="w-3.5 h-3.5" /> },
    verified: { label: "ตรวจสอบเรียบร้อย",         color: "bg-blue-100 text-blue-700 border-blue-200",     icon: <BadgeCheck className="w-3.5 h-3.5" /> },
    updated:  { label: "อัปเดตข้อมูลเสร็จสิ้น",    color: "bg-green-100 text-green-700 border-green-200",  icon: <CheckCircle className="w-3.5 h-3.5" /> },
    rejected: { label: "ไม่ผ่านการตรวจสอบ",        color: "bg-red-100 text-red-700 border-red-200",        icon: <AlertCircle className="w-3.5 h-3.5" /> },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="w-6 h-6 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-5 pb-10">
      <div>
        <h1 className="text-xl font-black text-brand-navy">{t(lang, "w_title")}</h1>
        <p className="text-sm text-gray-400 mt-0.5">{t(lang, "w_subtitle")}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card text-center py-5">
          <p className="text-xs text-gray-400 font-medium mb-1">{t(lang, "w_total")}</p>
          <p className="text-2xl font-black text-brand-navy">฿{totalActual.toFixed(2)}</p>
          <p className="text-xs text-gray-300 mt-1">{orders.length} {t(lang, "w_orders_count")}</p>
        </div>
        <div className="card text-center py-5" style={{background:"linear-gradient(135deg,#5478FF,#53CBF3)"}}>
          <p className="text-xs text-white/70 font-medium mb-1">ค้างชำระ FakNoi</p>
          <p className="text-2xl font-black text-white">฿{outstanding.toFixed(2)}</p>
          <p className="text-xs text-white/60 mt-1">5% ของรายได้</p>
        </div>
      </div>

      {/* Admin Panel */}
      {isAdmin && (
        <div className="card space-y-3 border-2 border-brand-blue/20">
          <div className="flex items-center gap-2">
            <BadgeCheck className="w-4 h-4 text-brand-blue" />
            <p className="font-black text-brand-navy text-sm">🛡️ Admin — ตรวจสลิปทั้งหมด</p>
          </div>
          {allSlips.length === 0 ? (
            <p className="text-xs text-gray-400">ยังไม่มีสลิป</p>
          ) : (
            <div className="space-y-3">
              {allSlips.map((slip: any) => {
                const s = statusBadge[slip.status as SlipStatus] || statusBadge.pending;
                return (
                  <div key={slip.id} className="bg-gray-50 rounded-2xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-brand-navy">@{slip.profiles?.username}</span>
                      <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border ${s.color}`}>
                        {s.icon}{s.label}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 space-y-0.5">
                      <p>ยอดที่กรอก: <span className="font-black text-brand-navy">฿{Number(slip.amount_paid).toFixed(2)}</span></p>
                      <p>ค้างก่อนชำระ: <span className="font-black text-brand-navy">฿{Number(slip.outstanding_before).toFixed(2)}</span></p>
                      {slip.outstanding_before > slip.amount_paid && (
                        <p className="text-orange-600 font-bold">ยังค้างอยู่: ฿{(slip.outstanding_before - slip.amount_paid).toFixed(2)}</p>
                      )}
                    </div>
                    <a href={slip.slip_url} target="_blank" rel="noopener noreferrer"
                      className="block rounded-xl overflow-hidden border border-gray-200">
                      <img src={slip.slip_url} alt="slip" className="w-full max-h-40 object-contain bg-white" />
                    </a>
                    {slip.status !== "updated" && (
                      <div className="flex gap-2">
                        {slip.status === "pending" && (
                          <button onClick={() => adminUpdateSlip(slip.id, slip, "verified")}
                            className="flex-1 text-xs font-bold py-2 rounded-xl bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">
                            ✅ ตรวจสอบเรียบร้อย
                          </button>
                        )}
                        {slip.status === "verified" && (
                          <button onClick={() => adminUpdateSlip(slip.id, slip, "updated")}
                            className="flex-1 text-xs font-bold py-2 rounded-xl bg-green-100 text-green-700 hover:bg-green-200 transition-colors">
                            🔄 อัปเดตข้อมูลเสร็จสิ้น
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Payment Section */}
      {hasFee && (
        <>
          <div className="card border-2 border-brand-yellow/40 bg-brand-yellow/5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-black text-brand-navy text-sm mb-1">{t(lang, "w_payment_channel")}</p>
                <p className="text-sm text-gray-600 font-medium">
                  {t(lang, "w_promptpay")}: <span className="font-black text-brand-navy">0812345678</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">{t(lang, "w_account_name")}</p>
              </div>
            </div>
          </div>

          <div className="card space-y-3">
            <p className="font-black text-brand-navy text-sm">{t(lang, "w_attach_slip")}</p>
            <p className="text-xs text-gray-400 font-medium">{t(lang, "w_slip_size")}</p>

            {/* Amount Input */}
            <div>
              <label className="text-sm font-bold text-brand-navy mb-1.5 flex items-center gap-1.5 block">
                <Wallet className="w-3.5 h-3.5 text-brand-blue" />
                ยอดที่ชำระ (บาท) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                className="input-field"
                placeholder={`ค้างชำระอยู่ ฿${outstanding.toFixed(2)}`}
                value={amountInput}
                onChange={(e) => { setAmountInput(e.target.value); setAmountError(""); }}
              />
              {amountError && (
                <p className="text-xs text-red-500 font-medium mt-1.5 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                  ⚠️ {amountError}
                </p>
              )}
            </div>

            {uploaded ? (
              <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-2xl px-4 py-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <p className="text-sm font-bold text-green-700">{t(lang, "w_slip_sent")}</p>
              </div>
            ) : (
              <>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-2xl p-5 flex flex-col items-center gap-2 cursor-pointer hover:border-brand-blue/40 hover:bg-brand-blue/5 transition-colors"
                >
                  {preview ? (
                    <div className="relative">
                      <img src={preview} alt="slip" className="max-h-40 rounded-xl object-contain" />
                      <button type="button"
                        onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-gray-300" />
                      <p className="text-xs text-gray-400 text-center font-medium">{t(lang, "w_slip_tap")}</p>
                    </>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                {fileError && <p className="text-xs text-red-500 font-medium">{fileError}</p>}
                <button onClick={handleUpload} disabled={!file || uploading}
                  className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2">
                  {uploading
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Upload className="w-4 h-4" />}
                  {uploading ? t(lang, "w_uploading") : t(lang, "w_send_slip")}
                </button>
              </>
            )}
          </div>

          {/* My Slip History */}
          {mySlips.length > 0 && (
            <div className="card space-y-3">
              <p className="font-black text-brand-navy text-sm flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-brand-blue" />
                ประวัติการส่งสลิป
              </p>
              {mySlips.map((slip: any) => {
                const s = statusBadge[slip.status as SlipStatus] || statusBadge.pending;
                return (
                  <div key={slip.id} className="bg-gray-50 rounded-2xl p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{new Date(slip.created_at).toLocaleDateString("th-TH")}</span>
                      <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border ${s.color}`}>
                        {s.icon}{s.label}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-brand-navy">ยอดชำระ: ฿{Number(slip.amount_paid).toFixed(2)}</p>
                    {slip.amount_verified != null && (
                      <p className="text-xs font-bold text-green-700">ยอดที่ยืนยัน: ฿{Number(slip.amount_verified).toFixed(2)}</p>
                    )}
                    {slip.verified_note && (
                      <p className="text-xs text-gray-500">หมายเหตุ: {slip.verified_note}</p>
                    )}
                    {slip.rejected_note && (
                      <p className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-lg border border-red-100">❌ {slip.rejected_note}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Completed Orders */}
      <div>
        <h2 className="font-black text-brand-navy mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-brand-blue" />
          {t(lang, "w_completed_orders")}
        </h2>
        {orders.length > 0 ? (
          <div className="space-y-2.5">
            {orders.map((o: any) => (
              <div key={o.id} className="card flex items-center justify-between">
                <div>
                  <p className="font-black text-brand-navy text-sm">
                    {o.trips?.origin_zone} → {o.trips?.destination_zone}
                  </p>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">
                    {new Date(o.created_at).toLocaleDateString("th-TH")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-black text-brand-navy">฿{Number(o.final_price).toFixed(2)}</p>
                  <p className="text-xs text-brand-blue font-bold">
                    {t(lang, "w_fee_per")} ฿{(Number(o.final_price) * 0.05).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <div className="text-4xl mb-3">💰</div>
            <p className="text-sm text-gray-400 font-medium">{t(lang, "w_no_orders")}</p>
            <p className="text-xs text-gray-300 mt-1">{t(lang, "w_no_orders_hint")}</p>
          </div>
        )}
      </div>
    </div>
  );
}