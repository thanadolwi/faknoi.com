"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/LangContext";
import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft, MapPin, Clock, Users, ArrowRight, Plus, ShieldCheck } from "lucide-react";
import TripStatusActions from "@/app/(dashboard)/trips/[id]/TripStatusActions";
import CountdownTimer from "@/components/CountdownTimer";
import EditTripForm from "@/components/EditTripForm";

const statusColorMap: Record<string, { colorClass: string; labelKey: string }> = {
  open:       { colorClass: "bg-green-100 text-green-700",   labelKey: "td_status_open" },
  shopping:   { colorClass: "bg-blue-100 text-blue-700",     labelKey: "td_status_shopping" },
  delivering: { colorClass: "bg-purple-100 text-purple-700", labelKey: "td_status_delivering" },
  completed:  { colorClass: "bg-gray-100 text-gray-600",     labelKey: "td_status_completed" },
  cancelled:  { colorClass: "bg-red-100 text-red-600",       labelKey: "td_status_cancelled" },
};

const TRIP_STATUSES = ["open", "shopping", "delivering", "completed", "cancelled"];
const ORDER_STATUSES = ["pending", "accepted", "shopping", "bought", "delivering", "completed", "cancelled"];

const ORDER_STATUS_LABEL: Record<string, string> = {
  pending:    "รอยืนยัน",
  accepted:   "ยืนยันแล้ว",
  shopping:   "กำลังซื้อ",
  bought:     "ซื้อแล้ว",
  delivering: "กำลังส่ง",
  completed:  "เสร็จสิ้น",
  cancelled:  "ยกเลิก",
};
const ORDER_STATUS_COLOR: Record<string, string> = {
  pending:    "bg-yellow-100 text-yellow-700",
  accepted:   "bg-blue-100 text-blue-700",
  shopping:   "bg-purple-100 text-purple-700",
  bought:     "bg-cyan-100 text-cyan-700",
  delivering: "bg-orange-100 text-orange-700",
  completed:  "bg-green-100 text-green-700",
  cancelled:  "bg-red-100 text-red-600",
};

function AdminStatusSelect({ type, id, current, onDone }: { type: "trip" | "order"; id: string; current: string; onDone: () => void }) {
  const [val, setVal] = useState(current);
  const [loading, setLoading] = useState(false);
  const options = type === "trip" ? TRIP_STATUSES : ORDER_STATUSES;

  async function save() {
    if (val === current) return;
    setLoading(true);
    await fetch("/api/admin/trips", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id, status: val }),
    });
    setLoading(false);
    onDone();
  }

  return (
    <div className="flex items-center gap-2">
      <select value={val} onChange={(e) => setVal(e.target.value)}
        className="text-xs border border-brand-blue/30 rounded-lg px-2 py-1 bg-white text-brand-navy font-bold">
        {options.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <button onClick={save} disabled={loading || val === current}
        className="text-xs px-3 py-1 rounded-lg bg-brand-blue text-white font-bold disabled:opacity-40">
        {loading ? "..." : "บันทึก"}
      </button>
    </div>
  );
}

