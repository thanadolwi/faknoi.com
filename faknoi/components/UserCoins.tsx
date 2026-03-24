"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Coins, Gift, Clock, CheckCircle, Loader2, ArrowLeft, Mail, Phone, ExternalLink } from "lucide-react";

type CouponStatus = "open" | "paused" | "sold_out";

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
  status: CouponStatus;
  is_active: boolean;
  notice: string | null;
  image_url: string | null;
  max_redemptions: number | null;
}

interface Redemption {
  id: string;
  coupon_id: string;
  coins_spent: number;
  created_at: string;
  coupons: { name: string; image_url: string | null; company: string | null } | null;
}

type CouponTab = "active" | "used" | "expired";

interface Props {
  userId: string;
  initialCoins: number;
}

function getCouponStatus(c: Coupon, now: Date): CouponStatus {
  if (c.status === "sold_out") return "sold_out";
  if (!c.is_active || c.status === "paused") return "paused";
  if (c.valid_until && new Date(c.valid_until) < now) return "sold_out";
  return "open";
}

function StatusBadge({ status }: { status: CouponStatus }) {
  if (status === "open") return <span className="px-3 py-1 rounded-full border-2 border-green-400 text-green-700 text-xs font-black bg-green-50">เปิดอยู่</span>;
  if (status === "paused") return <span className="px-3 py-1 rounded-full border-2 border-yellow-400 text-yellow-700 text-xs font-black bg-yellow-50">ปิดปรับปรุงชั่วคราว</span>;
  return <span className="px-3 py-1 rounded-full border-2 border-red-400 text-red-700 text-xs font-black bg-red-50">หมดแล้ว</span>;
}

