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

export async function GET() {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const { data } = await admin.from("area_status").select("*");
  return NextResponse.json({ areas: data || [] });
}

export async function POST(req: Request) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { universityId, isOpen, note } = await req.json();
  const admin = createAdminClient();

  await admin.from("area_status").upsert({
    university_id: universityId,
    is_open: isOpen,
    note: note || null,
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  }, { onConflict: "university_id" });

  return NextResponse.json({ ok: true });
}