export default function I18nTripDetail({
  trip: initialTrip, orders: initialOrders, isShopper, userId, isAdmin = false,
}: {
  trip: any;
  orders: any[];
  isShopper: boolean;
  userId: string;
  isAdmin?: boolean;
}) {
  const { lang } = useLang();
  const router = useRouter();
  const [trip, setTrip] = useState(initialTrip);
  const [orders, setOrders] = useState(initialOrders);

  // Realtime: subscribe to trip + orders updates
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`trip-detail-${initialTrip.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "trips", filter: `id=eq.${initialTrip.id}` },
        (payload) => {
          setTrip((prev: any) => ({ ...prev, ...payload.new }));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `trip_id=eq.${initialTrip.id}` },
        (payload) => {
          setOrders((prev: any[]) =>
            prev.map((o) => (o.id === payload.new.id ? { ...o, ...payload.new } : o))
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders", filter: `trip_id=eq.${initialTrip.id}` },
        async (payload) => {
          const { data } = await supabase
            .from("orders")
            .select("*, profiles(username)")
            .eq("id", payload.new.id)
            .single();
          if (data) setOrders((prev: any[]) => [...prev, data]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [initialTrip.id]);

  const sc = statusColorMap[trip.status] || { colorClass: "bg-gray-100 text-gray-600", labelKey: trip.status };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href={isAdmin ? "/admin/trips" : "/trips"} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <h1 className="text-xl font-bold text-brand-navy">{t(lang, "td_title")}</h1>
        {isAdmin && (
          <span className="ml-auto flex items-center gap-1 text-xs font-bold text-brand-blue bg-brand-blue/10 px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" /> Admin
          </span>
        )}
      </div>

      <div className="card space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-brand-navy text-lg">{trip.origin_zone}</span>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <span className="font-bold text-brand-navy text-lg">{trip.destination_zone}</span>
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${sc.colorClass}`}>
            {t(lang, sc.labelKey)}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <Clock className="w-4 h-4 text-brand-blue mx-auto mb-1" />
            <p className="text-xs text-gray-400">{t(lang, "td_cutoff")}</p>
            <p className="text-sm font-semibold text-brand-navy">
              {new Date(trip.cutoff_time).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <Users className="w-4 h-4 text-brand-cyan mx-auto mb-1" />
            <p className="text-xs text-gray-400">{t(lang, "td_orders")}</p>
            <p className="text-sm font-semibold text-brand-navy">{trip.current_orders}/{trip.max_orders}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <MapPin className="w-4 h-4 text-brand-yellow mx-auto mb-1" />
            <p className="text-xs text-gray-400">{t(lang, "td_shopper")}</p>
            <p className="text-sm font-semibold text-brand-navy truncate">{trip.profiles?.username}</p>
          </div>
        </div>

        {trip.note && (
          <div className="bg-brand-yellow/10 border border-brand-yellow/30 rounded-xl px-4 py-3 text-sm text-gray-600">
            📝 {trip.note}
          </div>
        )}

        {(trip.status === "open" || trip.status === "shopping") && (
          <CountdownTimer cutoffTime={trip.cutoff_time} />
        )}

        {/* Admin: เปลี่ยนสถานะทริป */}
        {isAdmin && (
          <div className="border border-brand-blue/20 bg-brand-blue/5 rounded-2xl px-4 py-3 space-y-2">
            <p className="text-xs font-black text-brand-blue flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Admin — เปลี่ยนสถานะทริป
            </p>
            <AdminStatusSelect type="trip" id={trip.id} current={trip.status} onDone={() => router.refresh()} />
          </div>
        )}

        {/* Shopper controls */}
        {isShopper && !isAdmin && (
          <div className="space-y-3">
            {trip.status === "open" && (
              <EditTripForm
                tripId={trip.id}
                cutoffTime={trip.cutoff_time}
                maxOrders={trip.max_orders}
                currentOrders={trip.current_orders}
                note={trip.note}
                estimatedDeliveryTime={trip.estimated_delivery_time}
              />
            )}
            <TripStatusActions tripId={trip.id} currentStatus={trip.status} />
          </div>
        )}

        {!isShopper && !isAdmin && trip.status === "open" && trip.current_orders < trip.max_orders && (
          <Link href={`/orders/create?trip_id=${trip.id}`} className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            {t(lang, "td_place_order")}
          </Link>
        )}
      </div>

      {/* Orders list — admin เห็นทุกออเดอร์ + เปลี่ยนสถานะได้ */}
      {(isShopper || isAdmin) && orders && orders.length > 0 && (
        <div>
          <h2 className="font-bold text-brand-navy mb-3">
            {t(lang, "td_orders_in_trip")} ({orders.length})
          </h2>
          <div className="space-y-3">
            {orders.map((order: any) => {
              const oc = ORDER_STATUS_COLOR[order.status] ?? "bg-gray-100 text-gray-600";
              const ol = ORDER_STATUS_LABEL[order.status] ?? order.status;
              return (
                <div key={order.id} className="card space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-brand-navy">@{order.profiles?.username}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {Array.isArray(order.items) ? order.items.length : 0} {t(lang, "td_items_count")}
                        {order.final_price ? ` · ฿${order.final_price}` : order.estimated_price ? ` · ~฿${order.estimated_price}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`pill text-xs ${oc}`}>{ol}</span>
                      {!isAdmin && (
                        <Link href={`/orders/${order.id}`} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                        </Link>
                      )}
                    </div>
                  </div>
                  {/* Admin: เปลี่ยนสถานะออเดอร์ */}
                  {isAdmin && (
                    <div className="border-t border-gray-100 pt-2">
                      <p className="text-[10px] text-brand-blue font-bold mb-1.5">เปลี่ยนสถานะออเดอร์</p>
                      <AdminStatusSelect type="order" id={order.id} current={order.status} onDone={() => router.refresh()} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
