"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, Truck, ShoppingCart, Upload, XCircle, AlertCircle, ImageIcon, X } from "lucide-react";
import type { OrderStatus } from "@/lib/types";
import { useLang } from "@/lib/LangContext";
import { t } from "@/lib/i18n";

interface Props {
  orderId: string;
  tripId: string;
  currentStatus: OrderStatus;
  isBuyer: boolean;
  isShopper: boolean;
  finalPrice?: number;
  paymentConfirmed: boolean;
}

const MAX_FILE_SIZE = 500 * 1024;

export default function OrderStatusActions({
  orderId, tripId, currentStatus, isBuyer, isShopper, finalPrice, paymentConfirmed,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [price, setPrice] = useState(finalPrice?.toString() || "");
  const [reason, setReason] = useState("");
  const [showPriceForm, setShowPriceForm] = useState(false);
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);
  const [showSlipForm, setShowSlipForm] = useState(false);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [slipError, setSlipError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { lang } = useLang();

  async function updateOrder(updates: Record<string, unknown>) {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("orders").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", orderId);
    if (error) {
      alert("เกิดข้อผิดพลาด: " + error.message);
      setLoading(false);
      return;
    }
    router.refresh();
    setLoading(false);
  }

  async function acceptOrder() {
    await updateOrder({ status: "accepted", shopper_accepted: true });
  }

  async function declineOrder() {
    const supabase = createClient();
    setLoading(true);
    await supabase.from("orders").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", orderId);
    await supabase.rpc("decrement_trip_orders", { trip_id: tripId });
    router.refresh();
    setLoading(false);
  }

  async function submitFinalPrice() {
    if (!price) return;
    await updateOrder({ status: "bought", final_price: parseFloat(price), adjustment_reason: reason || null });
    setShowPriceForm(false);
  }

  function handleSlipSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setSlipError("");
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) { setSlipError(t(lang, "w_file_too_big")); return; }
    if (!file.type.startsWith("image/")) { setSlipError(t(lang, "w_file_type")); return; }
    setSlipFile(file);
    setSlipPreview(URL.createObjectURL(file));
  }

  async function submitSlip() {
    if (!slipFile) return;
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const ext = slipFile.name.split(".").pop();
    const path = `${user!.id}/${orderId}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("payment-slips").upload(path, slipFile, { upsert: true });
    if (uploadError) {
      alert(t(lang, "w_upload_fail") + ": " + uploadError.message);
      setLoading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("payment-slips").getPublicUrl(path);
    await updateOrder({ payment_confirmed: true, payment_slip_url: publicUrl });
    setShowSlipForm(false);
  }

  if (!isBuyer && !isShopper) return null;

  return (
    <div className="space-y-3">

      {/* Shopper: pending — accept or decline */}
      {isShopper && currentStatus === "pending" && (
        <div className="space-y-2">
          {!showDeclineConfirm ? (
            <div className="flex gap-2">
              <button onClick={acceptOrder} disabled={loading}
                className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm py-2.5">
                <CheckCircle className="w-4 h-4" />{t(lang, "osa_accept")}
              </button>
              <button onClick={() => setShowDeclineConfirm(true)} disabled={loading}
                className="flex items-center justify-center gap-2 text-sm py-2.5 px-4 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                <XCircle className="w-4 h-4" />{t(lang, "osa_decline")}
              </button>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{t(lang, "osa_decline_confirm")}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={declineOrder} disabled={loading}
                  className="flex-1 text-sm py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors">
                  {t(lang, "osa_decline_yes")}
                </button>
                <button onClick={() => setShowDeclineConfirm(false)}
                  className="flex-1 text-sm py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                  {t(lang, "osa_cancel")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Shopper: accepted — mark as shopping */}
      {isShopper && currentStatus === "accepted" && (
        <button onClick={() => updateOrder({ status: "shopping" })} disabled={loading}
          className="btn-secondary w-full flex items-center justify-center gap-2 text-sm">
          <ShoppingCart className="w-4 h-4" />{t(lang, "osa_start_shopping")}
        </button>
      )}

      {/* Shopper: shopping — mark as bought + set final price */}
      {isShopper && currentStatus === "shopping" && (
        <>
          {!showPriceForm ? (
            <button onClick={() => setShowPriceForm(true)}
              className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
              <ShoppingCart className="w-4 h-4" />{t(lang, "osa_done_shopping")}
            </button>
          ) : (
            <div className="card space-y-3 border-brand-yellow/40">
              <p className="text-sm font-semibold text-brand-navy">{t(lang, "osa_final_price_title")}</p>
              <input type="number" className="input-field" placeholder={t(lang, "osa_price_placeholder")} value={price}
                onChange={(e) => setPrice(e.target.value)} />
              <input type="text" className="input-field" placeholder={t(lang, "osa_reason_placeholder")} value={reason}
                onChange={(e) => setReason(e.target.value)} />
              <div className="flex gap-2">
                <button onClick={submitFinalPrice} disabled={loading || !price}
                  className="btn-primary flex-1 text-sm py-2">{t(lang, "osa_confirm")}</button>
                <button onClick={() => setShowPriceForm(false)}
                  className="flex-1 text-sm py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">{t(lang, "osa_cancel")}</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Shopper: delivering */}
      {isShopper && currentStatus === "bought" && (
        <button onClick={() => updateOrder({ status: "delivering" })} disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
          <Truck className="w-4 h-4" />{t(lang, "osa_delivering")}
        </button>
      )}

      {/* Buyer: upload payment slip after bought */}
      {isBuyer && currentStatus === "bought" && !paymentConfirmed && (
        <>
          {!showSlipForm ? (
            <button onClick={() => setShowSlipForm(true)}
              className="btn-secondary w-full flex items-center justify-center gap-2 text-sm">
              <Upload className="w-4 h-4" />{t(lang, "osa_attach_slip")}
            </button>
          ) : (
            <div className="card space-y-3 border-brand-blue/30">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-brand-navy">{t(lang, "osa_slip_title")}</p>
                <button onClick={() => { setShowSlipForm(false); setSlipFile(null); setSlipPreview(null); setSlipError(""); }}>
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-brand-blue/40 hover:bg-brand-blue/5 transition-colors"
              >
                {slipPreview ? (
                  <img src={slipPreview} alt="slip preview" className="max-h-48 rounded-lg object-contain" />
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8 text-gray-300" />
                    <p className="text-xs text-gray-400 text-center whitespace-pre-line">{t(lang, "osa_slip_hint")}</p>
                  </>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleSlipSelect} />
              {slipError && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />{slipError}
                </p>
              )}
              {slipFile && (
                <p className="text-xs text-gray-400">{slipFile.name} · {(slipFile.size / 1024).toFixed(0)}KB</p>
              )}
              <button onClick={submitSlip} disabled={loading || !slipFile}
                className="btn-primary w-full text-sm py-2.5 flex items-center justify-center gap-2">
                <Upload className="w-4 h-4" />
                {loading ? t(lang, "osa_uploading") : t(lang, "osa_confirm_payment")}
              </button>
            </div>
          )}
        </>
      )}

      {/* Shopper: complete */}
      {isShopper && currentStatus === "delivering" && (
        <button onClick={async () => {
          setLoading(true);
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          await supabase.from("orders").update({ status: "completed", updated_at: new Date().toISOString() }).eq("id", orderId);
          if (finalPrice && user) {
            await supabase.from("wallet_transactions").insert({
              shopper_id: user.id,
              order_id: orderId,
              actual_price: finalPrice,
            });
          }
          router.refresh();
          setLoading(false);
        }} disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
          <CheckCircle className="w-4 h-4" />
          {loading ? t(lang, "osa_updating") : t(lang, "osa_complete")}
        </button>
      )}
    </div>
  );
}