export default function UserCoins({ userId, initialCoins }: Props) {
  const [coins, setCoins] = useState(initialCoins);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [tab, setTab] = useState<CouponTab>("active");
  const [selected, setSelected] = useState<Coupon | null>(null);
  const [selectedRedemption, setSelectedRedemption] = useState<Redemption | null>(null);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [redeemMsg, setRedeemMsg] = useState<{ id: string; msg: string; ok: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    const supabase = createClient();
    const [couponsRes, redemptionsRes, profileRes] = await Promise.all([
      fetch("/api/admin/coupons"),
      supabase.from("coupon_redemptions").select("id, coupon_id, coins_spent, created_at, coupons(name, image_url, company)").eq("user_id", userId).order("created_at", { ascending: false }),
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

  const activeCoupons = coupons.filter((c) => getCouponStatus(c, now) === "open");
  const expiredCoupons = coupons.filter((c) => {
    const s = getCouponStatus(c, now);
    return s === "paused" || s === "sold_out";
  });

  const tabs: { key: CouponTab; label: string; count: number }[] = [
    { key: "active", label: "ใช้งานได้", count: activeCoupons.length },
    { key: "used", label: "ใช้แล้ว", count: redemptions.length },
    { key: "expired", label: "หมดอายุ/ปิด", count: expiredCoupons.length },
  ];

  if (loading) return <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-brand-blue animate-spin" /></div>;

  // Detail view — from used tab (redemption)
  if (selectedRedemption) {
    const coupon = coupons.find((c) => c.id === selectedRedemption.coupon_id);
    return (
      <div className="space-y-4">
        <button onClick={() => setSelectedRedemption(null)}
          className="flex items-center gap-2 text-sm text-brand-blue font-bold hover:underline">
          <ArrowLeft className="w-4 h-4" /> กลับ
        </button>
        <div className="card space-y-4">
          {(coupon?.image_url || selectedRedemption.coupons?.image_url) && (
            <img src={coupon?.image_url || selectedRedemption.coupons?.image_url || ""} alt="" className="w-full max-h-48 object-cover rounded-2xl" />
          )}
          <div className="text-center space-y-1">
            <h2 className="text-xl font-black text-brand-navy">{selectedRedemption.coupons?.name || "คูปอง"}</h2>
            {(coupon?.company || selectedRedemption.coupons?.company) && (
              <p className="text-sm text-gray-500">{coupon?.company || selectedRedemption.coupons?.company}</p>
            )}
            <div className="flex justify-center">
              <span className="px-3 py-1 rounded-full border-2 border-green-400 text-green-700 text-xs font-black bg-green-50">แลกแล้ว</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 bg-brand-blue/10 rounded-2xl py-3">
            <Coins className="w-5 h-5 text-brand-blue" />
            <span className="text-lg font-black text-brand-blue">-{selectedRedemption.coins_spent} Coins</span>
          </div>
          <p className="text-xs text-gray-400 text-center">แลกเมื่อ {new Date(selectedRedemption.created_at).toLocaleString("th-TH")}</p>
          {coupon && <CouponDetailBody coupon={coupon} now={now} />}
          <div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-50 border-2 border-green-200 text-green-700 font-black text-sm">
            <CheckCircle className="w-4 h-4" /> แลกแล้ว
          </div>
        </div>
      </div>
    );
  }

  // Detail view — from active/expired tab (coupon)
  if (selected) {
    const alreadyRedeemed = redeemedIds.has(selected.id);
    const canAfford = coins >= selected.coins_required;
    const couponStatus = getCouponStatus(selected, now);
    const notStarted = selected.valid_from && new Date(selected.valid_from) > now;
    const msg = redeemMsg?.id === selected.id ? redeemMsg : null;
    const canRedeem = couponStatus === "open" && !notStarted && !alreadyRedeemed && canAfford;

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
            <div className="flex justify-center"><StatusBadge status={couponStatus} /></div>
          </div>
          <div className="flex items-center justify-center gap-2 bg-brand-blue/10 rounded-2xl py-3">
            <Coins className="w-5 h-5 text-brand-blue" />
            <span className="text-lg font-black text-brand-blue">{selected.coins_required} Coins</span>
          </div>
          <CouponDetailBody coupon={selected} now={now} />
          {msg && (
            <p className={`text-xs font-bold px-3 py-2 rounded-xl border ${msg.ok ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-600 border-red-100"}`}>
              {msg.ok ? "✅" : "⚠️"} {msg.msg}
            </p>
          )}
          {alreadyRedeemed ? (
            <div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-50 border-2 border-green-200 text-green-700 font-black text-sm">
              <CheckCircle className="w-4 h-4" /> แลกแล้ว
            </div>
          ) : couponStatus === "sold_out" ? (
            <div className="py-3 rounded-2xl bg-red-50 border-2 border-red-200 text-red-600 font-black text-sm text-center">หมดแล้ว</div>
          ) : couponStatus === "paused" ? (
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
      <div className="card text-center py-6" style={{ background: "linear-gradient(135deg,#5478FF,#53CBF3)" }}>
        <div className="flex items-center justify-center gap-2 mb-1">
          <Coins className="w-6 h-6 text-white" />
          <p className="text-3xl font-black text-white">{coins}</p>
        </div>
        <p className="text-sm text-white/80 font-medium">คอยน์ของฉัน</p>
        <p className="text-xs text-white/60 mt-1">ราคาสุทธิ 50 บาท = 1 คอยน์ · รับหิ้ว 1 ออเดอร์ = +items คอยน์</p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Gift className="w-4 h-4 text-brand-blue" />
          <h2 className="font-black text-brand-navy text-sm">แลกคอยน์ / คูปองของฉัน</h2>
        </div>

        <div className="flex gap-1.5">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-2xl text-xs font-black border-2 transition-all ${tab === t.key ? "border-brand-blue text-white" : "border-gray-100 text-gray-500 bg-white"}`}
              style={tab === t.key ? { background: "linear-gradient(135deg,#5478FF,#53CBF3)" } : {}}>
              {t.label} ({t.count})
            </button>
          ))}
        </div>

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

        {tab === "used" && (
          <div className="space-y-2">
            {redemptions.length === 0 ? (
              <div className="card text-center py-8"><p className="text-3xl mb-2">📭</p><p className="text-sm text-gray-400">ยังไม่เคยแลกคูปอง</p></div>
            ) : redemptions.map((r) => (
              <button key={r.id} onClick={() => setSelectedRedemption(r)}
                className="w-full card flex items-center gap-3 text-left hover:border-brand-blue/30 hover:shadow-md transition-all active:scale-[0.99]">
                {r.coupons?.image_url
                  ? <img src={r.coupons.image_url} alt="" className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
                  : <div className="w-16 h-16 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0"><CheckCircle className="w-7 h-7 text-green-500" /></div>
                }
                <div className="flex-1 min-w-0">
                  <p className="font-black text-brand-navy text-base leading-tight truncate">{r.coupons?.name || "คูปอง"}</p>
                  {r.coupons?.company && <p className="text-sm text-gray-500 truncate">{r.coupons.company}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-green-600">แลกแล้ว</span>
                    <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString("th-TH")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-brand-blue flex-shrink-0">
                  <Coins className="w-3.5 h-3.5" />-{r.coins_spent}
                </div>
              </button>
            ))}
          </div>
        )}

        {tab === "expired" && (
          <div className="space-y-2">
            {expiredCoupons.length === 0 ? (
              <div className="card text-center py-8"><p className="text-3xl mb-2">✅</p><p className="text-sm text-gray-400">ไม่มีคูปองที่หมดอายุ</p></div>
            ) : expiredCoupons.map((c) => {
              const s = getCouponStatus(c, now);
              return (
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
                      <span className={`text-xs font-bold ${s === "sold_out" ? "text-red-500" : "text-yellow-600"}`}>
                        {s === "sold_out" ? "หมดแล้ว" : "ปิดปรับปรุง"}
                      </span>
                      <span className="text-xs text-gray-400">{c.coins_required} Coins</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function CouponDetailBody({ coupon, now }: { coupon: Coupon; now: Date }) {
  return (
    <>
      {(coupon.valid_from || coupon.valid_until) && (
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span>
            {coupon.valid_from && new Date(coupon.valid_from).toLocaleDateString("th-TH")}
            {coupon.valid_from && coupon.valid_until && " – "}
            {coupon.valid_until && new Date(coupon.valid_until).toLocaleDateString("th-TH")}
          </span>
        </div>
      )}
      {coupon.description && (
        <div className="space-y-1">
          <p className="text-xs font-black text-gray-500 uppercase tracking-wider">รายละเอียดและเงื่อนไข</p>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{coupon.description}</p>
        </div>
      )}
      {coupon.notice && (
        <p className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-xl border border-amber-200">📢 {coupon.notice}</p>
      )}
      {(coupon.contact_email || coupon.contact_phone || coupon.contact_line || coupon.contact_facebook || coupon.contact_instagram || coupon.contact_info) && (
        <div className="space-y-2">
          <p className="text-xs font-black text-gray-500 uppercase tracking-wider">ข้อมูลการติดต่อ</p>
          <div className="space-y-2">
            {coupon.contact_email && (
              <a href={`mailto:${coupon.contact_email}`} className="flex items-center gap-2 text-sm text-brand-blue hover:underline">
                <Mail className="w-4 h-4 flex-shrink-0" />{coupon.contact_email}
              </a>
            )}
            {coupon.contact_phone && (
              <a href={`tel:${coupon.contact_phone}`} className="flex items-center gap-2 text-sm text-brand-blue hover:underline">
                <Phone className="w-4 h-4 flex-shrink-0" />{coupon.contact_phone}
              </a>
            )}
            {coupon.contact_line && (
              <a href={`https://line.me/ti/p/${coupon.contact_line}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-green-600 hover:underline">
                <ExternalLink className="w-4 h-4 flex-shrink-0" />Line: {coupon.contact_line}
              </a>
            )}
            {coupon.contact_facebook && (
              <a href={coupon.contact_facebook.startsWith("http") ? coupon.contact_facebook : `https://facebook.com/${coupon.contact_facebook}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                <ExternalLink className="w-4 h-4 flex-shrink-0" />Facebook: {coupon.contact_facebook}
              </a>
            )}
            {coupon.contact_instagram && (
              <a href={`https://instagram.com/${coupon.contact_instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-pink-600 hover:underline">
                <ExternalLink className="w-4 h-4 flex-shrink-0" />Instagram: {coupon.contact_instagram}
              </a>
            )}
            {coupon.contact_info && !coupon.contact_email && !coupon.contact_phone && (
              <p className="text-sm text-gray-600">{coupon.contact_info}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
