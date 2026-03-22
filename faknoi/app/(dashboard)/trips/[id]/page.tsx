import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import I18nTripDetail from "@/components/I18nTripDetail";

export const dynamic = "force-dynamic";

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: trip } = await supabase
    .from("trips")
    .select("*, profiles(username)")
    .eq("id", id)
    .single();

  if (!trip) notFound();

  const { data: orders } = await supabase
    .from("orders")
    .select("*, profiles(username)")
    .eq("trip_id", id)
    .order("created_at", { ascending: true });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, username")
    .eq("id", user?.id ?? "")
    .single();

  const isShopper = trip.shopper_id === user?.id;
  const isAdmin = profile?.role === "admin" || profile?.username === "admin";

  return (
    <I18nTripDetail
      trip={trip}
      orders={orders || []}
      isShopper={isShopper}
      userId={user!.id}
      isAdmin={isAdmin}
    />
  );
}
