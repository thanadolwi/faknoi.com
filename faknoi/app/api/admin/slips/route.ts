import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const ADMIN_USERNAME = "testtest";

async function checkAdmin() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();
    if (profile?.username !== ADMIN_USERNAME) return null;
    return user;
  } catch {
    return null;
  }
}

export async function GET() {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from("payment_slips")
      .select("id, user_id, slip_url, amount_paid, outstanding_before, status, created_at, profiles(username)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("slips query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ slips: data || [] });
  } catch (e: any) {
    console.error("admin slips exception:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
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
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
