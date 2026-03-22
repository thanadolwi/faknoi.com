"use client";

import { useState, useEffect } from "react";
import { MessageCircle, ArrowRight, ChevronDown, ShoppingBag, User } from "lucide-react";
import Link from "next/link";
import OrderChat from "./OrderChat";
import { useLang } from "@/lib/LangContext";
import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

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
  profiles: { username: string } | null;
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
  // unreadMap: orderId -> count
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const { lang } = useLang();

  // Subscribe to new messages for all orders to track unread counts
  useEffect(() => {
    if (orders.length === 0) return;
    const supabase = createClient();
    const channels = orders.map((order) => {
      return supabase
        .channel(`dash-chat-unread-${order.id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `order_id=eq.${order.id}` },
          (payload) => {
            // Only count messages from others
            if (payload.new.sender_id !== currentUserId) {
              setUnreadMap((prev) => ({
                ...prev,
                [order.id]: (prev[order.id] || 0) + 1,
              }));
            }
          }
        )
        .subscribe();
    });
    return () => { channels.forEach((ch) => supabase.removeChannel(ch)); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders.length, currentUserId]);

  const totalUnread = Object.values(unreadMap).reduce((s, n) => s + n, 0);

  if (orders.length === 0) return null;

  const shopperOrders = orders.filter((o) => o.trips?.shopper_id === currentUserId);
  const buyerOrders = orders.filter((o) => o.trips?.shopper_id !== currentUserId);

  function handleOpen(orderId: string) {
    const isOpen = openId === orderId;
    setOpenId(isOpen ? null : orderId);
    if (!isOpen) {
      // Clear unread for this order when opening
      setUnreadMap((prev) => ({ ...prev, [orderId]: 0 }));
    }
  }

  function renderGroup(groupOrders: ActiveOrder[], groupLabel: string, icon: React.ReactNode) {
    if (groupOrders.length === 0) return null;
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
          {icon}{groupLabel}
        </p>
        {groupOrders.map((order) => {
          const isShopper = order.trips?.shopper_id === currentUserId;
          const isOpen = openId === order.id;
          const orderUnread = unreadMap[order.id] || 0;
          const contextLabel = isShopper
            ? `${t(lang, "chat_buyer")}: ${order.profiles?.username || "-"}`
            : `${t(lang, "chat_shopper_label")}: ${order.trips?.profiles?.username || "-"}`;

          return (
            <div key={order.id} className="card p-0 overflow-hidden">
              <button
                onClick={() => handleOpen(order.id)}
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
                      <span className="text-sm font-semibold text-brand-navy">{order.trips?.origin_zone}</span>
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                      <span className="text-sm font-semibold text-brand-navy">{order.trips?.destination_zone}</span>
                      {orderUnread > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {orderUnread}
                        </span>
                      )}
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
                  <Link href={`/orders/${order.id}`} onClick={(e) => e.stopPropagation()}
                    className="text-xs text-brand-blue hover:underline">
                    {t(lang, "chat_view_order")}
                  </Link>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                </div>
              </button>
              {isOpen && (
                <div className="border-t border-gray-100">
                  <OrderChat orderId={order.id} currentUserId={currentUserId} currentUsername={currentUsername} embedded />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="font-bold text-brand-navy flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-brand-blue" />
        {t(lang, "chat_active")}
        {totalUnread > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
            {totalUnread}
          </span>
        )}
      </h2>
      {renderGroup(shopperOrders, t(lang, "chat_as_shopper"), <User className="w-3.5 h-3.5 text-brand-blue" />)}
      {renderGroup(buyerOrders, t(lang, "chat_as_buyer"), <ShoppingBag className="w-3.5 h-3.5 text-brand-cyan" />)}
    </div>
  );
}
