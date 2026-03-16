"use client";

import { useState } from "react";
import { MessageCircle, ArrowRight, ChevronDown, ShoppingBag, User } from "lucide-react";
import Link from "next/link";
import OrderChat from "./OrderChat";
import { useLang } from "@/lib/LangContext";
import { t } from "@/lib/i18n";

interface ActiveOrder {
  id: string;
  status: string;
  trip_id: string;
  buyer_id: string;
  trips: {
    origin_zone: string;
    destination_zone: string;
    shopper_id: string;
    profiles: { username: string } | null;
  } | null;
  profiles: { username: string } | null; // buyer profile
}

interface Props {
  orders: ActiveOrder[];
  currentUserId: string;
  currentUsername: string;
}

const statusKeyMap: Record<string, string> = {
  pending: "status_pending", accepted: "status_accepted",
  bought: "status_bought", delivering: "status_delivering",
  shopping: "status_shopping", completed: "status_completed",
};

export default function DashboardChats({ orders, currentUserId, currentUsername }: Props) {
  const [openId, setOpenId] = useState<string | null>(
    orders.length === 1 ? orders[0].id : null
  );
  const { lang } = useLang();

  if (orders.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="font-bold text-brand-navy flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-brand-blue" />
        {t(lang,"chat_active")}
      </h2>

      {orders.map((order) => {
        const isShopper = order.trips?.shopper_id === currentUserId;
        const isOpen = openId === order.id;

        // context label
        const contextLabel = isShopper
          ? `${t(lang,"chat_buyer")}: ${order.profiles?.username || "-"}`
          : `${t(lang,"chat_shopper_label")}: ${order.trips?.profiles?.username || "-"}`;

        return (
          <div key={order.id} className="card p-0 overflow-hidden">
            {/* Header */}
            <button
              onClick={() => setOpenId(isOpen ? null : order.id)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-3 text-left">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isShopper ? "bg-brand-blue/10" : "bg-brand-cyan/10"
                }`}>
                  {isShopper
                    ? <User className="w-4 h-4 text-brand-blue" />
                    : <ShoppingBag className="w-4 h-4 text-brand-cyan" />}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-semibold text-brand-navy">
                      {order.trips?.origin_zone}
                    </span>
                    <ArrowRight className="w-3 h-3 text-gray-400" />
                    <span className="text-sm font-semibold text-brand-navy">
                      {order.trips?.destination_zone}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">{contextLabel}</span>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400">
                      {t(lang, statusKeyMap[order.status] || order.status) || order.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <Link
                  href={`/orders/${order.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-brand-blue hover:underline"
                >
                  {t(lang,"chat_view_order")}
                </Link>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
              </div>
            </button>

            {/* Chat */}
            {isOpen && (
              <div className="border-t border-gray-100">
                <OrderChat
                  orderId={order.id}
                  currentUserId={currentUserId}
                  currentUsername={currentUsername}
                  embedded
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
