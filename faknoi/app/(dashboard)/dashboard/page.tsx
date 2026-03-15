import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { MapPin, ClipboardList, Plus, ArrowRight, Clock } from "lucide-react";
import DashboardChats from "@/components/DashboardChats";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const username = user?.user_metadata?.username || user?.email?.split("@")[0] || "ผู้ใช้";

  // Fetch recent open trips
  const { data: trips } = await supabase
    .from("trips")
    .select("*, profiles(username)")
    .eq("status", "open")
    .gt("cutoff_time", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(3);

  // Fetch user's recent orders
  const { data: orders } = await supabase
    .from("orders")
    .select("*, trips(origin_zone, destination_zone)")
    .eq("buyer_id", user?.id)
    .order("created_at", { ascending: false })
    .limit(3);

  // Fetch active orders for chat (both as buyer and shopper)
  const { data: buyerActiveOrders } = await supabase
    .from("orders")
    .select("*, trips(origin_zone, destination_zone, shopper_id, profiles(username)), profiles(username)")
    .eq("buyer_id", user?.id)
    .not("status", "in", '("completed","cancelled")')
    .order("created_at", { ascending: false });

  const { data: shopperTrips } = await supabase
    .from("trips")
    .select("id")
    .eq("shopper_id", user?.id);

  const shopperTripIds = (shopperTrips || []).map((t: any) => t.id);

  const { data: shopperActiveOrders } = shopperTripIds.length > 0
    ? await supabase
        .from("orders")
        .select("*, trips(origin_zone, destination_zone, shopper_id, profiles(username)), profiles(username)")
        .in("trip_id", shopperTripIds)
        .not("status", "in", '("completed","cancelled")')
        .order("created_at", { ascending: false })
    : { data: [] };

  // Merge and deduplicate
  const allActiveOrders = [
    ...(buyerActiveOrders || []),
    ...(shopperActiveOrders || []).filter(
      (o: any) => !(buyerActiveOrders || []).find((b: any) => b.id === o.id)
    ),
  ];

  const statusLabel: Record<string, { label: string; color: string }> = {
    pending:    { label: "รอรับออเดอร์", color: "bg-yellow-100 text-yellow-700" },
    accepted:   { label: "รับแล้ว", color: "bg-blue-100 text-blue-700" },
    bought:     { label: "ซื้อแล้ว", color: "bg-cyan-100 text-cyan-700" },
    delivering: { label: "กำลังส่ง", color: "bg-purple-100 text-purple-700" },
    completed:  { label: "สำเร็จ", color: "bg-green-100 text-green-700" },
    cancelled:  { label: "ยกเลิก", color: "bg-red-100 text-red-700" },
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-brand-navy to-brand-blue rounded-2xl p-6 text-white">
        <p className="text-white/70 text-sm mb-1">สวัสดี 👋</p>
        <h1 className="text-2xl font-bold mb-4">{username}</h1>
        <div className="flex flex-wrap gap-3">
          <Link href="/trips/create" className="flex items-center gap-2 bg-brand-yellow text-brand-navy text-sm font-semibold px-4 py-2 rounded-xl hover:bg-yellow-300 transition-colors">
            <Plus className="w-4 h-4" />
            เปิดทริปใหม่
          </Link>
          <Link href="/trips" className="flex items-center gap-2 bg-white/20 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-white/30 transition-colors">
            <MapPin className="w-4 h-4" />
            ดูทริปทั้งหมด
          </Link>
        </div>
      </div>

      {/* Active Order Chats */}
      {allActiveOrders.length > 0 && (
        <DashboardChats
          orders={allActiveOrders}
          currentUserId={user?.id || ""}
          currentUsername={username}
        />
      )}

      {/* Open Trips */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-brand-navy flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-blue" />
            ทริปที่เปิดอยู่
          </h2>
          <Link href="/trips" className="text-sm text-brand-blue hover:underline flex items-center gap-1">
            ดูทั้งหมด <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {trips && trips.length > 0 ? (
          <div className="space-y-3">
            {trips.map((trip: any) => (
              <Link key={trip.id} href={`/trips/${trip.id}`} className="card flex items-center justify-between hover:border-brand-blue/30 transition-colors group">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-brand-navy">{trip.origin_zone}</span>
                    <ArrowRight className="w-3 h-3 text-gray-400" />
                    <span className="text-sm font-semibold text-brand-navy">{trip.destination_zone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      ตัดรอบ {new Date(trip.cutoff_time).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span>{trip.current_orders}/{trip.max_orders} ออเดอร์</span>
                    <span>โดย {trip.profiles?.username}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-green-100 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">เปิดรับ</span>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-brand-blue transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card text-center py-8 text-gray-400">
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">ยังไม่มีทริปที่เปิดอยู่</p>
            <Link href="/trips/create" className="text-brand-blue text-sm hover:underline mt-1 inline-block">
              เปิดทริปแรกของคุณ →
            </Link>
          </div>
        )}
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-brand-navy flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-brand-cyan" />
            ออเดอร์ล่าสุดของฉัน
          </h2>
          <Link href="/orders" className="text-sm text-brand-blue hover:underline flex items-center gap-1">
            ดูทั้งหมด <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {orders && orders.length > 0 ? (
          <div className="space-y-3">
            {orders.map((order: any) => {
              const s = statusLabel[order.status] || { label: order.status, color: "bg-gray-100 text-gray-600" };
              return (
                <Link key={order.id} href={`/orders/${order.id}`} className="card flex items-center justify-between hover:border-brand-blue/30 transition-colors group">
                  <div>
                    <p className="text-sm font-semibold text-brand-navy mb-1">
                      {order.trips?.origin_zone} → {order.trips?.destination_zone}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleDateString("th-TH")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.color}`}>{s.label}</span>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-brand-blue transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="card text-center py-8 text-gray-400">
            <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">ยังไม่มีออเดอร์</p>
            <Link href="/trips" className="text-brand-blue text-sm hover:underline mt-1 inline-block">
              ค้นหาทริปเพื่อสั่งอาหาร →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
