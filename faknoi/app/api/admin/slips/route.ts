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

export async function GET(req: Request) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status"); // pending|verified|updated|rejected|all
  const uniFilter = searchParams.get("uni");

  try {
    const adminSupabase = createAdminClient();
    let query = adminSupabase
      .from("payment_slips")
      .select("id, user_id, slip_url, amount_paid, outstanding_before, status, created_at, rejected_note, amount_verified, verified_note, university_id, profiles!payment_slips_user_id_fkey(username)")
      .order("created_at", { ascending: false });

    if (statusFilter && statusFilter !== "all") query = query.eq("status", statusFilter);
    if (uniFilter) query = query.eq("university_id", uniFilter);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ slips: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { slipId, status, slip, rejectedNote, amountVerified, verifiedNote } = await req.json();
    const adminSupabase = createAdminClient();

    const updateData: Record<string, any> = {
      status,
      reviewed_by: user.id,
      updated_at: new Date().toISOString(),
    };
    if (rejectedNote !== undefined) updateData.rejected_note = rejectedNote;
    if (amountVerified !== undefined) updateData.amount_verified = amountVerified;
    if (verifiedNote !== undefined) updateData.verified_note = verifiedNote;

    await adminSupabase.from("payment_slips").update(updateData).eq("id", slipId);

    if (status === "updated" && slip) {
      const paid = amountVerified != null ? Number(amountVerified) : Number(slip.amount_paid);
      const newBalance = Math.max(0, Number(slip.outstanding_before) - paid);
      await adminSupabase.from("profiles").update({ outstanding_balance: newBalance }).eq("id", slip.user_id);
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
