import { createClient, createAdminClient } from "@/lib/supabase/server";
import I18nDashboard from "@/components/I18nDashboard";
import { UNIVERSITIES } from "@/lib/universities";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  const username = user?.user_metadata?.username || user?.email?.split("@")[0] || "ผู้ใช้";
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: allTrips },
    { data: orders },
    { data: buyerActiveOrders },
    { data: shopperTrips },
    { data: recentOrders },
  ] = await Promise.all([
    adminSupabase
      .from("trips")
      .select("id, origin_zone, destination_zone, cutoff_time, current_orders, max_orders, profiles(username)")
      .eq("status", "open")
      .gt("cutoff_time", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("orders")
      .select("id, status, created_at, trips(origin_zone, destination_zone)")
      .eq("buyer_id", user?.id)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("orders")
      .select("id, status, created_at, trip_id, trips(origin_zone, destination_zone, shopper_id, profiles(username)), profiles(username)")
      .eq("buyer_id", user?.id)
      .not("status", "in", "(\"completed\",\"cancelled\")")
      .order("created_at", { ascending: false }),
    supabase.from("trips").select("id").eq("shopper_id", user?.id),
    adminSupabase
      .from("orders")
      .select("created_at, items, trips(origin_zone, university_id)")
      .gte("created_at", since)
      .not("status", "eq", "cancelled"),
  ]);

  const trips = (allTrips || []).filter((t: any) => t.current_orders < t.max_orders).slice(0, 3);
  const shopperTripIds = (shopperTrips || []).map((t: any) => t.id);

  const { data: shopperActiveOrders } = shopperTripIds.length > 0
    ? await supabase
        .from("orders")
        .select("id, status, created_at, trip_id, trips(origin_zone, destination_zone, shopper_id, profiles(username)), profiles(username)")
        .in("trip_id", shopperTripIds)
        .not("status", "in", "(\"completed\",\"cancelled\")")
        .order("created_at", { ascending: false })
    : { data: [] };

  const allActiveOrders = [
    ...(buyerActiveOrders || []),
    ...(shopperActiveOrders || []).filter((o: any) => !(buyerActiveOrders || []).find((b: any) => b.id === o.id)),
  ];

  const uniMap: Record<string, string> = {};
  for (const u of UNIVERSITIES) uniMap[u.id] = u.shortName;

  const zoneByUni: Record<string, Record<string, number>> = {};
  const itemByUni: Record<string, Record<string, number>> = {};
  const shopByUni: Record<string, Record<string, number>> = {};
  const hourByUni: Record<string, Record<number, number>> = {};

  for (const order of recentOrders || []) {
    const trip = (order as any).trips as any;
    const zone = trip?.origin_zone;
    const uniId = trip?.university_id || "other";

    // โซนฮิต
    if (zone) {
      if (!zoneByUni[uniId]) zoneByUni[uniId] = {};
      zoneByUni[uniId][zone] = (zoneByUni[uniId][zone] || 0) + 1;
    }

    // ช่วงเวลาฮิต — นับจาก created_at ของ order
    const h = new Date(new Date((order as any).created_at).getTime() + 7 * 60 * 60 * 1000).getUTCHours();
    if (!hourByUni[uniId]) hourByUni[uniId] = {};
    hourByUni[uniId][h] = (hourByUni[uniId][h] || 0) + 1;

    // เมนูฮิต / ร้านฮิต
    if (Array.isArray((order as any).items)) {
      for (const item of (order as any).items as any[]) {
        if (item.item_name) {
          const k = item.item_name.trim().toLowerCase();
          if (!itemByUni[uniId]) itemByUni[uniId] = {};
          itemByUni[uniId][k] = (itemByUni[uniId][k] || 0) + 1;
        }
        if (item.shop_name) {
          const k = item.shop_name.trim().toLowerCase();
          if (!shopByUni[uniId]) shopByUni[uniId] = {};
          shopByUni[uniId][k] = (shopByUni[uniId][k] || 0) + 1;
        }
      }
    }
  }

  const topZonesByUni = Object.entries(zoneByUni).map(([uniId, zones]) => ({
    uniId, uniName: uniMap[uniId] || uniId,
    zones: Object.entries(zones).sort((a, b) => b[1] - a[1]).slice(0, 4),
  })).sort((a, b) => b.zones.reduce((s, [, c]) => s + c, 0) - a.zones.reduce((s, [, c]) => s + c, 0));

  const topItemsByUni = Object.entries(itemByUni).map(([uniId, items]) => ({
    uniId, uniName: uniMap[uniId] || uniId,
    items: Object.entries(items).sort((a, b) => b[1] - a[1]).slice(0, 5),
  })).sort((a, b) => b.items.reduce((s, [, c]) => s + c, 0) - a.items.reduce((s, [, c]) => s + c, 0));

  const topHoursByUni = Object.entries(hourByUni).map(([uniId, hours]) => ({
    uniId, uniName: uniMap[uniId] || uniId,
    hours: Object.entries(hours).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([h, c]) => ({ hour: parseInt(h), count: c })),
  })).sort((a, b) => b.hours.reduce((s, h) => s + h.count, 0) - a.hours.reduce((s, h) => s + h.count, 0));

  const topShopsByUni = Object.entries(shopByUni).map(([uniId, shops]) => ({
    uniId, uniName: uniMap[uniId] || uniId,
    shops: Object.entries(shops).sort((a, b) => b[1] - a[1]).slice(0, 5),
  })).sort((a, b) => b.shops.reduce((s, [, c]) => s + c, 0) - a.shops.reduce((s, [, c]) => s + c, 0));

  const totalRecent = (recentOrders || []).length;

  return (
    <I18nDashboard
      username={username}
      trips={trips}
      orders={orders || []}
      allActiveOrders={allActiveOrders}
      currentUserId={user?.id || ""}
      insights={{ topZonesByUni, topItemsByUni, topHoursByUni, topShopsByUni, totalRecent }}
    />
  );
}