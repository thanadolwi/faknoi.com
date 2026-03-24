"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Coins, Gift, Clock, CheckCircle, Loader2, ArrowLeft, Mail, Phone, ExternalLink } from "lucide-react";

interface Coupon {
  id: string;
  name: string;
  description: string;
  company: string | null;
  coins_required: number;
  valid_from: string | null;
  valid_until: string | null;
  contact_info: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_line: string | null;
  contact_facebook: string | null;
  contact_instagram: string | null;
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
  const [selected, setSelected] = useState<Coupon | null>(null);
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

  if (loading) return <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-brand-blue animate-spin" /></div>;

  // Detail view
  if (selected) {
    const alreadyRedeemed = redeemedIds.has(selected.id);
    const canAfford = coins >= selected.coins_required;
    const isExpired = selected.valid_until && new Date(selected.valid_until) < now;
    const notStarted = selected.valid_from && new Date(selected.valid_from) > now;
    const msg = redeemMsg?.id === selected.id ? redeemMsg : null;

    let statusEl: React.ReactNode;
    if (!selected.is_active) {
      statusEl = <span className="px-3 py-1 rounded-full border-2 border-yellow-400 text-yellow-700 text-xs font-black bg-yellow-50">ปิดปรับปรุงชั่วคราว</span>;
    } else if (isExpired) {
      statusEl = <span className="px-3 py-1 rounded-full border-2 border-red-400 text-red-700 text-xs font-black bg-red-50">หมดแล้ว</span>;
    } else {
      statusEl = <span className="px-3 py-1 rounded-full border-2 border-green-400 text-green-700 text-xs font-black bg-green-50">เปิดอยู่</span>;
    }

    const canRedeem = selected.is_active && !isExpired && !notStarted && !alreadyRedeemed && canAfford;

    return (
      <div className="space-y-4">
        <button onClick={() => { setSelected(null); setRedeemMsg(null); }}
          className="flex items-center gap-2 text-sm text-brand-blue font-bold hover:underline">
          <ArrowLeft className="w-4 h-4" /> กลับ
        </button>

        <div className="card space-y-4">
          {selected.image_url && (
            <img src={selected.image_url} alt={selected.name} className="w-full max-h-48 object-cover rounded-2xl" />
          )}
          <div className="text-center space-y-1">
            <h2 className="text-xl font-black text-brand-navy">{selected.name}</h2>
            {selected.company && <p className="text-sm text-gray-500">{selected.company}</p>}
            <div className="flex justify-center">{statusEl}</div>
          </div>

          <div className="flex items-center justify-center gap-2 bg-brand-blue/10 rounded-2xl py-3">
            <Coins className="w-5 h-5 text-brand-blue" />
            <span className="text-lg font-black text-brand-blue">{selected.coins_required} Coins</span>
          </div>

          {(selected.valid_from || selected.valid_until) && (
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span>
                {selected.valid_from && `${new Date(selected.valid_from).toLocaleDateString("th-TH")}`}
                {selected.valid_from && selected.valid_until && " – "}
                {selected.valid_until && `${new Date(selected.valid_until).toLocaleDateString("th-TH")}`}
              </span>
            </div>
          )}

          {selected.description && (
            <div className="space-y-1">
              <p className="text-xs font-black text-gray-500 uppercase tracking-wider">รายละเอียดและเงื่อนไข</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selected.description}</p>
            </div>
          )}

          {selected.notice && (
            <p className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-xl border border-amber-200">📢 {selected.notice}</p>
          )}

          {/* Contact info */}
          {(selected.contact_email || selected.contact_phone || selected.contact_line || selected.contact_facebook || selected.contact_instagram || selected.contact_info) && (
            <div className="space-y-2">
              <p className="text-xs font-black text-gray-500 uppercase tracking-wider">ข้อมูลการติดต่อ</p>
              <div className="space-y-2">
                {selected.contact_email && (
                  <a href={`mailto:${selected.contact_email}`} className="flex items-center gap-2 text-sm text-brand-blue hover:underline">
                    <Mail className="w-4 h-4 flex-shrink-0" />{selected.contact_email}
                  </a>
                )}
                {selected.contact_phone && (
                  <a href={`tel:${selected.contact_phone}`} className="flex items-center gap-2 text-sm text-brand-blue hover:underline">
                    <Phone className="w-4 h-4 flex-shrink-0" />{selected.contact_phone}
                  </a>
                )}
                {selected.contact_line && (
                  <a href={`https://line.me/ti/p/${selected.contact_line}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-green-600 hover:underline">
                    <ExternalLink className="w-4 h-4 flex-shrink-0" />Line: {selected.contact_line}
                  </a>
                )}
                {selected.contact_facebook && (
                  <a href={selected.contact_facebook.startsWith("http") ? selected.contact_facebook : `https://facebook.com/${selected.contact_facebook}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                    <ExternalLink className="w-4 h-4 flex-shrink-0" />Facebook: {selected.contact_facebook}
                  </a>
                )}
                {selected.contact_instagram && (
                  <a href={`https://instagram.com/${selected.contact_instagram.replace("@","")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-pink-600 hover:underline">
                    <ExternalLink className="w-4 h-4 flex-shrink-0" />Instagram: {selected.contact_instagram}
                  </a>
                )}
                {selected.contact_info && !selected.contact_email && !selected.contact_phone && (
                  <p className="text-sm text-gray-600">{selected.contact_info}</p>
                )}
              </div>
            </div>
          )}

          {msg && (
            <p className={`text-xs font-bold px-3 py-2 rounded-xl border ${msg.ok ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-600 border-red-100"}`}>
              {msg.ok ? "✅" : "⚠️"} {msg.msg}
            </p>
          )}

          {/* Action button */}
          {alreadyRedeemed ? (
            <div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-50 border-2 border-green-200 text-green-700 font-black text-sm">
              <CheckCircle className="w-4 h-4" /> แลกแล้ว
            </div>
          ) : isExpired ? (
            <div className="py-3 rounded-2xl bg-red-50 border-2 border-red-200 text-red-600 font-black text-sm text-center">หมดอายุ</div>
          ) : !selected.is_active ? (
            <div className="py-3 rounded-2xl bg-yellow-50 border-2 border-yellow-200 text-yellow-700 font-black text-sm text-center">ปิดปรับปรุงชั่วคราว</div>
          ) : (
            <button onClick={() => redeem(selected.id)} disabled={!canRedeem || redeeming === selected.id}
              className={`w-full py-3 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-2 ${canRedeem ? "btn-primary" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
              {redeeming === selected.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
              {canRedeem ? `แลก ${selected.coins_required} Coins` : `Coins ไม่พอ (มี ${coins})`}
            </button>
          )}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-4">
      {/* Coins card */}
      <div className="card text-center py-6" style={{ background: "linear-gradient(135deg,#5478FF,#53CBF3)" }}>
        <div className="flex items-center justify-center gap-2 mb-1">
          <Coins className="w-6 h-6 text-white" />
          <p className="text-3xl font-black text-white">{coins}</p>
        </div>
        <p className="text-sm text-white/80 font-medium">คอยน์ของฉัน</p>
        <p className="text-xs text-white/60 mt-1">ราคาสุทธิ 50 บาท = 1 คอยน์ · รับหิ้ว 1 ออเดอร์ = +items คอยน์</p>
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

        {/* Active coupons — card grid */}
        {tab === "active" && (
          <div className="space-y-3">
            {activeCoupons.length === 0 ? (
              <div className="card text-center py-8"><p className="text-3xl mb-2">🎟️</p><p className="text-sm text-gray-400">ยังไม่มีคูปองที่ใช้งานได้</p></div>
            ) : activeCoupons.map((c) => (
              <button key={c.id} onClick={() => { setSelected(c); setRedeemMsg(null); }}
                className="w-full card flex items-center gap-3 text-left hover:border-brand-blue/30 hover:shadow-md transition-all active:scale-[0.99]">
                {c.image_url
                  ? <img src={c.image_url} alt={c.name} className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
                  : <div className="w-16 h-16 rounded-xl bg-brand-blue/10 flex items-center justify-center flex-shrink-0"><Gift className="w-7 h-7 text-brand-blue" /></div>
                }
                <div className="flex-1 min-w-0">
                  <p className="font-black text-brand-navy text-base leading-tight truncate">{c.name}</p>
                  {c.company && <p className="text-sm text-gray-500 truncate">{c.company}</p>}
                  <div className="flex items-center gap-1 mt-1">
                    <Coins className="w-3.5 h-3.5 text-brand-blue" />
                    <span className="text-sm font-bold text-brand-blue">{c.coins_required} Coins</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Used coupons */}
        {tab === "used" && (
          <div className="space-y-2">
            {usedCoupons.length === 0 ? (
              <div className="card text-center py-8"><p className="text-3xl mb-2">📭</p><p className="text-sm text-gray-400">ยังไม่เคยแลกคูปอง</p></div>
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

        {/* Expired coupons */}
        {tab === "expired" && (
          <div className="space-y-2">
            {expiredCoupons.length === 0 ? (
              <div className="card text-center py-8"><p className="text-3xl mb-2">✅</p><p className="text-sm text-gray-400">ไม่มีคูปองที่หมดอายุ</p></div>
            ) : expiredCoupons.map((c) => (
              <button key={c.id} onClick={() => { setSelected(c); setRedeemMsg(null); }}
                className="w-full card flex items-center gap-3 text-left opacity-60 hover:opacity-80 transition-opacity">
                {c.image_url
                  ? <img src={c.image_url} alt={c.name} className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
                  : <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0"><Gift className="w-7 h-7 text-gray-400" /></div>
                }
                <div className="flex-1 min-w-0">
                  <p className="font-black text-brand-navy text-base leading-tight truncate">{c.name}</p>
                  {c.company && <p className="text-sm text-gray-500 truncate">{c.company}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-red-500">{!c.is_active ? "ปิดการใช้งาน" : "หมดอายุ"}</span>
                    <span className="text-xs text-gray-400">{c.coins_required} Coins</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
