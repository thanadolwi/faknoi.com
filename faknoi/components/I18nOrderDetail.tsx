"use client";

import { useState, useEffect } from "react";
import { useLang } from "@/lib/LangContext";
import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle, Package, CreditCard, Banknote, Info } from "lucide-react";
import OrderStatusActions from "@/app/(dashboard)/orders/[id]/OrderStatusActions";
import OrderChat from "@/components/OrderChat";

const statusSteps = ["pending", "accepted", "shopping", "bought", "delivering", "completed"];

const statusColorMap: Record<string, { color: string; bg: string; labelKey: string }> = {
  pending:    { labelKey: "status_pending",   color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200" },
  accepted:   { labelKey: "status_accepted",  color: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
  shopping:   { labelKey: "status_shopping",  color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
  bought:     { labelKey: "status_bought",    color: "text-cyan-700",   bg: "bg-cyan-50 border-cyan-200" },
  delivering: { labelKey: "status_delivering",color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  completed:  { labelKey: "status_completed", color: "text-green-700",  bg: "bg-green-50 border-green-200" },
  cancelled:  { labelKey: "status_cancelled", color: "text-red-600",    bg: "bg-red-50 border-red-200" },
};

export default function I18nOrderDetail({
  order: initialOrder, userId, username, isBuyer, isShopper,
}: {
  order: any;
  userId: string;
  username: string;
  isBuyer: boolean;
  isShopper: boolean;
}) {
  const { lang } = useLang();
  const [order, setOrder] = useState(initialOrder);

  // Realtime: subscribe to order updates
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`order-detail-${initialOrder.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${initialOrder.id}` },
        (payload) => {
          console.log("[realtime] order update:", payload.new);
          setOrder((prev: any) => ({ ...prev, ...payload.new }));
        }
      )
      .subscribe((status) => {
        console.log("[realtime] channel status:", status);
      });
    return () => { supabase.removeChannel(channel); };
  }, [initialOrder.id]);
  const s = statusColorMap[order.status] || { labelKey: order.status, color: "text-gray-600", bg: "bg-gray-50 border-gray-200" };
  const currentStepIndex = statusSteps.indexOf(order.status);
  const showPaymentInfo = ["bought", "delivering", "completed"].includes(order.status);

  return (
    <div className="max-w-lg mx-auto pb-10 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/orders" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <h1 className="text-xl font-bold text-brand-navy">{t(lang, "od_title")}</h1>
        {order.display_id && (
          <span className="ml-auto text-xs font-black text-brand-cyan bg-brand-cyan/10 px-2.5 py-1 rounded-xl">
            {order.display_id}
          </span>
        )}
      </div>

      {/* Status Banner */}
      <div className={`border rounded-2xl px-4 py-3 flex items-center justify-between ${s.bg}`}>
        <span className={`text-sm font-semibold ${s.color}`}>{t(lang, s.labelKey)}</span>
        <span className="text-xs text-gray-400">
          {new Date(order.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "long" })}
        </span>
      </div>

      {/* Progress Steps */}
      {order.status !== "cancelled" && (
        <div className="card py-5 px-4 overflow-hidden">
          <div className="relative flex items-start justify-between">
            {/* connecting line */}
            <div className="absolute top-3.5 left-0 right-0 h-1.5 bg-gray-100 rounded-full mx-3.5" />
            {/* filled line */}
            <div
              className="absolute top-3.5 left-3.5 h-1.5 bg-gradient-to-r from-brand-blue to-brand-cyan rounded-full transition-all duration-700 ease-in-out"
              style={{
                width: currentStepIndex === 0
                  ? "0%"
                  : `calc(${(currentStepIndex / (statusSteps.length - 1)) * 100}% - 7px)`,
              }}
            />
            {/* animated pulse on next segment */}
            {currentStepIndex < statusSteps.length - 1 && (
              <div
                className="absolute top-3.5 h-1.5 rounded-full overflow-hidden"
                style={{
                  left: `calc(${(currentStepIndex / (statusSteps.length - 1)) * 100}% + 3.5px)`,
                  width: `calc(${(1 / (statusSteps.length - 1)) * 100}% - 7px)`,
                }}
              >
                <div className="h-full w-full bg-gradient-to-r from-brand-cyan/50 to-transparent animate-pulse" />
              </div>
            )}

            {statusSteps.map((step, i) => {
              const done = i <= currentStepIndex;
              const active = i === currentStepIndex;
              const cfg = statusColorMap[step];
              return (
                <div key={step} className="relative flex flex-col items-center gap-1.5 z-10" style={{ flex: 1 }}>
                  {/* dot */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                    active
                      ? "bg-brand-blue text-white ring-4 ring-brand-blue/20 scale-110 shadow-md"
                      : done
                      ? "bg-brand-blue text-white"
                      : "bg-white border-2 border-gray-200 text-gray-400"
                  }`}>
                    {done && !active ? (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span>{i + 1}</span>
                    )}
                  </div>
                  {/* label */}
                  <span className={`text-center leading-tight text-[9px] font-semibold transition-colors duration-300 px-0.5 ${
                    active ? "text-brand-blue" : done ? "text-brand-navy" : "text-gray-400"
                  }`} style={{ maxWidth: 44, wordBreak: "keep-all" }}>
                    {t(lang, cfg.labelKey)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Trip Info */}
      <div className="card space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">{t(lang, "od_trip")}:</span>
          <span className="font-semibold text-brand-navy">{order.trips?.origin_zone}</span>
          <ArrowRight className="w-3 h-3 text-gray-400" />
          <span className="font-semibold text-brand-navy">{order.trips?.destination_zone}</span>
        </div>
        <p className="text-sm text-gray-500">
          {t(lang, "od_shopper")}: <span className="font-medium text-brand-navy">{order.trips?.profiles?.username}</span>
        </p>
        {isShopper && (
          <p className="text-sm text-gray-500">
            {t(lang, "od_buyer")}: <span className="font-medium text-brand-navy">{order.profiles?.username}</span>
          </p>
        )}
        {order.trips?.fee_per_item > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-brand-blue bg-brand-blue/5 px-3 py-1.5 rounded-lg">
            <Banknote className="w-3.5 h-3.5" />
            {t(lang, "od_fee")} ฿{order.trips.fee_per_item}
          </div>
        )}
      </div>

      {/* Items */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-brand-navy flex items-center gap-2 text-sm">
          <Package className="w-4 h-4 text-brand-blue" />{t(lang, "od_items")}
        </h2>
        {Array.isArray(order.items) && order.items.map((item: any, i: number) => (
          <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-1">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-brand-navy">{item.item_name}
                  <span className="text-gray-400 font-normal"> ×{item.quantity}</span>
                </p>
                <p className="text-xs text-gray-400">🏪 {item.shop_name}</p>
              </div>
            </div>
            {item.note && <p className="text-xs text-gray-500 bg-white px-2 py-1 rounded-lg">📝 {item.note}</p>}
            {item.fallback_option && (
              <p className="text-xs text-brand-blue bg-brand-blue/5 px-2 py-1 rounded-lg">🔄 {item.fallback_option}</p>
            )}
          </div>
        ))}
      </div>

      {/* Payment Section */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-brand-navy flex items-center gap-2 text-sm">
          <CreditCard className="w-4 h-4 text-brand-blue" />{t(lang, "od_payment")}
        </h2>
        <div className="flex justify-between text-sm py-1">
          <span className="text-gray-500">{t(lang, "od_est_price")}</span>
          <span className="text-gray-700">฿{order.estimated_price || "-"}</span>
        </div>
        {order.final_price ? (
          <div className="flex justify-between text-sm font-semibold border-t border-gray-100 pt-3">
            <span className="text-brand-navy">{t(lang, "od_final_price")}</span>
            <span className="text-brand-blue text-base">฿{order.final_price}</span>
          </div>
        ) : null}
        {order.adjustment_reason && (
          <p className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
            {t(lang, "od_adj_reason")}: {order.adjustment_reason}
          </p>
        )}
        {showPaymentInfo && order.trips?.payment_info ? (
          <div className="bg-brand-yellow/10 border border-brand-yellow/30 rounded-xl p-3 space-y-1">
            <p className="text-xs font-semibold text-brand-navy flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-brand-blue" />{t(lang, "od_payment_info")}
            </p>
            <p className="text-sm text-gray-700 whitespace-pre-line">{order.trips.payment_info}</p>
          </div>
        ) : !showPaymentInfo ? (
          <div className="flex items-start gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5">
            <Info className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-400">{t(lang, "od_payment_pending")}</p>
          </div>
        ) : null}
        {order.payment_confirmed && (
          <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 px-3 py-2 rounded-xl border border-green-100">
            <CheckCircle className="w-4 h-4" />{t(lang, "od_payment_confirmed")}
          </div>
        )}
        {order.payment_slip_url && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-brand-navy">{t(lang, "od_slip")}</p>
            <a href={order.payment_slip_url} target="_blank" rel="noopener noreferrer">
              <img src={order.payment_slip_url} alt="slip"
                className="w-full max-h-64 object-contain rounded-xl border border-gray-100 hover:opacity-90 transition-opacity" />
            </a>
          </div>
        )}
      </div>

      {/* Chat */}
      {order.status !== "cancelled" && (isBuyer || isShopper) && (
        <OrderChat orderId={order.id} currentUserId={userId} currentUsername={username} isShopper={isShopper} />
      )}

      {/* Actions */}
      <OrderStatusActions
        orderId={order.id}
        tripId={order.trip_id}
        currentStatus={order.status}
        isBuyer={isBuyer}
        isShopper={isShopper}
        finalPrice={order.final_price}
        paymentConfirmed={order.payment_confirmed}
      />
    </div>
  );
}
