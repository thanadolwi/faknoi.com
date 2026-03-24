"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, Clock, TrendingUp, MapPin, ShoppingBag, Store, Flame, ChevronDown } from "lucide-react";
import DashboardChats from "./DashboardChats";
import NearbyTrips from "./NearbyTrips";
import BannerSlider from "./BannerSlider";
import TripRequestBoard from "./TripRequestBoard";
import { getUniShortNameById, getZoneNameByThai } from "@/lib/universities";
import { useLang } from "@/lib/LangContext";
import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

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

interface ShopByUni {
  uniId: string;
  uniName: string;
  shops: [string, number][];
}

interface Insights {
  topZonesByUni: ZoneByUni[];
  topItemsByUni: ItemByUni[];
  topHoursByUni: HourByUni[];
  topShopsByUni: ShopByUni[];
  totalRecent: number;
}

interface Props {
  username: string;
  trips: any[];
  orders: any[];
  allActiveOrders: any[];
  currentUserId: string;
  insights: Insights;
  banners: { id: string; image_url: string; created_at: string }[];
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

export default function I18nDashboard({ username, trips: initialTrips, orders: initialOrders, allActiveOrders, currentUserId, insights: initialInsights, banners }: Props) {
  const { lang } = useLang();
  const [selectedUni, setSelectedUni] = useState<string>("all");
  const [trips, setTrips] = useState<any[]>(initialTrips);
  const [orders, setOrders] = useState<any[]>(initialOrders);
  const [activeOrders, setActiveOrders] = useState<any[]>(allActiveOrders);
  const [sortedTrips, setSortedTrips] = useState<any[]>(initialTrips);
  const [insights, setInsights] = useState(initialInsights);

  const refetchInsights = useCallback(async () => {
    try {
      const res = await fetch("/api/insights");
      if (!res.ok) return;
      const data = await res.json();
      setInsights(data);
    } catch {}
  }, []);

  // Realtime: trips
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("dashboard-trips-realtime")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "trips" }, (payload) => {
        const updated = payload.new;
        // เฉพาะ open status เท่านั้นที่แสดงในหน้าหลัก
        const showStatuses = ["open"];
        if (!showStatuses.includes(updated.status)) {
          setTrips((prev) => prev.filter((t) => t.id !== updated.id));
          setSortedTrips((prev) => prev.filter((t) => t.id !== updated.id));
        } else {
          setTrips((prev) => prev.map((t) => t.id === updated.id ? { ...t, ...updated } : t));
          setSortedTrips((prev) => prev.map((t) => t.id === updated.id ? { ...t, ...updated } : t));
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "trips" }, async (payload) => {
        if (payload.new.status !== "open") return;
        const { data } = await supabase.from("trips").select("*, profiles(username)").eq("id", payload.new.id).single();
        if (data) {
          setTrips((prev) => [data, ...prev]);
          setSortedTrips((prev) => [data, ...prev]);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Realtime: orders (สถานะออเดอร์ล่าสุด + activeOrders สำหรับ DashboardChats)
  useEffect(() => {
    if (!currentUserId) return;
    const supabase = createClient();
    const channel = supabase
      .channel("dashboard-orders-realtime")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, (payload) => {
        const updated = payload.new;
        setOrders((prev) => prev.map((o) => o.id === updated.id ? { ...o, ...updated } : o));
        setActiveOrders((prev) => {
          if (updated.status === "completed" || updated.status === "cancelled") {
            return prev.filter((o) => o.id !== updated.id);
          }
          return prev.map((o) => o.id === updated.id ? { ...o, ...updated } : o);
        });
        refetchInsights();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, async (payload) => {
        const { data } = await supabase
          .from("orders")
          .select("id, status, created_at, trip_id, trips(origin_zone, destination_zone, shopper_id, profiles(username)), profiles(username)")
          .eq("id", payload.new.id)
          .single();
        if (!data) return;
        const isBuyer = (data as any).buyer_id === currentUserId;
        const isShopper = (data as any).trips?.shopper_id === currentUserId;
        if (isBuyer || isShopper) {
          setActiveOrders((prev) => [data, ...prev]);
        }
        refetchInsights();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUserId, refetchInsights]);
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
            <Link href="/trips"
              className="flex items-center gap-2 bg-sky-400/80 text-white text-sm font-bold px-4 py-2.5 rounded-2xl hover:bg-sky-400 active:scale-95 transition-all duration-150 border border-sky-300/40">
              {t(lang,"dash_all_trips")}
            </Link>
            <Link href="/trips/create"
              className="flex items-center gap-2 bg-brand-yellow text-brand-navy text-sm font-black px-4 py-2.5 rounded-2xl hover:brightness-105 active:scale-95 transition-all duration-150"
              style={{boxShadow:"0 4px 12px rgba(255,222,66,0.35)"}}>
              {t(lang,"dash_open_trip")}
            </Link>
          </div>
        </div>
      </div>

      {/* Banner Slider */}
      <BannerSlider initialBanners={banners} />

      {/* Active Order Chats */}
      {activeOrders.length > 0 && (
        <DashboardChats orders={activeOrders} currentUserId={currentUserId} currentUsername={username} />
      )}

      {/* Open Trips */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-brand-navy">{t(lang,"dash_open_trips")}</h2>
          <Link href="/trips" className="text-sm font-bold text-brand-blue hover:underline flex items-center gap-1">
            {t(lang,"dash_see_all")} <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {/* Current location + sort by distance */}
        <div className="mb-3">
          <NearbyTrips trips={trips} onSorted={setSortedTrips} />
        </div>
        {sortedTrips.length > 0 ? (
          <div className="space-y-2.5">
            {sortedTrips.map((trip: any) => (
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

      {/* Trip Request Board */}
      <TripRequestBoard currentUserId={currentUserId} />

      {/* Recent Orders */}
      <div>        <div className="flex items-center justify-between mb-3">
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
          {(() => {
            const filtered = selectedUni === "all"
              ? insights.topShopsByUni
              : insights.topShopsByUni.filter((u) => u.uniId === selectedUni);
            if (!filtered.length) return null;
            return (
              <div className="card p-4 space-y-4">
                <div className="flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-brand-cyan" />
                  <span className="text-xs font-black text-brand-navy">ร้านฮิต</span>
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
                      <div className="flex flex-wrap gap-2 pl-2">
                        {uni.shops.map(([shop, count], i) => (
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
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
