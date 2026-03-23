"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Coins, Gift, Clock, CheckCircle, XCircle, Loader2, ChevronDown } from "lucide-react";

interface Coupon {
  id: string;
  name: string;
  description: string;
  coins_required: number;
  valid_from: string | null;
  valid_until: string | null;
  contact_info: string | null;
  is_active: boolean;
  notice: string | null;
  image_url: string | null;
}

interface Redemption {
  id: string;
  coupon_id: string;
  coins_spent: number;
  created_at: string;
  coupons: { name: string } | null;
}

type CouponTab = "active" | "used" | "expired";

interface Props {
  userId: string;
  initialCoins: number;
}

export default function UserCoins({ userId, initialCoins }: Props) {
  const [coins, setCoins] = useState(initialCoins);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [tab, setTab] = useState<CouponTab>("active");
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [redeemMsg, setRedeemMsg] = useState<{ id: string; msg: string; ok: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    const supabase = createClient();
    const [couponsRes, redemptionsRes, profileRes] = await Promise.all([
      fetch("/api/admin/coupons"),
      supabase.from("coupon_redemptions").select("id, coupon_id, coins_spent, created_at, coupons(name)").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("profiles").select("coins").eq("id", userId).single(),
    ]);
    const couponsJson = await couponsRes.json();
    setCoupons(couponsJson.coupons || []);
    setRedemptions((redemptionsRes.data || []) as unknown as Redemption[]);
    if (profileRes.data) setCoins(Number(profileRes.data.coins || 0));
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    const supabase = createClient();
    // Realtime: coupons changes
    const channel = supabase
      .channel(`user-coins-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "coupons" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles", filter: `id=eq.${userId}` }, (payload) => {
        if ((payload.new as any)?.coins !== undefined) setCoins(Number((payload.new as any).coins));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "coupon_redemptions", filter: `user_id=eq.${userId}` }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function redeem(couponId: string) {
    setRedeeming(couponId);
    setRedeemMsg(null);
    const res = await fetch("/api/coupons/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coupon_id: couponId }),
    });
    const json = await res.json();
    if (res.ok) {
      setCoins(json.remaining_coins);
      setRedeemMsg({ id: couponId, msg: "แลกคูปองสำเร็จ!", ok: true });
      await loadData();
    } else {
      setRedeemMsg({ id: couponId, msg: json.error || "เกิดข้อผิดพลาด", ok: false });
    }
    setRedeeming(null);
  }

  const now = new Date();
  const redeemedIds = new Set(redemptions.map((r) => r.coupon_id));

  const activeCoupons = coupons.filter((c) => {
    if (!c.is_active) return false;
    if (c.valid_until && new Date(c.valid_until) < now) return false;
    if (c.valid_from && new Date(c.valid_from) > now) return false;
    return true;
  });

  const usedCoupons = redemptions;

  const expiredCoupons = coupons.filter((c) => {
    if (c.is_active && (!c.valid_until || new Date(c.valid_until) >= now)) return false;
    return true;
  });

  const tabs: { key: CouponTab; label: string; count: number }[] = [
    { key: "active", label: "ใช้งานได้", count: activeCoupons.length },
    { key: "used", label: "ใช้แล้ว", count: usedCoupons.length },
    { key: "expired", label: "หมดอายุ/ปิด", count: expiredCoupons.length },
  ];

  if (loading) return (
    <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-brand-blue animate-spin" /></div>
  );

  return (
    <div className="space-y-4">
      {/* Coins card */}
      <div className="card text-center py-6" style={{ background: "linear-gradient(135deg,#5478FF,#53CBF3)" }}>
        <div className="flex items-center justify-center gap-2 mb-1">
          <Coins className="w-6 h-6 text-white" />
          <p className="text-3xl font-black text-white">{coins}</p>
        </div>
        <p className="text-sm text-white/80 font-medium">คอยน์ของฉัน</p>
        <p className="text-xs text-white/60 mt-1">ราคาสุทธิ 50 บาท = 1 คอยน์ · รับหิ้ว 1 ออเดอร์ = +1 คอยน์</p>
      </div>

      {/* Coupon section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Gift className="w-4 h-4 text-brand-blue" />
          <h2 className="font-black text-brand-navy text-sm">แลกคอยน์ / คูปองของฉัน</h2>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-2xl text-xs font-black border-2 transition-all ${tab === t.key ? "border-brand-blue text-white" : "border-gray-100 text-gray-500 bg-white"}`}
              style={tab === t.key ? { background: "linear-gradient(135deg,#5478FF,#53CBF3)" } : {}}>
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {/* Active coupons */}
        {tab === "active" && (
          <div className="space-y-3">
            {activeCoupons.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-3xl mb-2">🎟️</p>
                <p className="text-sm text-gray-400">ยังไม่มีคูปองที่ใช้งานได้</p>
              </div>
            ) : activeCoupons.map((c) => {
              const alreadyRedeemed = redeemedIds.has(c.id);
              const canAfford = coins >= c.coins_required;
              const msg = redeemMsg?.id === c.id ? redeemMsg : null;
              return (
                <div key={c.id} className="card space-y-2">
                  {c.image_url && <img src={c.image_url} alt={c.name} className="w-full max-h-32 object-cover rounded-xl" />}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-brand-navy">{c.name}</p>
                      {c.description && <p className="text-xs text-gray-500 mt-0.5">{c.description}</p>}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 bg-brand-blue/10 px-2.5 py-1 rounded-xl">
                      <Coins className="w-3.5 h-3.5 text-brand-blue" />
                      <span className="text-sm font-black text-brand-blue">{c.coins_required}</span>
                    </div>
                  </div>
                  {(c.valid_from || c.valid_until) && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {c.valid_from && `${new Date(c.valid_from).toLocaleDateString("th-TH")}`}
                      {c.valid_from && c.valid_until && " – "}
                      {c.valid_until && `${new Date(c.valid_until).toLocaleDateString("th-TH")}`}
                    </div>
                  )}
                  {c.contact_info && <p className="text-xs text-gray-500">📞 {c.contact_info}</p>}
                  {c.notice && (
                    <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-xl border border-amber-100">
                      📢 {c.notice}
                    </p>
                  )}
                  {msg && (
                    <p className={`text-xs font-bold px-3 py-2 rounded-xl border ${msg.ok ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-600 border-red-100"}`}>
                      {msg.ok ? "✅" : "⚠️"} {msg.msg}
                    </p>
                  )}
                  {alreadyRedeemed ? (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 px-3 py-2 rounded-xl border border-green-100">
                      <CheckCircle className="w-3.5 h-3.5" />แลกแล้ว
                    </div>
                  ) : (
                    <button onClick={() => redeem(c.id)} disabled={!canAfford || redeeming === c.id}
                      className={`w-full py-2.5 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-2 ${canAfford ? "btn-primary" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
                      {redeeming === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
                      {canAfford ? `แลก ${c.coins_required} คอยน์` : `คอยน์ไม่พอ (มี ${coins})`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Used coupons */}
        {tab === "used" && (
          <div className="space-y-2">
            {usedCoupons.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-3xl mb-2">📭</p>
                <p className="text-sm text-gray-400">ยังไม่เคยแลกคูปอง</p>
              </div>
            ) : usedCoupons.map((r) => (
              <div key={r.id} className="card flex items-center justify-between">
                <div>
                  <p className="font-black text-brand-navy text-sm">{r.coupons?.name || "คูปอง"}</p>
                  <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString("th-TH")}</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-brand-blue">
                  <Coins className="w-3.5 h-3.5" />-{r.coins_spent}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Expired/inactive coupons */}
        {tab === "expired" && (
          <div className="space-y-2">
            {expiredCoupons.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-3xl mb-2">✅</p>
                <p className="text-sm text-gray-400">ไม่มีคูปองที่หมดอายุ</p>
              </div>
            ) : expiredCoupons.map((c) => (
              <div key={c.id} className="card opacity-60 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-black text-brand-navy text-sm">{c.name}</p>
                  <span className="text-xs text-red-500 font-bold">
                    {!c.is_active ? "ปิดการใช้งาน" : "หมดอายุ"}
                  </span>
                </div>
                {c.notice && <p className="text-xs text-amber-600">📢 {c.notice}</p>}
                <p className="text-xs text-gray-400">{c.coins_required} คอยน์</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
