"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, Truck, ShoppingCart, Upload, XCircle, AlertCircle, ImageIcon, X } from "lucide-react";
import type { OrderStatus } from "@/lib/types";

interface Props {
  orderId: string;
  tripId: string;
  currentStatus: OrderStatus;
  isBuyer: boolean;
  isShopper: boolean;
  finalPrice?: number;
  paymentConfirmed: boolean;
  shopperAccepted?: boolean;
}

const MAX_FILE_SIZE = 500 * 1024; // 500KB

export default function OrderStatusActions({
  orderId, tripId, currentStatus, isBuyer, isShopper, finalPrice, paymentConfirmed, shopperAccepted,
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
    if (file.size > MAX_FILE_SIZE) {
      setSlipError("ไฟล์ใหญ่เกิน 500KB กรุณาบีบอัดรูปก่อน");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setSlipError("รองรับเฉพาะไฟล์รูปภาพเท่านั้น");
      return;
    }
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

    const { error: uploadError } = await supabase.storage
      .from("payment-slips")
      .upload(path, slipFile, { upsert: true });

    if (uploadError) {
      alert("อัปโหลดไม่สำเร็จ: " + uploadError.message);
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
                <CheckCircle className="w-4 h-4" />รับออเดอร์นี้
              </button>
              <button onClick={() => setShowDeclineConfirm(true)} disabled={loading}
                className="flex items-center justify-center gap-2 text-sm py-2.5 px-4 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                <XCircle className="w-4 h-4" />ปฏิเสธ
              </button>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">ยืนยันการปฏิเสธออเดอร์นี้? ออเดอร์จะถูกยกเลิกและผู้ซื้อจะได้รับแจ้ง</p>
              </div>
              <div className="flex gap-2">
                <button onClick={declineOrder} disabled={loading}
                  className="flex-1 text-sm py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors">
                  ยืนยันปฏิเสธ
                </button>
                <button onClick={() => setShowDeclineConfirm(false)}
                  className="flex-1 text-sm py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                  ยกเลิก
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
          <ShoppingCart className="w-4 h-4" />เริ่มซื้อของแล้ว
        </button>
      )}

      {/* Shopper: shopping — mark as bought + set final price */}
      {isShopper && currentStatus === "shopping" && (
        <>
          {!showPriceForm ? (
            <button onClick={() => setShowPriceForm(true)}
              className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
              <ShoppingCart className="w-4 h-4" />ซื้อสินค้าเสร็จแล้ว — ระบุราคาสุทธิ
            </button>
          ) : (
            <div className="card space-y-3 border-brand-yellow/40">
              <p className="text-sm font-semibold text-brand-navy">ระบุราคาสุทธิจริง</p>
              <input type="number" className="input-field" placeholder="ราคา (บาท)" value={price}
                onChange={(e) => setPrice(e.target.value)} />
              <input type="text" className="input-field" placeholder="เหตุผลปรับราคา (ถ้ามี)" value={reason}
                onChange={(e) => setReason(e.target.value)} />
              <div className="flex gap-2">
                <button onClick={submitFinalPrice} disabled={loading || !price}
                  className="btn-primary flex-1 text-sm py-2">ยืนยัน</button>
                <button onClick={() => setShowPriceForm(false)}
                  className="flex-1 text-sm py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">ยกเลิก</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Shopper: delivering */}
      {isShopper && currentStatus === "bought" && (
        <button onClick={() => updateOrder({ status: "delivering" })} disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
          <Truck className="w-4 h-4" />กำลังไปส่ง
        </button>
      )}

      {/* Buyer: upload payment slip after bought */}
      {isBuyer && currentStatus === "bought" && !paymentConfirmed && (
        <>
          {!showSlipForm ? (
            <button onClick={() => setShowSlipForm(true)}
              className="btn-secondary w-full flex items-center justify-center gap-2 text-sm">
              <Upload className="w-4 h-4" />แนบสลิปการโอนเงิน
            </button>
          ) : (
            <div className="card space-y-3 border-brand-blue/30">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-brand-navy">แนบสลิปการโอนเงิน</p>
                <button onClick={() => { setShowSlipForm(false); setSlipFile(null); setSlipPreview(null); setSlipError(""); }}>
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Upload area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-brand-blue/40 hover:bg-brand-blue/5 transition-colors"
              >
                {slipPreview ? (
                  <img src={slipPreview} alt="slip preview" className="max-h-48 rounded-lg object-contain" />
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8 text-gray-300" />
                    <p className="text-xs text-gray-400 text-center">แตะเพื่อเลือกรูปสลิป<br />ขนาดไม่เกิน 500KB</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleSlipSelect}
              />

              {slipError && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />{slipError}
                </p>
              )}

              {slipFile && (
                <p className="text-xs text-gray-400">
                  {slipFile.name} · {(slipFile.size / 1024).toFixed(0)}KB
                </p>
              )}

              <button
                onClick={submitSlip}
                disabled={loading || !slipFile}
                className="btn-primary w-full text-sm py-2.5 flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {loading ? "กำลังอัปโหลด..." : "ยืนยันการโอนเงิน"}
              </button>
            </div>
          )}
        </>
      )}

      {/* Shopper: complete */}
      {isShopper && currentStatus === "delivering" && (
        <button onClick={() => updateOrder({ status: "completed" })} disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
          <CheckCircle className="w-4 h-4" />ส่งสำเร็จ
        </button>
      )}
    </div>
  );
}
