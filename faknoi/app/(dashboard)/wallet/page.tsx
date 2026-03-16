import { createClient } from "@/lib/supabase/server";
import { Wallet, TrendingUp, AlertCircle } from "lucide-react";

export default async function WalletPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // ดึง wallet transactions ของ shopper นี้
  const { data: txns } = await supabase
    .from("wallet_transactions")
    .select("*, orders(id, trips(origin_zone, destination_zone))")
    .eq("shopper_id", user?.id)
    .order("created_at", { ascending: false });

  const totalActual = (txns || []).reduce((s, t) => s + Number(t.actual_price), 0);
  const totalFee    = (txns || []).reduce((s, t) => s + Number(t.platform_fee), 0);

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

      {/* Transaction list */}
      <div>
        <h2 className="font-black text-brand-navy mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-brand-blue" />
          รายการออเดอร์
        </h2>
        {txns && txns.length > 0 ? (
          <div className="space-y-2.5">
            {txns.map((t: any) => (
              <div key={t.id} className="card flex items-center justify-between">
                <div>
                  <p className="font-black text-brand-navy text-sm">
                    {t.orders?.trips?.origin_zone} → {t.orders?.trips?.destination_zone}
                  </p>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">
                    {new Date(t.created_at).toLocaleDateString("th-TH")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-black text-brand-navy">฿{Number(t.actual_price).toFixed(2)}</p>
                  <p className="text-xs text-brand-blue font-bold">ค่าบริการ ฿{Number(t.platform_fee).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <div className="text-4xl mb-3">💰</div>
            <p className="text-sm text-gray-400 font-medium">ยังไม่มีรายการ</p>
            <p className="text-xs text-gray-300 mt-1">รายการจะปรากฏหลังส่งออเดอร์สำเร็จ</p>
          </div>
        )}
      </div>
    </div>
  );
}
