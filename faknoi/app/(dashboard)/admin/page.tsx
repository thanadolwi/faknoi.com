import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { UNIVERSITIES } from "@/lib/universities";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role, username").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.username !== "admin") redirect("/dashboard");

  const admin = createAdminClient();

  const [
    { count: userCount },
    { data: openTrips },
    { data: slipsPending },
    { data: slipsVerified },
    { data: slipsUpdated },
    { data: areaStatuses },
    { data: recentOrders },
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("trips").select("id, university_id, status, origin_zone, destination_zone, current_orders, max_orders, profiles(username)").in("status", ["open", "shopping"]),
    admin.from("payment_slips").select("id, user_id, university_id, profiles!payment_slips_user_id_fkey(username)").eq("status", "pending"),
    admin.from("payment_slips").select("id, user_id, university_id, profiles!payment_slips_user_id_fkey(username)").eq("status", "verified"),
    admin.from("payment_slips").select("id, user_id, university_id, profiles!payment_slips_user_id_fkey(username)").eq("status", "updated"),
    admin.from("area_status").select("*"),
    admin.from("orders").select("id, status, created_at, trips(university_id)").order("created_at", { ascending: false }).limit(50),
  ]);

  return (
    <AdminDashboard
      userCount={userCount || 0}
      openTrips={openTrips || []}
      slipsPending={slipsPending || []}
      slipsVerified={slipsVerified || []}
      slipsUpdated={slipsUpdated || []}
      areaStatuses={areaStatuses || []}
      universities={UNIVERSITIES}
    />
  );
}
