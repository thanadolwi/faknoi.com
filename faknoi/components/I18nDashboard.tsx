"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, TrendingUp, MapPin, ShoppingBag, Store, Flame, ChevronDown } from "lucide-react";
import DashboardChats from "./DashboardChats";
import { getUniShortNameById, getZoneNameByThai } from "@/lib/universities";
import { useLang } from "@/lib/LangContext";
import { t } from "@/lib/i18n";

interface ZoneByUni {
  uniId: string;
  uniName: string;
  zones: [string, number][];
}

interface ItemByUni {
  uniId: string;
  uniName: string;
  items: [string, number][];
}

interface HourByUni {
  uniId: string;
  uniName: string;
  hours: { hour: number; count: number }[];
}

interface Insights {
  topZonesByUni: ZoneByUni[];
  topItemsByUni: ItemByUni[];
  topHoursByUni: HourByUni[];
  topShops: [string, number][];
  totalRecent: number;
}

interface Props {
  username: string;
  trips: any[];
  orders: any[];
  allActiveOrders: any[];
  currentUserId: string;
  insights: Insights;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function HourLabel(h: number) {
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 || 12;
  return `${h12}:00 ${ampm}`;
}

const UNI_COLORS = [
  { badge: "bg-brand-blue/10 text-brand-blue", bar: "linear-gradient(90deg,#5478FF,#53CBF3)" },
  { badge: "bg-brand-cyan/10 text-brand-navy", bar: "linear-gradient(90deg,#53CBF3,#FFDE42)" },
  { badge: "bg-yellow-100 text-yellow-700",    bar: "linear-gradient(90deg,#FFDE42,#FFB800)" },
  { badge: "bg-purple-100 text-purple-700",    bar: "linear-gradient(90deg,#a78bfa,#818cf8)" },
  { badge: "bg-green-100 text-green-700",      bar: "linear-gradient(90deg,#34d399,#10b981)" },
];

export default function I18nDashboard({ username, trips, orders, allActiveOrders, currentUserId, insights }: Props) {
  const { lang } = useLang();
  const [selectedUni, setSelectedUni] = useState<string>("all");

  const statusLabel: Record<string, { label: string; color: string; emoji: string }> = {
    pending:    { label: t(lang,"status_pending"),    color: "bg-yellow-100 text-yellow-700",  emoji: "⏳" },
    accepted:   { label: t(lang,"status_accepted"),   color: "bg-blue-100 text-blue-700",      emoji: "✅" },
    shopping:   { label: t(lang,"status_shopping"),   color: "bg-indigo-100 text-indigo-700",  emoji: "🛒" },
    bought:     { label: t(lang,"status_bought"),     color: "bg-cyan-100 text-cyan-700",      emoji: "📦" },
    delivering: { label: t(lang,"status_delivering"), color: "bg-purple-100 text-purple-700",  emoji: "🛵" },
    completed:  { label: t(lang,"status_completed"),  color: "bg-green-100 text-green-700",    emoji: "🎉" },
    cancelled:  { label: t(lang,"status_cancelled"),  color: "bg-red-100 text-red-700",        emoji: "❌" },
  };

  return (
    <div className="space-y-5">
      {/* Welcome Hero */}
      <div className="relative rounded-3xl p-6 text-white overflow-hidden hero-grad"
        style={{boxShadow:"0 8px 32px rgba(84,120,255,0.25)"}}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-yellow/15 rounded-full translate-y-1/2 -translate-x-1/4 blur-xl" />
        </div>
        <div className="absolute top-4 right-6 text-3xl animate-float pointer-events-none select-none opacity-60">🛵</div>
        <div className="relative">
          <p className="text-white/60 text-sm font-medium mb-0.5">{t(lang,"dash_hello")}</p>
          <h1 className="text-2xl font-black mb-5 tracking-tight">{username}</h1>
          <div className="flex flex-wrap gap-2.5">
            <Link href="/trips/create"
              className="flex items-center gap-2 bg-brand-yellow text-brand-navy text-sm font-black px-4 py-2.5 rounded-2xl hover:brightness-105 active:scale-95 transition-all duration-150"
              style={{boxShadow:"0 4px 12px rgba(255,222,66,0.35)"}}>
              {t(lang,"dash_open_trip")}
            </Link>
            <Link href="/trips"
              className="flex items-center gap-2 bg-white/20 text-white text-sm font-bold px-4 py-2.5 rounded-2xl hover:bg-white/30 active:scale-95 transition-all duration-150 border border-white/20">
              {t(lang,"dash_all_trips")}
            </Link>
          </div>
        </div>
      </div>

      {/* Active Order Chats */}
      {allActiveOrders.length > 0 && (
        <DashboardChats orders={allActiveOrders} currentUserId={currentUserId} currentUsername={username} />
      )}

      {/* Open Trips */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-brand-navy">{t(lang,"dash_open_trips")}</h2>
          <Link href="/trips" className="text-sm font-bold text-brand-blue hover:underline flex items-center gap-1">
            {t(lang,"dash_see_all")} <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {trips.length > 0 ? (
          <div className="space-y-2.5">
            {trips.map((trip: any) => (
              <Link key={trip.id} href={`/trips/${trip.id}`}
                className="card flex items-center justify-between hover:border-brand-blue/30 hover:shadow-md active:scale-[0.99] transition-all duration-150 group">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-black text-brand-navy">{trip.origin_zone}</span>
                    <span className="text-gray-300">→</span>
                    <span className="font-black text-brand-navy">{trip.destination_zone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(trip.cutoff_time).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span>👥 {trip.current_orders}/{trip.max_orders}</span>
                    <span>{t(lang,"dash_by")} {trip.profiles?.username}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="pill bg-green-100 text-green-700">{t(lang,"dash_open")}</span>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-brand-blue transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card text-center py-10">
            <div className="text-4xl mb-3">🛵</div>
            <p className="text-sm text-gray-400 font-medium mb-3">{t(lang,"dash_no_trips")}</p>
            <Link href="/trips/create" className="btn-primary text-sm py-2 px-5 inline-flex items-center gap-2">
              {t(lang,"dash_open_first")}
            </Link>
          </div>
        )}
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-brand-navy">{t(lang,"dash_recent_orders")}</h2>
          <Link href="/orders" className="text-sm font-bold text-brand-blue hover:underline flex items-center gap-1">
            {t(lang,"dash_see_all")} <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {orders.length > 0 ? (
          <div className="space-y-2.5">
            {orders.map((order: any) => {
              const s = statusLabel[order.status] || { label: order.status, color: "bg-gray-100 text-gray-600", emoji: "•" };
              return (
                <Link key={order.id} href={`/orders/${order.id}`}
                  className="card flex items-center justify-between hover:border-brand-blue/30 hover:shadow-md active:scale-[0.99] transition-all duration-150 group">
                  <div>
                    <p className="font-black text-brand-navy mb-0.5">
                      {order.trips?.origin_zone} → {order.trips?.destination_zone}
                    </p>
                    <p className="text-xs text-gray-400 font-medium">
                      {new Date(order.created_at).toLocaleDateString("th-TH")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`pill ${s.color}`}>{s.emoji} {s.label}</span>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-brand-blue transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="card text-center py-10">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm text-gray-400 font-medium mb-3">{t(lang,"dash_no_orders")}</p>
            <Link href="/trips" className="text-brand-blue text-sm font-bold hover:underline">
              {t(lang,"dash_find_trip")}
            </Link>
          </div>
        )}
      </div>

      {/* Insights */}
      {insights.totalRecent > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl hero-grad flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <h2 className="font-black text-brand-navy text-sm leading-tight">Insights · 7 วันล่าสุด</h2>
              <p className="text-xs text-gray-400">{insights.totalRecent} ออเดอร์</p>
            </div>
          </div>

          {/* University selector */}
          {insights.topZonesByUni.length > 0 && (
            <div className="relative">
              <select
                value={selectedUni}
                onChange={(e) => setSelectedUni(e.target.value)}
                className="w-full appearance-none input-field text-sm font-bold text-brand-navy pr-8">
                <option value="all">🏫 ทุกมหาวิทยาลัย</option>
                {insights.topZonesByUni.map((u) => (
                  <option key={u.uniId} value={u.uniId}>{getUniShortNameById(u.uniId, lang)}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          )}

          {/* Hot Zones */}
          {(() => {
            const filtered = selectedUni === "all"
              ? insights.topZonesByUni
              : insights.topZonesByUni.filter((u) => u.uniId === selectedUni);
            if (!filtered.length) return null;
            return (
              <div className="card p-4 space-y-4">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-blue" />
                  <span className="text-xs font-black text-brand-navy">โซนฮิต</span>
                </div>
                {filtered.map((uni, uniIdx) => {
                  const maxZone = uni.zones[0]?.[1] || 1;
                  const color = UNI_COLORS[uniIdx % UNI_COLORS.length];
                  return (
                    <div key={uni.uniId} className="space-y-2">
                      {selectedUni === "all" && (
                        <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-lg ${color.badge}`}>
                          {getUniShortNameById(uni.uniId, lang)}
                        </span>
                      )}
                      {uni.zones.map(([zone, count]) => (
                        <div key={zone} className="space-y-1 pl-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-600 truncate max-w-[180px]">{getZoneNameByThai(zone, lang)}</span>
                            <span className="text-xs font-black text-brand-navy">{count}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${(count / maxZone) * 100}%`, background: color.bar }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Peak Hours by Uni */}
          {(() => {
            const filtered = selectedUni === "all"
              ? insights.topHoursByUni
              : insights.topHoursByUni.filter((u) => u.uniId === selectedUni);
            if (!filtered.length) return null;
            return (
              <div className="card p-4 space-y-4">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-brand-cyan" />
                  <span className="text-xs font-black text-brand-navy">ช่วงเวลาฮิต</span>
                  <span className="ml-auto text-xs text-gray-400">7 วันล่าสุด</span>
                </div>
                {filtered.map((uni, uniIdx) => {
                  const color = UNI_COLORS[uniIdx % UNI_COLORS.length];
                  return (
                    <div key={uni.uniId} className="space-y-2">
                      {selectedUni === "all" && (
                        <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-lg ${color.badge}`}>
                          {getUniShortNameById(uni.uniId, lang)}
                        </span>
                      )}
                      {uni.hours.map(({ hour, count }, i) => (
                        <div key={hour} className="flex items-center gap-2 pl-2">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${
                            i === 0 ? "bg-brand-blue text-white" : i === 1 ? "bg-brand-cyan/20 text-brand-navy" : "bg-gray-100 text-gray-500"
                          }`}>{hour}</div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-brand-navy">{HourLabel(hour)}</p>
                            <p className="text-xs text-gray-400">{count} ทริป</p>
                          </div>
                          {i === 0 && <Flame className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Top Items by University */}
          {(() => {
            const filtered = selectedUni === "all"
              ? insights.topItemsByUni
              : insights.topItemsByUni.filter((u) => u.uniId === selectedUni);
            if (!filtered.length) return null;
            return (
              <div className="card p-4 space-y-4">
                <div className="flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-brand-blue" />
                  <span className="text-xs font-black text-brand-navy">เมนูฮิต</span>
                  <span className="ml-auto text-xs text-gray-400">7 วันล่าสุด</span>
                </div>
                {filtered.map((uni, uniIdx) => {
                  const maxItem = uni.items[0]?.[1] || 1;
                  const color = UNI_COLORS[uniIdx % UNI_COLORS.length];
                  return (
                    <div key={uni.uniId} className="space-y-2">
                      {selectedUni === "all" && (
                        <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-lg ${color.badge}`}>
                          {getUniShortNameById(uni.uniId, lang)}
                        </span>
                      )}
                      {uni.items.map(([item, count], i) => (
                        <div key={item} className="flex items-center gap-3 pl-2">
                          <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
                            i === 0 ? "bg-brand-yellow text-brand-navy" : "bg-gray-100 text-gray-500"
                          }`}>{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-xs font-bold text-brand-navy truncate">{capitalize(item)}</span>
                              <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{count}×</span>
                            </div>
                            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${(count / maxItem) * 100}%`, background: color.bar }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Top Shops */}
          {insights.topShops.length > 0 && (
            <div className="card p-4 space-y-3">
              <div className="flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-brand-cyan" />
                <span className="text-xs font-black text-brand-navy">ร้านฮิต</span>
                <span className="ml-auto text-xs text-gray-400">7 วันล่าสุด</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {insights.topShops.map(([shop, count], i) => (
                  <div key={shop} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold border ${
                    i === 0 ? "bg-brand-blue/10 border-brand-blue/20 text-brand-blue"
                    : i === 1 ? "bg-brand-cyan/10 border-brand-cyan/20 text-brand-navy"
                    : "bg-gray-50 border-gray-100 text-gray-600"
                  }`}>
                    {i === 0 && <Flame className="w-3 h-3 text-orange-400" />}
                    {capitalize(shop)}
                    <span className="opacity-60">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
