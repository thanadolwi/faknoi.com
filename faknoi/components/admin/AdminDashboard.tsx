"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, MapPin, Wallet, TrendingUp, ChevronDown, ArrowRight, Clock, ShoppingBag, Store, Flame } from "lucide-react";
import { UNIVERSITIES, getUniShortNameById, getZoneNameByThai } from "@/lib/universities";

interface ZoneByUni { uniId: string; uniName: string; zones: [string, number][]; }
interface ItemByUni { uniId: string; uniName: string; items: [string, number][]; }
interface HourByUni { uniId: string; uniName: string; hours: { hour: number; count: number }[]; }
interface ShopByUni { uniId: string; uniName: string; shops: [string, number][]; }
interface Insights {
  topZonesByUni: ZoneByUni[];
  topItemsByUni: ItemByUni[];
  topHoursByUni: HourByUni[];
  topShopsByUni: ShopByUni[];
  totalRecent: number;
}

interface Props {
  userCount: number;
  openTrips: any[];
  slipsPending: any[];
  slipsVerified: any[];
  slipsUpdated: any[];
  areaStatuses: any[];
  universities: typeof UNIVERSITIES;
  insights: Insights;
}

const UNI_COLORS = [
  { badge: "bg-brand-blue/10 text-brand-blue", bar: "linear-gradient(90deg,#5478FF,#53CBF3)" },
  { badge: "bg-brand-cyan/10 text-brand-navy", bar: "linear-gradient(90deg,#53CBF3,#FFDE42)" },
  { badge: "bg-yellow-100 text-yellow-700",    bar: "linear-gradient(90deg,#FFDE42,#FFB800)" },
  { badge: "bg-purple-100 text-purple-700",    bar: "linear-gradient(90deg,#a78bfa,#818cf8)" },
  { badge: "bg-green-100 text-green-700",      bar: "linear-gradient(90deg,#34d399,#10b981)" },
];

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
function HourLabel(h: number) { const ampm = h < 12 ? "AM" : "PM"; const h12 = h % 12 || 12; return `${h12}:00 ${ampm}`; }

