import { createAdminClient, createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { coupon_id } = await req.json();
  const admin = createAdminClient();

  // Get coupon
  const { data: coupon, error: cErr } = await admin.from("coupons").select("*").eq("id", coupon_id).single();
  if (cErr || !coupon) return NextResponse.json({ error: "ไม่พบคูปอง" }, { status: 404 });
  if (!coupon.is_active || coupon.status === "paused") return NextResponse.json({ error: "คูปองนี้ปิดการใช้งานอยู่" }, { status: 400 });
  if (coupon.status === "sold_out") return NextResponse.json({ error: "คูปองหมดแล้ว" }, { status: 400 });

  const now = new Date();
  if (coupon.valid_from && new Date(coupon.valid_from) > now) return NextResponse.json({ error: "คูปองยังไม่เริ่มใช้งาน" }, { status: 400 });
  if (coupon.valid_until && new Date(coupon.valid_until) < now) return NextResponse.json({ error: "คูปองหมดอายุแล้ว" }, { status: 400 });

  // Check already redeemed
  const { data: existing } = await admin.from("coupon_redemptions").select("id").eq("user_id", user.id).eq("coupon_id", coupon_id).single();
  if (existing) return NextResponse.json({ error: "คุณแลกคูปองนี้ไปแล้ว" }, { status: 400 });

  // Check quota
  if (coupon.max_redemptions) {
    const { count } = await admin.from("coupon_redemptions").select("id", { count: "exact", head: true }).eq("coupon_id", coupon_id);
    if ((count ?? 0) >= coupon.max_redemptions) {
      await admin.from("coupons").update({ status: "sold_out", is_active: false }).eq("id", coupon_id);
      return NextResponse.json({ error: "คูปองหมดแล้ว" }, { status: 400 });
    }
  }

  // Get user coins
  const { data: profile } = await admin.from("profiles").select("coins").eq("id", user.id).single();
  const currentCoins = Number(profile?.coins || 0);
  if (currentCoins < coupon.coins_required) return NextResponse.json({ error: `คอยน์ไม่พอ (มี ${currentCoins} ต้องการ ${coupon.coins_required})` }, { status: 400 });

  // Deduct coins and record redemption
  const { error: updateErr } = await admin.from("profiles").update({ coins: currentCoins - coupon.coins_required }).eq("id", user.id);
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  const { error: redeemErr } = await admin.from("coupon_redemptions").insert({
    user_id: user.id,
    coupon_id,
    coins_spent: coupon.coins_required,
  });
  if (redeemErr) return NextResponse.json({ error: redeemErr.message }, { status: 500 });

  // Check if quota reached after this redemption → auto sold_out
  if (coupon.max_redemptions) {
    const { count: newCount } = await admin.from("coupon_redemptions").select("id", { count: "exact", head: true }).eq("coupon_id", coupon_id);
    if ((newCount ?? 0) >= coupon.max_redemptions) {
      await admin.from("coupons").update({ status: "sold_out", is_active: false }).eq("id", coupon_id);
    }
  }

  return NextResponse.json({ ok: true, remaining_coins: currentCoins - coupon.coins_required });
}
