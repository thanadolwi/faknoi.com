import { createClient } from "@/lib/supabase/server";
import OrderTabs from "./OrderTabs";

export const revalidate = 15;

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: myOrders } = await supabase
    .from("orders")
    .select("*, trips(origin_zone, destination_zone, shopper_id, profiles(username))")
    .eq("buyer_id", user?.id)
    .order("created_at", { ascending: false });

  const { data: myTrips } = await supabase
    .from("trips").select("id").eq("shopper_id", user?.id);

  const myTripIds = (myTrips || []).map((t: { id: string }) => t.id);

  const { data: shopperOrders } = myTripIds.length > 0
    ? await supabase
        .from("orders")
        .select("*, trips(origin_zone, destination_zone), profiles(username)")
        .in("trip_id", myTripIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const statusLabel: Record<string, { label: string; color: string }> = {
    pending:    { label: "status_pending",    color: "bg-yellow-100 text-yellow-700" },
    accepted:   { label: "status_accepted",   color: "bg-blue-100 text-blue-700" },
    shopping:   { label: "status_shopping",   color: "bg-indigo-100 text-indigo-700" },
    bought:     { label: "status_bought",     color: "bg-cyan-100 text-cyan-700" },
    delivering: { label: "status_delivering", color: "bg-purple-100 text-purple-700" },
    completed:  { label: "status_completed",  color: "bg-green-100 text-green-700" },
    cancelled:  { label: "status_cancelled",  color: "bg-red-100 text-red-600" },
  };

  return (
    <div className="space-y-5">
      <OrderTabs
        myOrders={myOrders || []}
        shopperOrders={shopperOrders || []}
        statusLabel={statusLabel}
      />
    </div>
  );
}
