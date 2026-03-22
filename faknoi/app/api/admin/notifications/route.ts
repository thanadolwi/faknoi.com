import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET — get unseen notifications for current user
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ notifications: [] });

  const { data } = await supabase
    .from("admin_actions")
    .select("id, action_type, note, created_at, seen")
    .eq("target_user_id", user.id)
    .eq("seen", false)
    .order("created_at", { ascending: false });

  return NextResponse.json({ notifications: data || [] });
}

// PATCH — mark as seen
export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false });

  const { id } = await req.json();
  await supabase.from("admin_actions").update({ seen: true }).eq("id", id).eq("target_user_id", user.id);
  return NextResponse.json({ ok: true });
}
