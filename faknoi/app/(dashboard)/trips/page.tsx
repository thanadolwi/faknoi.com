import { createClient } from "@/lib/supabase/server";
import I18nTrips from "@/components/I18nTrips";

export const revalidate = 30;

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<{ uni?: string; zone?: string }>;
}) {
  const { uni, zone } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("trips")
    .select("id, origin_zone, destination_zone, cutoff_time, current_orders, max_orders, university_id, status, destination_lat, destination_lng, estimated_delivery_time, profiles(username)")
    .in("status", ["open", "shopping"])
    .gt("cutoff_time", new Date().toISOString())
    .order("cutoff_time", { ascending: true });

  if (uni) query = query.eq("university_id", uni);
  if (zone) query = query.or(`origin_zone.eq.${zone},destination_zone.eq.${zone}`);

  const { data: allTrips } = await query;

  // กรองทริปที่เต็มแล้วออก และถ้า filter uni ให้กรอง empty string ออกด้วย
  const trips = (allTrips || []).filter((trip) => {
    if (trip.current_orders >= trip.max_orders) return false;
    if (uni && (!trip.university_id || trip.university_id !== uni)) return false;
    return true;
  });

  return <I18nTrips trips={trips} zone={zone} />;
}
