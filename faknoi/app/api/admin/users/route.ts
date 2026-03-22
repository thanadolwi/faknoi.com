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
    ] = await Promise.all([
      adminClient.from("profiles").select("*").eq("id", userId).single(),
      adminClient.from("trips").select("*").eq("shopper_id", userId).order("created_at", { ascending: false }),
      adminClient.from("orders").select("*, trips(origin_zone, destination_zone)").eq("buyer_id", userId).order("created_at", { ascending: false }),
      adminClient.from("admin_actions").select("*").eq("target_user_id", userId).order("created_at", { ascending: false }),
    ]);
    return NextResponse.json({ profile, trips: trips || [], orders: orders || [], actions: actions || [] });
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

  const { action, targetUserId, tripId, orderId, note } = await req.json();
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
