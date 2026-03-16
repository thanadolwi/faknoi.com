import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, ArrowRight, Clock } from "lucide-react";
import DashboardChats from "@/components/DashboardChats";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const username = user?.user_metadata?.username || user?.email?.split("@")[0] || "ผู้ใช้";

  const { data: trips } = await supabase
    .from("trips").select("*, profiles(username)")
    .eq("status", "open").gt("cutoff_time", new Date().toISOString())
    .order("created_at", { ascending: false }).limit(3);

  const { data: orders } = await supabase
    .from("orders").select("*, trips(origin_zone, destination_zone)")
    .eq("buyer_id", user?.id)
    .order("created_at", { ascending: false }).limit(3);

  const { data: buyerActiveOrders } = await supabase
    .from("orders")
    .select("*, trips(origin_zone, destination_zone, shopper_id, profiles(username)), profiles(username)")
    .eq("buyer_id", user?.id).not("status", "in", '("completed","cancelled")')
    .order("created_at", { ascending: false });

  const { data: shopperTrips } = await supabase.from("trips").select("id").eq("shopper_id", user?.id);
  const shopperTripIds = (shopperTrips || []).map((t: any) => t.id);

  const { data: shopperActiveOrders } = shopperTripIds.length > 0
    ? await supabase.from("orders")
        .select("*, trips(origin_zone, destination_zone, shopper_id, profiles(username)), profiles(username)")
        .in("trip_id", shopperTripIds).not("status", "in", '("completed","cancelled")')
        .order("created_at", { ascending: false })
    : { data: [] };

  const allActiveOrders = [
    ...(buyerActiveOrders || []),
    ...(shopperActiveOrders || []).filter((o: any) => !(buyerActiveOrders || []).find((b: any) => b.id === o.id)),
  ];

  const statusLabel: Record<string, { label: string; color: string; emoji: string }> = {
    pending:    { label: "รอรับออเดอร์", color: "bg-yellow-100 text-yellow-700",  emoji: "⏳" },
    accepted:   { label: "รับแล้ว",      color: "bg-blue-100 text-blue-700",      emoji: "✅" },
    shopping:   { label: "กำลังซื้อ",    color: "bg-indigo-100 text-indigo-700",  emoji: "🛒" },
    bought:     { label: "ซื้อแล้ว",     color: "bg-cyan-100 text-cyan-700",      emoji: "📦" },
    delivering: { label: "กำลังส่ง",     color: "bg-purple-100 text-purple-700",  emoji: "🛵" },
    completed:  { label: "สำเร็จ",       color: "bg-green-100 text-green-700",    emoji: "🎉" },
    cancelled:  { label: "ยกเลิก",       color: "bg-red-100 text-red-700",        emoji: "❌" },
  };

  return (
    <div className="space-y-5">
      {/* Welcome Hero */}
      <div className="relative bg-brand-navy rounded-3xl p-6 text-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-blue/40 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-yellow/20 rounded-full translate-y-1/2 -translate-x-1/4 blur-xl" />
        </div>
        <div className="relative">
          <p className="text-white/60 text-sm font-medium mb-0.5">สวัสดี 👋</p>
          <h1 className="text-2xl font-black mb-5 tracking-tight">{username}</h1>
          <div className="flex flex-wrap gap-2.5">
            <Link href="/trips/create"
              className="flex items-center gap-2 bg-brand-yellow text-brand-navy text-sm font-black px-4 py-2.5 rounded-2xl hover:brightness-105 active:scale-95 transition-all duration-150 shadow-lg shadow-brand-yellow/20">
              <Plus className="w-4 h-4" /> เปิดทริปใหม่
            </Link>
            <Link href="/trips"
              className="flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white text-sm font-bold px-4 py-2.5 rounded-2xl hover:bg-white/25 active:scale-95 transition-all duration-150 border border-white/20">
              🛵 ดูทริปทั้งหมด
            </Link>
          </div>
        </div>
      </div>

      {/* Active Order Chats */}
      {allActiveOrders.length > 0 && (
        <DashboardChats orders={allActiveOrders} currentUserId={user?.id || ""} currentUsername={username} />
      )}

      {/* Open Trips */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-brand-navy flex items-center gap-2">
            🛵 ทริปที่เปิดอยู่
          </h2>
          <Link href="/trips" className="text-sm font-bold text-brand-blue hover:underline flex items-center gap-1">
            ดูทั้งหมด <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {trips && trips.length > 0 ? (
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
                    <span>โดย {trip.profiles?.username}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="pill bg-green-100 text-green-700">เปิดรับ</span>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-brand-blue transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card text-center py-10">
            <div className="text-4xl mb-3">🛵</div>
            <p className="text-sm text-gray-400 font-medium mb-3">ยังไม่มีทริปที่เปิดอยู่</p>
            <Link href="/trips/create" className="btn-primary text-sm py-2 px-5 inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> เปิดทริปแรก
            </Link>
          </div>
        )}
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-brand-navy">📋 ออเดอร์ล่าสุด</h2>
          <Link href="/orders" className="text-sm font-bold text-brand-blue hover:underline flex items-center gap-1">
            ดูทั้งหมด <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {orders && orders.length > 0 ? (
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
            <p className="text-sm text-gray-400 font-medium mb-3">ยังไม่มีออเดอร์</p>
            <Link href="/trips" className="text-brand-blue text-sm font-bold hover:underline">
              ค้นหาทริปเพื่อสั่งอาหาร →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
