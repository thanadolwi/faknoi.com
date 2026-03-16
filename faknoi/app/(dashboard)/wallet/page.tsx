"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { TrendingUp, AlertCircle, Upload, ImageIcon, X, CheckCircle } from "lucide-react";
import { useLang } from "@/lib/LangContext";
import { t } from "@/lib/i18n";

const MAX_SIZE = 500 * 1024;

export default function WalletPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { lang } = useLang();

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { data: myTrips } = await supabase.from("trips").select("id").eq("shopper_id", user?.id);
      const tripIds = (myTrips || []).map((t: any) => t.id);
      if (!tripIds.length) { setLoading(false); return; }
      const { data } = await supabase
        .from("orders")
        .select("id, final_price, created_at, trips(origin_zone, destination_zone)")
        .in("trip_id", tripIds)
        .eq("status", "completed")
        .not("final_price", "is", null)
        .order("created_at", { ascending: false });
      setOrders(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const totalActual = orders.reduce((s, o) => s + Number(o.final_price), 0);
  const totalFee    = Math.round(totalActual * 0.05 * 100) / 100;
  const hasFee      = totalFee > 0;

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setFileError("");
    if (!f) return;
    if (f.size > MAX_SIZE) { setFileError(t(lang, "w_file_too_big")); return; }
    if (!f.type.startsWith("image/")) { setFileError(t(lang, "w_file_type")); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const ext = file.name.split(".").pop();
    const path = `${user!.id}/fee-slip-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("payment-slips").upload(path, file, { upsert: true });
    if (error) { setFileError(t(lang, "w_upload_fail")); setUploading(false); return; }
    setUploaded(true);
    setUploading(false);
  }

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

      <div className="grid grid-cols-2 gap-3">
        <div className="card text-center py-5">
          <p className="text-xs text-gray-400 font-medium mb-1">{t(lang, "w_total")}</p>
          <p className="text-2xl font-black text-brand-navy">฿{totalActual.toFixed(2)}</p>
          <p className="text-xs text-gray-300 mt-1">{orders.length} {t(lang, "w_orders_count")}</p>
        </div>
        <div className="card text-center py-5" style={{background:"linear-gradient(135deg,#5478FF,#53CBF3)"}}>
          <p className="text-xs text-white/70 font-medium mb-1">{t(lang, "w_fee_label")}</p>
          <p className="text-2xl font-black text-white">฿{totalFee.toFixed(2)}</p>
        </div>
      </div>

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
        </>
      )}

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
