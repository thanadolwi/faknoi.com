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

  const { imageUrl } = await req.json();
  if (!imageUrl) return NextResponse.json({ error: "Missing imageUrl" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin.from("banners").insert({ image_url: imageUrl, created_by: user.id }).select().single();
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
