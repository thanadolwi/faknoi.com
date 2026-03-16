import { createClient } from "@/lib/supabase/server";
import I18nDashboard from "@/components/I18nDashboard";

export const revalidate = 30;

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const username = user?.user_metadata?.username || user?.email?.split("@")[0] || "ผู้ใช้";

  const { data: trips } = await supabase
    .from("trips").select("*, profiles(username)")
    .eq("status", "open").gt("cutoff_time", new Date().toISOString())
    .order("created_at", { ascending: false }).limit(3);

  const { data: orders } = await supabase
    .from("orders").select("*, trips(origin_zone, destination_zone)")
    .eq("buyer_id", user?.id)
    .order("created_at", { ascending: false }).limit(3);

  const { data: buyerActiveOrders } = await supabase
    .from("orders")
    .select("*, trips(origin_zone, destination_zone, shopper_id, profiles(username)), profiles(username)")
    .eq("buyer_id", user?.id).not("status", "in", '("completed","cancelled")')
    .order("created_at", { ascending: false });

  const { data: shopperTrips } = await supabase.from("trips").select("id").eq("shopper_id", user?.id);
  const shopperTripIds = (shopperTrips || []).map((t: any) => t.id);

  const { data: shopperActiveOrders } = shopperTripIds.length > 0
    ? await supabase.from("orders")
        .select("*, trips(origin_zone, destination_zone, shopper_id, profiles(username)), profiles(username)")
        .in("trip_id", shopperTripIds).not("status", "in", '("completed","cancelled")')
        .order("created_at", { ascending: false })
    : { data: [] };

  const allActiveOrders = [
    ...(buyerActiveOrders || []),
    ...(shopperActiveOrders || []).filter((o: any) => !(buyerActiveOrders || []).find((b: any) => b.id === o.id)),
  ];

  return (
    <I18nDashboard
      username={username}
      trips={trips || []}
      orders={orders || []}
      allActiveOrders={allActiveOrders}
      currentUserId={user?.id || ""}
    />
  );
}
