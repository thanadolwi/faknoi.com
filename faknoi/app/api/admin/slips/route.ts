import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const ADMIN_USERNAME = "testtest";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  if (profile?.username !== ADMIN_USERNAME) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const adminSupabase = createAdminClient();
  const { data, error } = await adminSupabase
    .from("payment_slips")
    .select("*, profiles(username)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ slips: data });
}

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  if (profile?.username !== ADMIN_USERNAME) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { slipId, status, slip } = await req.json();
  const adminSupabase = createAdminClient();

  await adminSupabase.from("payment_slips").update({
    status,
    reviewed_by: user.id,
    updated_at: new Date().toISOString(),
  }).eq("id", slipId);

  if (status === "updated") {
    const newBalance = Math.max(0, Number(slip.outstanding_before) - Number(slip.amount_paid));
    await adminSupabase.from("profiles")
      .update({ outstanding_balance: newBalance })
      .eq("id", slip.user_id);
  }

  return NextResponse.json({ ok: true });
}
