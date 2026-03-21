"use client";

import { useLang } from "@/lib/LangContext";
import { t } from "@/lib/i18n";
import Link from "next/link";
import { ArrowLeft, MapPin, Clock, Users, ArrowRight, Plus } from "lucide-react";
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

export default function I18nTripDetail({
  trip, orders, isShopper, userId,
}: {
  trip: any;
  orders: any[];
  isShopper: boolean;
  userId: string;
}) {
  const { lang } = useLang();
  const sc = statusColorMap[trip.status] || { colorClass: "bg-gray-100 text-gray-600", labelKey: trip.status };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/trips" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <h1 className="text-xl font-bold text-brand-navy">{t(lang, "td_title")}</h1>
      </div>

      <div className="card space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-brand-navy text-lg">{trip.origin_zone}</span>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <span className="font-bold text-brand-navy text-lg">{trip.destination_zone}</span>
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${sc.colorClass}`}>
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

        {isShopper && (
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

        {!isShopper && trip.status === "open" && trip.current_orders < trip.max_orders && (
          <Link href={`/orders/create?trip_id=${trip.id}`} className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            {t(lang, "td_place_order")}
          </Link>
        )}
      </div>

      {isShopper && orders && orders.length > 0 && (
        <div>
          <h2 className="font-bold text-brand-navy mb-3">
            {t(lang, "td_orders_in_trip")} ({orders.length})
          </h2>
          <div className="space-y-3">
            {orders.map((order: any) => (
              <Link key={order.id} href={`/orders/${order.id}`}
                className="card flex items-center justify-between hover:border-brand-blue/30 transition-colors group">
                <div>
                  <p className="text-sm font-semibold text-brand-navy">{order.profiles?.username}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {Array.isArray(order.items) ? order.items.length : 0} {t(lang, "td_items_count")}
                    {order.final_price ? ` · ฿${order.final_price}` : order.estimated_price ? ` · ~฿${order.estimated_price}` : ""}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-brand-blue transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
