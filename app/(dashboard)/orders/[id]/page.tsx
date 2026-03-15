import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle, Package, CreditCard, Banknote, Info } from "lucide-react";
import OrderStatusActions from "./OrderStatusActions";
import OrderChat from "@/components/OrderChat";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: "รอรับออเดอร์",  color: "text-yellow-700",  bg: "bg-yellow-50 border-yellow-200" },
  accepted:   { label: "รับแล้ว",       color: "text-blue-700",    bg: "bg-blue-50 border-blue-200" },
  shopping:   { label: "กำลังซื้อของ",  color: "text-orange-700",  bg: "bg-orange-50 border-orange-200" },
  bought:     { label: "ซื้อแล้ว",      color: "text-cyan-700",    bg: "bg-cyan-50 border-cyan-200" },
  delivering: { label: "กำลังส่ง",      color: "text-purple-700",  bg: "bg-purple-50 border-purple-200" },
  completed:  { label: "สำเร็จ",        color: "text-green-700",   bg: "bg-green-50 border-green-200" },
  cancelled:  { label: "ยกเลิก",        color: "text-red-600",     bg: "bg-red-50 border-red-200" },
};

const statusSteps = ["pending", "accepted", "shopping", "bought", "delivering", "completed"];

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: order } = await supabase
    .from("orders")
    .select("*, trips(*, profiles(username)), profiles(username)")
    .eq("id", id)
    .single();

  if (!order) notFound();

  const isBuyer = order.buyer_id === user?.id;
  const isShopper = order.trips?.shopper_id === user?.id;
  const s = statusConfig[order.status] || { label: order.status, color: "text-gray-600", bg: "bg-gray-50 border-gray-200" };
  const currentStepIndex = statusSteps.indexOf(order.status);
  const showPaymentInfo = ["bought", "delivering", "completed"].includes(order.status);

  return (
    <div className="max-w-lg mx-auto pb-10 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/orders" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <h1 className="text-xl font-bold text-brand-navy">รายละเอียดออเดอร์</h1>
      </div>

      {/* Status Banner */}
      <div className={`border rounded-2xl px-4 py-3 flex items-center justify-between ${s.bg}`}>
        <span className={`text-sm font-semibold ${s.color}`}>{s.label}</span>
        <span className="text-xs text-gray-400">
          {new Date(order.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "long" })}
        </span>
      </div>

      {/* Progress Steps */}
      {order.status !== "cancelled" && (
        <div className="card py-5 px-4">
          {/* Progress bar */}
          <div className="relative mb-5">
            <div className="absolute top-3.5 left-0 right-0 h-1.5 bg-gray-100 rounded-full" />
            <div
              className="absolute top-3.5 left-0 h-1.5 bg-gradient-to-r from-brand-blue to-brand-cyan rounded-full transition-all duration-700 ease-in-out"
              style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
            />
            {/* Animated shimmer on active segment */}
            {currentStepIndex < statusSteps.length - 1 && (
              <div
                className="absolute top-3.5 h-1.5 rounded-full overflow-hidden"
                style={{
                  left: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%`,
                  width: `${(1 / (statusSteps.length - 1)) * 100}%`,
                }}
              >
                <div className="h-full w-full bg-gradient-to-r from-brand-cyan/40 to-brand-blue/40 animate-pulse" />
              </div>
            )}
            {/* Step dots */}
            <div className="relative flex justify-between">
              {statusSteps.map((step, i) => {
                const done = i <= currentStepIndex;
                const active = i === currentStepIndex;
                return (
                  <div key={step} className="flex flex-col items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold z-10 transition-all duration-500 ${
                      done
                        ? active
                          ? "bg-brand-blue text-white ring-4 ring-brand-blue/20 scale-110"
                          : "bg-brand-blue text-white"
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
                  </div>
                );
              })}
            </div>
          </div>
          {/* Labels */}
          <div className="flex justify-between">
            {statusSteps.map((step, i) => {
              const cfg = statusConfig[step];
              const done = i <= currentStepIndex;
              const active = i === currentStepIndex;
              return (
                <div key={step} className="flex-1 flex flex-col items-center">
                  <span className={`text-center leading-tight text-[9px] font-medium transition-colors duration-300 ${
                    active ? "text-brand-blue" : done ? "text-brand-navy" : "text-gray-400"
                  }`} style={{ maxWidth: 48 }}>
                    {cfg.label}
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
          <span className="text-gray-500">ทริป:</span>
          <span className="font-semibold text-brand-navy">{order.trips?.origin_zone}</span>
          <ArrowRight className="w-3 h-3 text-gray-400" />
          <span className="font-semibold text-brand-navy">{order.trips?.destination_zone}</span>
        </div>
        <p className="text-sm text-gray-500">
          ผู้รับหิ้ว: <span className="font-medium text-brand-navy">{order.trips?.profiles?.username}</span>
        </p>
        {isShopper && (
          <p className="text-sm text-gray-500">
            ผู้สั่ง: <span className="font-medium text-brand-navy">{order.profiles?.username}</span>
          </p>
        )}
        {order.trips?.fee_per_item > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-brand-blue bg-brand-blue/5 px-3 py-1.5 rounded-lg">
            <Banknote className="w-3.5 h-3.5" />
            ค่าหิ้วชิ้นละ ฿{order.trips.fee_per_item}
          </div>
        )}
      </div>

      {/* Items */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-brand-navy flex items-center gap-2 text-sm">
          <Package className="w-4 h-4 text-brand-blue" />รายการสินค้า
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
              <p className="text-xs text-brand-blue bg-brand-blue/5 px-2 py-1 rounded-lg">🔄 สำรอง: {item.fallback_option}</p>
            )}
          </div>
        ))}
      </div>

      {/* Payment Section */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-brand-navy flex items-center gap-2 text-sm">
          <CreditCard className="w-4 h-4 text-brand-blue" />การชำระเงิน
        </h2>

        <div className="flex justify-between text-sm py-1">
          <span className="text-gray-500">ราคาประมาณการ</span>
          <span className="text-gray-700">฿{order.estimated_price || "-"}</span>
        </div>

        {order.final_price ? (
          <div className="flex justify-between text-sm font-semibold border-t border-gray-100 pt-3">
            <span className="text-brand-navy">ราคาสุทธิจริง</span>
            <span className="text-brand-blue text-base">฿{order.final_price}</span>
          </div>
        ) : null}

        {order.adjustment_reason && (
          <p className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
            เหตุผลปรับราคา: {order.adjustment_reason}
          </p>
        )}

        {/* Payment info — shows only after "bought" */}
        {showPaymentInfo && order.trips?.payment_info ? (
          <div className="bg-brand-yellow/10 border border-brand-yellow/30 rounded-xl p-3 space-y-1">
            <p className="text-xs font-semibold text-brand-navy flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-brand-blue" />ข้อมูลการชำระเงิน
            </p>
            <p className="text-sm text-gray-700 whitespace-pre-line">{order.trips.payment_info}</p>
          </div>
        ) : !showPaymentInfo ? (
          <div className="flex items-start gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5">
            <Info className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-400">ข้อมูลการชำระเงินจะแสดงหลังจากผู้รับหิ้วกดสถานะ "ซื้อสินค้าเสร็จแล้ว"</p>
          </div>
        ) : null}

        {order.payment_confirmed && (
          <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 px-3 py-2 rounded-xl border border-green-100">
            <CheckCircle className="w-4 h-4" />ยืนยันการชำระเงินแล้ว
          </div>
        )}

        {/* Payment slip */}
        {order.payment_slip_url && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-brand-navy">สลิปการโอนเงิน</p>
            <a href={order.payment_slip_url} target="_blank" rel="noopener noreferrer">
              <img
                src={order.payment_slip_url}
                alt="สลิปการโอนเงิน"
                className="w-full max-h-64 object-contain rounded-xl border border-gray-100 hover:opacity-90 transition-opacity"
              />
            </a>
          </div>
        )}
      </div>

      {/* Chat */}
      {order.status !== "cancelled" && (isBuyer || isShopper) && (
        <OrderChat
          orderId={order.id}
          currentUserId={user!.id}
          currentUsername={user?.user_metadata?.username || ""}
        />
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
        shopperAccepted={order.shopper_accepted}
      />
    </div>
  );
}
