import { createAdminClient, createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ coupons: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role, username").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.username !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await req.formData();
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const company = formData.get("company") as string;
  const coins_required = parseInt(formData.get("coins_required") as string);
  const valid_from = formData.get("valid_from") as string;
  const valid_until = formData.get("valid_until") as string;
  const contact_info = formData.get("contact_info") as string;
  const contact_email = formData.get("contact_email") as string;
  const contact_phone = formData.get("contact_phone") as string;
  const contact_line = formData.get("contact_line") as string;
  const contact_facebook = formData.get("contact_facebook") as string;
  const contact_instagram = formData.get("contact_instagram") as string;
  const is_active = formData.get("is_active") === "true";
  const notice = formData.get("notice") as string;
  const imageFile = formData.get("image") as File | null;

  const admin = createAdminClient();
  let image_url: string | null = null;

  if (imageFile && imageFile.size > 0) {
    if (imageFile.size > 5 * 1024 * 1024) return NextResponse.json({ error: "ไฟล์ใหญ่เกิน 5MB" }, { status: 400 });
    const ext = imageFile.name.split(".").pop();
    const path = `coupons/${Date.now()}.${ext}`;
    const buf = Buffer.from(await imageFile.arrayBuffer());
    const { error: upErr } = await admin.storage.from("coupon-images").upload(path, buf, { contentType: imageFile.type, upsert: true });
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
    const { data: urlData } = admin.storage.from("coupon-images").getPublicUrl(path);
    image_url = urlData.publicUrl;
  }

  // ใช้ regular client เพื่อให้ realtime ยิง event ไปหา subscribers
  const { data, error } = await supabase.from("coupons").insert({
    name, description, company: company || null, coins_required,
    valid_from: valid_from || null, valid_until: valid_until || null,
    contact_info: contact_info || null,
    contact_email: contact_email || null,
    contact_phone: contact_phone || null,
    contact_line: contact_line || null,
    contact_facebook: contact_facebook || null,
    contact_instagram: contact_instagram || null,
    is_active, notice: notice || null, image_url,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ coupon: data });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role, username").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.username !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { id, ...updates } = body;
  // ใช้ regular client เพื่อให้ realtime ยิง event
  const { error } = await supabase.from("coupons").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role, username").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.username !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  // ใช้ regular client เพื่อให้ realtime ยิง event
  const { error } = await supabase.from("coupons").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