export default function AdminDashboard({ userCount, openTrips, slipsPending, slipsVerified, slipsUpdated, areaStatuses, universities, insights }: Props) {
  const [selectedUni, setSelectedUni] = useState("all");
  const [insightUni, setInsightUni] = useState("all");

  const activeAreas = universities.filter((u) => {
    const s = areaStatuses.find((a) => a.university_id === u.id);
    return !s || s.is_open !== false;
  });

  function filterByUni(items: any[]) {
    if (selectedUni === "all") return items;
    return items.filter((i) => i.university_id === selectedUni);
  }

  const filteredTrips = filterByUni(openTrips);
  const filteredPending = filterByUni(slipsPending);
  const filteredVerified = filterByUni(slipsVerified);
  const filteredUpdated = filterByUni(slipsUpdated);

  const stats = [
    { label: "จำนวนบัญชีผู้ใช้งาน", value: userCount, icon: <Users className="w-5 h-5 text-brand-blue" />, color: "bg-brand-blue/10" },
    { label: "พื้นที่ที่เปิดใช้งาน", value: activeAreas.length, icon: <MapPin className="w-5 h-5 text-green-500" />, color: "bg-green-50" },
    { label: "ทริปที่เปิดอยู่", value: openTrips.length, icon: <TrendingUp className="w-5 h-5 text-brand-cyan" />, color: "bg-brand-cyan/10" },
    { label: "สลิปค้างตรวจ", value: filteredPending.length, icon: <Wallet className="w-5 h-5 text-amber-500" />, color: "bg-amber-50", urgent: filteredPending.length > 0 },
    { label: "ตรวจสอบเรียบร้อย", value: filteredVerified.length, icon: <Wallet className="w-5 h-5 text-blue-500" />, color: "bg-blue-50" },
    { label: "อัปเดตข้อมูลเสร็จสิ้น", value: filteredUpdated.length, icon: <Wallet className="w-5 h-5 text-green-500" />, color: "bg-green-50" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-brand-navy">🛡️ Admin Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">ภาพรวมระบบ FakNoi</p>
        </div>
      </div>

      {/* Uni filter */}
      <div className="relative">
        <select value={selectedUni} onChange={(e) => setSelectedUni(e.target.value)}
          className="w-full appearance-none input-field text-sm font-bold text-brand-navy pr-8">
          <option value="all">🏫 ทุกมหาวิทยาลัย</option>
          {universities.map((u) => <option key={u.id} value={u.id}>{u.shortName}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className={`card py-4 text-center ${s.urgent ? "border-2 border-amber-300" : ""}`}>
            <div className={`w-10 h-10 rounded-2xl ${s.color} flex items-center justify-center mx-auto mb-2`}>
              {s.icon}
            </div>
            <p className="text-2xl font-black text-brand-navy">{s.value}</p>
            <p className="text-xs text-gray-400 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { href: "/admin/users",  label: "👤 ผู้ใช้งาน",  desc: "ค้นหาและจัดการ" },
          { href: "/admin/areas",  label: "🏫 พื้นที่",     desc: "เปิด/ปิดมหาวิทยาลัย" },
          { href: "/admin/wallet", label: "💰 ตรวจสลิป",   desc: `${slipsPending.length} รอตรวจ` },
          { href: "/admin/reports",label: "📋 รายงาน",     desc: "รายงานปัญหา" },
          { href: "/admin/trips",  label: "🛵 ทริป",        desc: "ดูทริปและออเดอร์" },
        ].map((l) => (
          <Link key={l.href} href={l.href}
            className="card flex items-center justify-between hover:border-brand-blue/30 hover:shadow-md transition-all group">
            <div>
              <p className="font-black text-brand-navy text-sm">{l.label}</p>
              <p className="text-xs text-gray-400">{l.desc}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-brand-blue transition-colors" />
          </Link>
        ))}
      </div>

      {/* Open trips list */}
      {filteredTrips.length > 0 && (
        <div>
          <h2 className="font-black text-brand-navy mb-3 text-sm">🛵 ทริปที่เปิดอยู่ ({filteredTrips.length})</h2>
          <div className="space-y-2">
            {filteredTrips.slice(0, 5).map((trip: any) => (
              <Link key={trip.id} href={`/trips/${trip.id}`} className="card flex items-center justify-between py-3 hover:border-brand-blue/30 transition-all group">
                <div>
                  <p className="text-sm font-bold text-brand-navy">{trip.origin_zone} → {trip.destination_zone}</p>
                  <p className="text-xs text-gray-400">@{trip.profiles?.username} · {trip.current_orders}/{trip.max_orders} ออเดอร์</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="pill bg-green-100 text-green-700 text-xs">เปิด</span>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-brand-blue transition-colors" />
                </div>
              </Link>
            ))}
            {filteredTrips.length > 5 && (
              <Link href="/admin/trips" className="block text-center text-xs text-brand-blue font-bold py-2 hover:underline">
                ดูทั้งหมด {filteredTrips.length} ทริป →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Insights */}
      {insights.totalRecent > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-brand-blue/10 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-3.5 h-3.5 text-brand-blue" />
            </div>
            <div>
              <h2 className="font-black text-brand-navy text-sm leading-tight">Insights · 7 วันล่าสุด</h2>
              <p className="text-xs text-gray-400">{insights.totalRecent} ออเดอร์</p>
            </div>
          </div>

          {insights.topZonesByUni.length > 0 && (
            <div className="relative">
              <select value={insightUni} onChange={(e) => setInsightUni(e.target.value)}
                className="w-full appearance-none input-field text-sm font-bold text-brand-navy pr-8">
                <option value="all">🏫 ทุกมหาวิทยาลัย</option>
                {insights.topZonesByUni.map((u) => (
                  <option key={u.uniId} value={u.uniId}>{getUniShortNameById(u.uniId, "th")}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          )}

          {/* Hot Zones */}
          {(() => {
            const filtered = insightUni === "all" ? insights.topZonesByUni : insights.topZonesByUni.filter((u) => u.uniId === insightUni);
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
                      {insightUni === "all" && (
                        <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-lg ${color.badge}`}>
                          {getUniShortNameById(uni.uniId, "th")}
                        </span>
                      )}
                      {uni.zones.map(([zone, count]) => (
                        <div key={zone} className="space-y-1 pl-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-600 truncate max-w-[180px]">{getZoneNameByThai(zone, "th")}</span>
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

          {/* Peak Hours */}
          {(() => {
            const filtered = insightUni === "all" ? insights.topHoursByUni : insights.topHoursByUni.filter((u) => u.uniId === insightUni);
            if (!filtered.length) return null;
            return (
              <div className="card p-4 space-y-4">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-brand-cyan" />
                  <span className="text-xs font-black text-brand-navy">ช่วงเวลาฮิต</span>
                </div>
                {filtered.map((uni, uniIdx) => {
                  const color = UNI_COLORS[uniIdx % UNI_COLORS.length];
                  return (
                    <div key={uni.uniId} className="space-y-2">
                      {insightUni === "all" && (
                        <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-lg ${color.badge}`}>
                          {getUniShortNameById(uni.uniId, "th")}
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

          {/* Top Items */}
          {(() => {
            const filtered = insightUni === "all" ? insights.topItemsByUni : insights.topItemsByUni.filter((u) => u.uniId === insightUni);
            if (!filtered.length) return null;
            return (
              <div className="card p-4 space-y-4">
                <div className="flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-brand-blue" />
                  <span className="text-xs font-black text-brand-navy">เมนูฮิต</span>
                </div>
                {filtered.map((uni, uniIdx) => {
                  const maxItem = uni.items[0]?.[1] || 1;
                  const color = UNI_COLORS[uniIdx % UNI_COLORS.length];
                  return (
                    <div key={uni.uniId} className="space-y-2">
                      {insightUni === "all" && (
                        <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-lg ${color.badge}`}>
                          {getUniShortNameById(uni.uniId, "th")}
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
            const filtered = insightUni === "all" ? insights.topShopsByUni : insights.topShopsByUni.filter((u) => u.uniId === insightUni);
            if (!filtered.length) return null;
            return (
              <div className="card p-4 space-y-4">
                <div className="flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-brand-cyan" />
                  <span className="text-xs font-black text-brand-navy">ร้านฮิต</span>
                </div>
                {filtered.map((uni, uniIdx) => {
                  const color = UNI_COLORS[uniIdx % UNI_COLORS.length];
                  return (
                    <div key={uni.uniId} className="space-y-2">
                      {insightUni === "all" && (
                        <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-lg ${color.badge}`}>
                          {getUniShortNameById(uni.uniId, "th")}
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
