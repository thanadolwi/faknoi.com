import { createClient } from "@/lib/supabase/server";
import { TrendingUp, AlertCircle } from "lucide-react";

export default async function WalletPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // หา trip ids ที่ตัวเองเป็น shopper
  const { data: myTrips } = await supabase
    .from("trips")
    .select("id")
    .eq("shopper_id", user?.id);

  const tripIds = (myTrips || []).map((t: any) => t.id);

  // ดึง completed orders ที่มี final_price
  const { data: orders } = tripIds.length > 0
    ? await supabase
        .from("orders")
        .select("id, final_price, created_at, trips(origin_zone, destination_zone)")
        .in("trip_id", tripIds)
        .eq("status", "completed")
        .not("final_price", "is", null)
        .order("created_at", { ascending: false })
    : { data: [] };

  const totalActual = (orders || []).reduce((s, o: any) => s + Number(o.final_price), 0);
  const totalFee    = Math.round(totalActual * 0.05 * 100) / 100;

  return (
    <div className="max-w-lg mx-auto space-y-5 pb-10">
      <div>
        <h1 className="text-xl font-black text-brand-navy">💰 ถุงเงิน</h1>
        <p className="text-sm text-gray-400 mt-0.5">สรุปยอดราคาสุทธิและค่าบริการ FakNoi</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card text-center py-5">
          <p className="text-xs text-gray-400 font-medium mb-1">ยอดรวมราคาสุทธิ</p>
          <p className="text-2xl font-black text-brand-navy">฿{totalActual.toFixed(2)}</p>
          <p className="text-xs text-gray-300 mt-1">{(orders || []).length} ออเดอร์</p>
        </div>
        <div className="card text-center py-5" style={{background:"linear-gradient(135deg,#5478FF,#53CBF3)"}}>
          <p className="text-xs text-white/70 font-medium mb-1">ค้างชำระ FakNoi (5%)</p>
          <p className="text-2xl font-black text-white">฿{totalFee.toFixed(2)}</p>
        </div>
      </div>

      {/* Payment info */}
      <div className="card border-2 border-brand-yellow/40 bg-brand-yellow/5">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-black text-brand-navy text-sm mb-1">ช่องทางชำระค่าบริการ FakNoi</p>
            <p className="text-sm text-gray-600 font-medium">PromptPay: <span className="font-black text-brand-navy">0812345678</span></p>
            <p className="text-xs text-gray-400 mt-1">ชื่อบัญชี: FakNoi Platform · โอนทุกสิ้นเดือน</p>
          </div>
        </div>
      </div>

      {/* Order list */}
      <div>
        <h2 className="font-black text-brand-navy mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-brand-blue" />
          รายการออเดอร์ที่ส่งสำเร็จ
        </h2>
        {orders && orders.length > 0 ? (
          <div className="space-y-2.5">
            {orders.map((o: any) => (
              <div key={o.id} className="card flex items-center justify-between">
                <div>
                  <p className="font-black text-brand-navy text-sm">
                    {o.trips?.origin_zone} → {o.trips?.destination_zone}
                  </p>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">
                    {new Date(o.created_at).toLocaleDateString("th-TH")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-black text-brand-navy">฿{Number(o.final_price).toFixed(2)}</p>
                  <p className="text-xs text-brand-blue font-bold">
                    ค่าบริการ ฿{(Number(o.final_price) * 0.05).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <div className="text-4xl mb-3">💰</div>
            <p className="text-sm text-gray-400 font-medium">ยังไม่มีรายการ</p>
            <p className="text-xs text-gray-300 mt-1">รายการจะปรากฏหลังส่งออเดอร์สำเร็จและมีการระบุราคาสุทธิ</p>
          </div>
        )}
      </div>
    </div>
  );
}
