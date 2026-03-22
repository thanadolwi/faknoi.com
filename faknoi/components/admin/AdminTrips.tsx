"use client";

import { useState, useEffect } from "react";
import { MapPin, ArrowRight, Users, Clock, ChevronDown, ChevronUp, Package, GraduationCap } from "lucide-react";
import Link from "next/link";
import { UNIVERSITIES } from "@/lib/universities";

const TRIP_STATUS_LABEL: Record<string, { label: string; color: string }> = {
  open:      { label: "เปิดรับ",    color: "bg-green-100 text-green-700" },
  shopping:  { label: "กำลังซื้อ",  color: "bg-blue-100 text-blue-700" },
  delivered: { label: "ส่งแล้ว",    color: "bg-gray-100 text-gray-600" },
  cancelled: { label: "ยกเลิก",     color: "bg-red-100 text-red-600" },
};

const ORDER_STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:   { label: "รอยืนยัน",   color: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "ยืนยันแล้ว", color: "bg-blue-100 text-blue-700" },
  shopping:  { label: "กำลังซื้อ",  color: "bg-purple-100 text-purple-700" },
  delivered: { label: "ส่งแล้ว",    color: "bg-green-100 text-green-700" },
  cancelled: { label: "ยกเลิก",     color: "bg-red-100 text-red-600" },
};

export default function AdminTrips() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUni, setSelectedUni] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/trips")
      .then((r) => r.json())
      .then((d) => { setTrips(d.trips || []); setLoading(false); });
  }, []);

  const filtered = trips.filter((t) => {
    if (selectedUni !== "all" && t.university_id !== selectedUni) return false;
    if (selectedStatus !== "all" && t.status !== selectedStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !t.origin_zone?.toLowerCase().includes(q) &&
        !t.destination_zone?.toLowerCase().includes(q) &&
        !t.profiles?.username?.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  if (loading) return <div className="text-center py-10 text-gray-400">กำลังโหลด...</div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-black text-brand-navy">🛵 ทริปทั้งหมด</h2>
        <p className="text-xs text-gray-400">{filtered.length} ทริป</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-2">
        <select value={selectedUni} onChange={(e) => setSelectedUni(e.target.value)}
          className="input-field text-sm">
          <option value="all">ทุกมหาวิทยาลัย</option>
          {UNIVERSITIES.map((u) => <option key={u.id} value={u.id}>{u.shortName}</option>)}
        </select>
        <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}
          className="input-field text-sm">
          <option value="all">ทุกสถานะ</option>
          <option value="open">เปิดรับ</option>
          <option value="shopping">กำลังซื้อ</option>
          <option value="delivered">ส่งแล้ว</option>
          <option value="cancelled">ยกเลิก</option>
        </select>
      </div>
      <input type="text" className="input-field text-sm" placeholder="ค้นหา zone หรือ username..."
        value={search} onChange={(e) => setSearch(e.target.value)} />

      {/* Trip list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="card text-center py-10 text-gray-400">ไม่พบทริป</div>
        )}
        {filtered.map((trip) => {
          const st = TRIP_STATUS_LABEL[trip.status] ?? { label: trip.status, color: "bg-gray-100 text-gray-600" };
          const isOpen = expandedId === trip.id;
          const orders: any[] = trip.orders || [];

          return (
            <div key={trip.id} className="card overflow-hidden">
              {/* Header row */}
              <button className="w-full flex items-start justify-between gap-3 text-left"
                onClick={() => setExpandedId(isOpen ? null : trip.id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`pill text-xs ${st.color}`}>{st.label}</span>
                    {trip.university_id && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <GraduationCap className="w-3 h-3" />
                        {UNIVERSITIES.find((u) => u.id === trip.university_id)?.shortName}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">@{trip.profiles?.username}</span>
                    <Link href={`/trips/${trip.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="ml-auto text-xs text-brand-blue font-bold hover:underline flex items-center gap-0.5">
                      ดูรายละเอียด <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-bold text-brand-navy">
                    <MapPin className="w-3.5 h-3.5 text-brand-blue flex-shrink-0" />
                    <span className="truncate">{trip.origin_zone}</span>
                    <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{trip.destination_zone}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {trip.current_orders}/{trip.max_orders} ออเดอร์
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(trip.cutoff_time).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}
                    </span>
                    <span>฿{trip.fee_per_item}/ชิ้น</span>
                  </div>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />}
              </button>

              {/* Expanded detail */}
              {isOpen && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                  {/* Trip info */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {trip.estimated_delivery_time && (
                      <div className="bg-gray-50 rounded-xl px-3 py-2">
                        <p className="text-gray-400">เวลาส่งโดยประมาณ</p>
                        <p className="font-bold text-brand-navy">
                          {new Date(trip.estimated_delivery_time).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}
                        </p>
                      </div>
                    )}
                    <div className="bg-gray-50 rounded-xl px-3 py-2">
                      <p className="text-gray-400">ช่องทางชำระเงิน</p>
                      <p className="font-bold text-brand-navy truncate">{trip.payment_info || "-"}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl px-3 py-2">
                      <p className="text-gray-400">สร้างเมื่อ</p>
                      <p className="font-bold text-brand-navy">
                        {new Date(trip.created_at).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}
                      </p>
                    </div>
                    {trip.note && (
                      <div className="bg-gray-50 rounded-xl px-3 py-2 col-span-2">
                        <p className="text-gray-400">หมายเหตุ</p>
                        <p className="font-bold text-brand-navy">{trip.note}</p>
                      </div>
                    )}
                  </div>

                  {/* Orders */}
                  <div>
                    <p className="text-xs font-black text-brand-navy mb-2 flex items-center gap-1">
                      <Package className="w-3.5 h-3.5" /> ออเดอร์ในทริปนี้ ({orders.length})
                    </p>
                    {orders.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-3">ยังไม่มีออเดอร์</p>
                    ) : (
                      <div className="space-y-1.5">
                        {orders.map((order: any) => {
                          const os = ORDER_STATUS_LABEL[order.status] ?? { label: order.status, color: "bg-gray-100 text-gray-600" };
                          const itemCount = Array.isArray(order.items) ? order.items.length : 0;
                          const price = order.final_price ?? order.estimated_price;
                          return (
                            <div key={order.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-brand-navy truncate">
                                  @{order.profiles?.username}
                                </p>
                                <p className="text-[10px] text-gray-400">
                                  {itemCount} รายการ{price ? ` · ฿${price}` : ""}
                                </p>
                              </div>
                              <span className={`pill text-[10px] ml-2 flex-shrink-0 ${os.color}`}>{os.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
