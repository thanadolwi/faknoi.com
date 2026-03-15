import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import OrderTabs from "./OrderTabs";

const statusLabel: Record<string, { label: string; color: string }> = {
  pending:    { label: "รอรับออเดอร์", color: "bg-yellow-100 text-yellow-700" },
  accepted:   { label: "รับแล้ว",      color: "bg-blue-100 text-blue-700" },
  bought:     { label: "ซื้อแล้ว",     color: "bg-cyan-100 text-cyan-700" },
  delivering: { label: "กำลังส่ง",     color: "bg-purple-100 text-purple-700" },
  completed:  { label: "สำเร็จ",       color: "bg-green-100 text-green-700" },
  cancelled:  { label: "ยกเลิก",       color: "bg-red-100 text-red-600" },
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // ออเดอร์ที่ตัวเองสั่ง
  const { data: myOrders } = await supabase
    .from("orders")
    .select("*, trips(origin_zone, destination_zone, shopper_id, profiles(username))")
    .eq("buyer_id", user?.id)
    .order("created_at", { ascending: false });

  // ออเดอร์ที่คนมาฝากหิ้ว (ทริปที่ตัวเองเป็น shopper)
  // หา trip ids ที่ตัวเองเป็น shopper ก่อน
  const { data: myTrips } = await supabase
    .from("trips")
    .select("id")
    .eq("shopper_id", user?.id);

  const myTripIds = (myTrips || []).map((t: { id: string }) => t.id);

  const { data: shopperOrders } = myTripIds.length > 0
    ? await supabase
        .from("orders")
        .select("*, trips(origin_zone, destination_zone), profiles(username)")
        .in("trip_id", myTripIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-brand-navy">ออเดอร์</h1>
        <p className="text-sm text-gray-400 mt-0.5">ติดตามสถานะออเดอร์ทั้งหมด</p>
      </div>

      <OrderTabs
        myOrders={myOrders || []}
        shopperOrders={shopperOrders || []}
        statusLabel={statusLabel}
      />
    </div>
  );
}
