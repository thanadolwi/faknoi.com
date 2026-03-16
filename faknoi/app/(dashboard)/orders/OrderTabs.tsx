"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ClipboardList, ShoppingBag } from "lucide-react";
import { useLang } from "@/lib/LangContext";
import { t } from "@/lib/i18n";

interface Order {
  id: string;
  status: string;
  created_at: string;
  estimated_price?: number;
  final_price?: number;
  trips?: { origin_zone: string; destination_zone: string } | null;
  profiles?: { username: string } | null;
}

interface Props {
  myOrders: Order[];
  shopperOrders: Order[];
  statusLabel: Record<string, { label: string; color: string }>;
}

function OrderCard({ order, statusLabel, showBuyer }: { order: Order; statusLabel: Props["statusLabel"]; showBuyer?: boolean }) {
  const { lang } = useLang();
  const s = statusLabel[order.status] || { label: order.status, color: "bg-gray-100 text-gray-600" };
  const displayLabel = s.label.startsWith("status_") ? t(lang, s.label) : s.label;

  return (
    <Link href={`/orders/${order.id}`} className="card flex items-center justify-between hover:border-brand-blue/30 transition-colors group">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-brand-navy">
            {order.trips?.origin_zone} → {order.trips?.destination_zone}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>{new Date(order.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}</span>
          {showBuyer && order.profiles?.username && (
            <span>จาก {order.profiles.username}</span>
          )}
          {order.final_price
            ? <span className="font-medium text-brand-navy">฿{order.final_price}</span>
            : order.estimated_price
            ? <span>~฿{order.estimated_price}</span>
            : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.color}`}>{displayLabel}</span>
        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-brand-blue transition-colors" />
      </div>
    </Link>
  );
}

export default function OrderTabs({ myOrders, shopperOrders, statusLabel }: Props) {
  const [tab, setTab] = useState<"my" | "shopper">("my");
  const { lang } = useLang();

  return (
    <>
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        <button onClick={() => setTab("my")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "my" ? "bg-white text-brand-navy shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}>
          <ClipboardList className="w-4 h-4" />
          {t(lang, "orders_my")}
          {myOrders.length > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === "my" ? "bg-brand-blue text-white" : "bg-gray-300 text-gray-600"}`}>
              {myOrders.length}
            </span>
          )}
        </button>
        <button onClick={() => setTab("shopper")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "shopper" ? "bg-white text-brand-navy shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}>
          <ShoppingBag className="w-4 h-4" />
          {t(lang, "orders_shopper")}
          {shopperOrders.length > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === "shopper" ? "bg-brand-blue text-white" : "bg-gray-300 text-gray-600"}`}>
              {shopperOrders.length}
            </span>
          )}
        </button>
      </div>

      {tab === "my" && (
        <div className="space-y-3">
          {myOrders.length > 0
            ? myOrders.map((o) => <OrderCard key={o.id} order={o} statusLabel={statusLabel} />)
            : <div className="card text-center py-16 text-gray-400">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium mb-1">{t(lang, "orders_no_orders")}</p>
                <Link href="/trips" className="text-brand-blue text-sm hover:underline mt-1 inline-block">
                  {t(lang, "orders_find_trip")}
                </Link>
              </div>}
        </div>
      )}

      {tab === "shopper" && (
        <div className="space-y-3">
          {shopperOrders.length > 0
            ? shopperOrders.map((o) => <OrderCard key={o.id} order={o} statusLabel={statusLabel} showBuyer />)
            : <div className="card text-center py-16 text-gray-400">
                <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium mb-1">{t(lang, "orders_no_shopper")}</p>
                <Link href="/trips/create" className="text-brand-blue text-sm hover:underline mt-1 inline-block">
                  {t(lang, "trips_open_new")} →
                </Link>
              </div>}
        </div>
      )}
    </>
  );
}
