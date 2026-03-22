"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, MapPin, Wallet, FileText, TrendingUp, ChevronDown, ArrowRight } from "lucide-react";
import { UNIVERSITIES } from "@/lib/universities";

interface Props {
  userCount: number;
  openTrips: any[];
  slipsPending: any[];
  slipsVerified: any[];
  slipsUpdated: any[];
  areaStatuses: any[];
  universities: typeof UNIVERSITIES;
}

export default function AdminDashboard({ userCount, openTrips, slipsPending, slipsVerified, slipsUpdated, areaStatuses, universities }: Props) {
  const [selectedUni, setSelectedUni] = useState("all");

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
    { label: "ทริปที่เปิดอยู่", value: filteredTrips.length, icon: <TrendingUp className="w-5 h-5 text-brand-cyan" />, color: "bg-brand-cyan/10" },
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
              <div key={trip.id} className="card flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-bold text-brand-navy">{trip.origin_zone} → {trip.destination_zone}</p>
                  <p className="text-xs text-gray-400">@{trip.profiles?.username} · {trip.current_orders}/{trip.max_orders} ออเดอร์</p>
                </div>
                <span className="pill bg-green-100 text-green-700 text-xs">เปิด</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
