import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function checkAdmin() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase.from("profiles").select("role,username").eq("id", user.id).single();
    if (profile?.role !== "admin" && profile?.username !== "admin") return null;
    return user;
  } catch { return null; }
}

export async function GET() {
  const admin = createAdminClient();
  const { data } = await admin.from("banners").select("*").order("created_at", { ascending: true });
  return NextResponse.json({ banners: data || [] });
}

export async function POST(req: Request) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Missing file" }, { status: 400 });

  const admin = createAdminClient();
  const ext = file.name.split(".").pop();
  const path = `banners/${Date.now()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();
  const { error: upErr } = await admin.storage.from("banners").upload(path, arrayBuffer, {
    contentType: file.type,
    upsert: false,
  });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data: { publicUrl } } = admin.storage.from("banners").getPublicUrl(path);

  const { data, error } = await admin.from("banners").insert({ image_url: publicUrl, created_by: user.id, caption: formData.get("caption") as string || null, link_url: formData.get("linkUrl") as string || null }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ banner: data });
}

export async function DELETE(req: Request) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, imagePath } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = createAdminClient();
  if (imagePath) {
    await admin.storage.from("banners").remove([imagePath]);
  }
  const { error } = await admin.from("banners").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
