import { createAdminClient, createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return null;
  return user;
}

// GET /api/admin/users?q=username
export async function GET(req: Request) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const userId = searchParams.get("userId");

  const adminClient = createAdminClient();

  if (userId) {
    // Get full user data
    const [
      { data: profile },
      { data: trips },
      { data: orders },
      { data: actions },
      { data: redemptions },
      { data: reports },
      { data: slips },
    ] = await Promise.all([
      adminClient.from("profiles").select("*").eq("id", userId).single(),
      adminClient.from("trips").select("*").eq("shopper_id", userId).order("created_at", { ascending: false }),
      adminClient.from("orders").select("*, trips(origin_zone, destination_zone)").eq("buyer_id", userId).order("created_at", { ascending: false }),
      adminClient.from("admin_actions").select("*").eq("target_user_id", userId).order("created_at", { ascending: false }),
      adminClient.from("coupon_redemptions").select("*, coupons(name, coins_required)").eq("user_id", userId).order("created_at", { ascending: false }),
      adminClient.from("reports").select("id, subject, report_status, created_at").eq("reporter_id", userId).order("created_at", { ascending: false }),
      adminClient.from("payment_slips").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    ]);
    return NextResponse.json({ profile, trips: trips || [], orders: orders || [], actions: actions || [], redemptions: redemptions || [], reports: reports || [], slips: slips || [] });
  }

  if (!q) return NextResponse.json({ users: [] });

  const { data: users } = await adminClient
    .from("profiles")
    .select("id, username, email, role, created_at, outstanding_balance")
    .ilike("username", `%${q}%`)
    .limit(10);

  return NextResponse.json({ users: users || [] });
}

// POST /api/admin/users — perform admin action
export async function POST(req: Request) {
  const adminUser = await checkAdmin();
  if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { action, targetUserId, tripId, orderId, note, coins } = body;
  const adminClient = createAdminClient();

  if (action === "cancel_trip" && tripId) {
    await adminClient.from("trips").update({ status: "cancelled" }).eq("id", tripId);
  } else if (action === "delete_trip" && tripId) {
    await adminClient.from("trips").delete().eq("id", tripId);
  } else if (action === "cancel_order" && orderId) {
    await adminClient.from("orders").update({ status: "cancelled" }).eq("id", orderId);
    // decrement trip orders
    const { data: order } = await adminClient.from("orders").select("trip_id").eq("id", orderId).single();
    if (order?.trip_id) {
      await adminClient.rpc("decrement_trip_orders", { trip_id: order.trip_id });
    }
  } else if (action === "adjust_coins" && targetUserId) {
    const val = typeof coins === "number" ? coins : parseInt(coins ?? "0");
    await adminClient.from("profiles").update({ coins: Math.max(0, val) }).eq("id", targetUserId);
  } else if (action === "adjust_balance" && targetUserId) {
    const val = typeof body.balance === "number" ? body.balance : parseFloat(body.balance ?? "0");
    await adminClient.from("profiles").update({ outstanding_balance: Math.max(0, val) }).eq("id", targetUserId);
  }

  // Log admin action + notify user
  if (targetUserId) {
    await adminClient.from("admin_actions").insert({
      target_user_id: targetUserId,
      action_type: action,
      note: note || null,
      admin_id: adminUser.id,
    });
  }

  return NextResponse.json({ ok: true });
}
