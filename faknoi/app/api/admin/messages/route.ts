import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role, username").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.username !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const order_id = searchParams.get("order_id");
  if (!order_id) return NextResponse.json({ error: "order_id required" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("messages")
    .select("*, profiles(username)")
    .eq("order_id", order_id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role, username").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.username !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { order_id, content, image_url } = await req.json();
  if (!order_id) return NextResponse.json({ error: "order_id required" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin.from("messages").insert({
    order_id,
    sender_id: user.id,
    content: content || null,
    image_url: image_url || null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
