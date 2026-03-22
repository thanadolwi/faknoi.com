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
  } catch {
    return null;
  }
}

export async function PATCH(req: Request) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { reportId, status } = await req.json();
  if (!reportId || !status) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("reports").update({ report_status: status }).eq("id", reportId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
