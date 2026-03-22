import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import I18nTrips from "@/components/I18nTrips";

export const dynamic = "force-dynamic";

export default async function TripsPage() {
  const supabase = await createClient();

  const { data: allTrips } = await supabase
    .from("trips")
    .select("id, display_id, origin_zone, destination_zone, cutoff_time, current_orders, max_orders, university_id, status, destination_lat, destination_lng, estimated_delivery_time, profiles(username)")
    .in("status", ["open", "shopping"])
    .gt("cutoff_time", new Date().toISOString())
    .order("cutoff_time", { ascending: true });

  const trips = (allTrips || []).filter((trip) => trip.current_orders < trip.max_orders);

  return (
    <Suspense fallback={<div className="text-center py-10 text-gray-400">กำลังโหลด...</div>}>
      <I18nTrips trips={trips} />
    </Suspense>
  );
}
