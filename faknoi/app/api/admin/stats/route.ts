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

  const [
    { count: userCount },
    { data: trips },
    { data: slipsPending },
    { data: slipsVerified },
    { data: slipsUpdated },
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("trips").select("id, university_id, status").in("status", ["open", "shopping"]),
    admin.from("payment_slips").select("id, profiles!payment_slips_user_id_fkey(username), user_id, university_id").eq("status", "pending"),
    admin.from("payment_slips").select("id, profiles!payment_slips_user_id_fkey(username), user_id, university_id").eq("status", "verified"),
    admin.from("payment_slips").select("id, profiles!payment_slips_user_id_fkey(username), user_id, university_id").eq("status", "updated"),
  ]);

  return NextResponse.json({
    userCount: userCount || 0,
    openTrips: trips || [],
    slipsPending: slipsPending || [],
    slipsVerified: slipsVerified || [],
    slipsUpdated: slipsUpdated || [],
  });
}
