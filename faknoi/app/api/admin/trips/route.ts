import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role, username").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.username !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: trips } = await admin
    .from("trips")
    .select(`
      id, status, origin_zone, destination_zone, university_id,
      cutoff_time, estimated_delivery_time, current_orders, max_orders,
      fee_per_item, payment_info, note, created_at,
      origin_lat, origin_lng, destination_lat, destination_lng,
      profiles(username),
      orders(id, status, items, estimated_price, final_price, created_at, profiles(username))
    `)
    .order("created_at", { ascending: false });

  return NextResponse.json({ trips: trips || [] });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role, username").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.username !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ใช้ admin client สำหรับ auth check แต่ใช้ user client สำหรับ update
  // เพื่อให้ Supabase Realtime ส่ง event ไปยัง subscribers ได้
  const { type, id, status } = await request.json();

  if (type === "trip") {
    const { error } = await supabase.from("trips").update({
      status,
      updated_at: new Date().toISOString(),
      ...(status === "completed" ? { closed_at: new Date().toISOString() } : {}),
    }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else if (type === "order") {
    const { error } = await supabase.from("orders").update({
      status,
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
