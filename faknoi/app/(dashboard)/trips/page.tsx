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
    .select("*, profiles(username)")
    .in("status", ["open", "shopping"])
    .gt("cutoff_time", new Date().toISOString())
    .order("cutoff_time", { ascending: true });

  if (uni) query = query.eq("university_id", uni);
  if (zone) query = query.or(`origin_zone.eq.${zone},destination_zone.eq.${zone}`);

  const { data: allTrips } = await query;

  // กรองทริปที่เต็มแล้วออก (current_orders >= max_orders)
  const trips = (allTrips || []).filter((trip) => trip.current_orders < trip.max_orders);

  return <I18nTrips trips={trips} zone={zone} />;
}
