import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Clock, Users, ArrowRight, Plus } from "lucide-react";
import TripStatusActions from "./TripStatusActions";
import CountdownTimer from "@/components/CountdownTimer";
import EditTripForm from "@/components/EditTripForm";

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: trip } = await supabase
    .from("trips")
    .select("*, profiles(username)")
    .eq("id", id)
    .single();

  if (!trip) notFound();

  const { data: orders } = await supabase
    .from("orders")
    .select("*, profiles(username)")
    .eq("trip_id", id)
    .order("created_at", { ascending: true });

  const isShopper = trip.shopper_id === user?.id;

  const statusColor: Record<string, string> = {
    open: "bg-green-100 text-green-700",
    shopping: "bg-blue-100 text-blue-700",
    delivering: "bg-purple-100 text-purple-700",
    completed: "bg-gray-100 text-gray-600",
    cancelled: "bg-red-100 text-red-600",
  };

  const statusLabel: Record<string, string> = {
    open: "เปิดรับออเดอร์",
    shopping: "กำลังซื้อ",
    delivering: "กำลังส่ง",
    completed: "เสร็จสิ้น",
    cancelled: "ยกเลิก",
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/trips" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <h1 className="text-xl font-bold text-brand-navy">รายละเอียดทริป</h1>
      </div>

      {/* Trip Info */}
      <div className="card space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-brand-navy text-lg">{trip.origin_zone}</span>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <span className="font-bold text-brand-navy text-lg">{trip.destination_zone}</span>
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor[trip.status]}`}>
            {statusLabel[trip.status]}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <Clock className="w-4 h-4 text-brand-blue mx-auto mb-1" />
            <p className="text-xs text-gray-400">ตัดรอบ</p>
            <p className="text-sm font-semibold text-brand-navy">
              {new Date(trip.cutoff_time).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <Users className="w-4 h-4 text-brand-cyan mx-auto mb-1" />
            <p className="text-xs text-gray-400">ออเดอร์</p>
            <p className="text-sm font-semibold text-brand-navy">{trip.current_orders}/{trip.max_orders}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <MapPin className="w-4 h-4 text-brand-yellow mx-auto mb-1" />
            <p className="text-xs text-gray-400">ผู้รับหิ้ว</p>
            <p className="text-sm font-semibold text-brand-navy truncate">{trip.profiles?.username}</p>
          </div>
        </div>

        {trip.note && (
          <div className="bg-brand-yellow/10 border border-brand-yellow/30 rounded-xl px-4 py-3 text-sm text-gray-600">
            📝 {trip.note}
          </div>
        )}

        {/* Countdown timer */}
        {(trip.status === "open" || trip.status === "shopping") && (
          <CountdownTimer cutoffTime={trip.cutoff_time} />
        )}

        {/* Shopper: edit trip + status actions */}
        {isShopper && (
          <div className="space-y-3">
            {trip.status === "open" && (
              <EditTripForm
                tripId={trip.id}
                cutoffTime={trip.cutoff_time}
                maxOrders={trip.max_orders}
                currentOrders={trip.current_orders}
                note={trip.note}
              />
            )}
            <TripStatusActions tripId={trip.id} currentStatus={trip.status} />
          </div>
        )}

        {/* Buyer: place order */}
        {!isShopper && trip.status === "open" && trip.current_orders < trip.max_orders && (
          <Link href={`/orders/create?trip_id=${trip.id}`} className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            สั่งออเดอร์ในทริปนี้
          </Link>
        )}
      </div>

      {/* Orders in this trip */}
      {isShopper && orders && orders.length > 0 && (
        <div>
          <h2 className="font-bold text-brand-navy mb-3">ออเดอร์ในทริปนี้ ({orders.length})</h2>
          <div className="space-y-3">
            {orders.map((order: any) => (
              <Link key={order.id} href={`/orders/${order.id}`} className="card flex items-center justify-between hover:border-brand-blue/30 transition-colors group">
                <div>
                  <p className="text-sm font-semibold text-brand-navy">{order.profiles?.username}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {Array.isArray(order.items) ? order.items.length : 0} รายการ
                    {order.final_price ? ` · ฿${order.final_price}` : order.estimated_price ? ` · ~฿${order.estimated_price}` : ""}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-brand-blue transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
