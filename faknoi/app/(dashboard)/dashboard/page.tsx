import { createClient, createAdminClient } from "@/lib/supabase/server";
import I18nDashboard from "@/components/I18nDashboard";
import { UNIVERSITIES } from "@/lib/universities";

export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  const username = user?.user_metadata?.username || user?.email?.split("@")[0] || "ผู้ใช้";

  // trips — ใช้ admin client เพื่อ bypass RLS กรองเต็มออก
  const { data: allTrips } = await adminSupabase
    .from("trips").select("*, profiles(username)")
    .eq("status", "open").gt("cutoff_time", new Date().toISOString())
    .order("created_at", { ascending: false }).limit(10);
  const trips = (allTrips || []).filter((t: any) => t.current_orders < t.max_orders).slice(0, 3);

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

  // Insights — ดึง orders ทุกคน 7 วันล่าสุด (bypass RLS)
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentOrders } = await adminSupabase
    .from("orders")
    .select("items, trips(origin_zone, destination_zone, university_id), created_at")
    .gte("created_at", since)
    .not("status", "eq", "cancelled");

  // build university shortName map
  const uniMap: Record<string, string> = {};
  for (const u of UNIVERSITIES) uniMap[u.id] = u.shortName;

  // คำนวณ insights — แยกตาม uni
  const zoneByUni: Record<string, Record<string, number>> = {};
  const itemByUni: Record<string, Record<string, number>> = {};
  const hourCount: Record<number, number> = {};
  const shopCount: Record<string, number> = {};

  for (const order of recentOrders || []) {
    const trip = order.trips as any;
    const zone = trip?.origin_zone;
    const uniId = trip?.university_id || "other";

    if (zone) {
      if (!zoneByUni[uniId]) zoneByUni[uniId] = {};
      zoneByUni[uniId][zone] = (zoneByUni[uniId][zone] || 0) + 1;
    }

    const h = new Date(order.created_at).getHours();
    hourCount[h] = (hourCount[h] || 0) + 1;

    if (Array.isArray(order.items)) {
      for (const item of order.items as any[]) {
        if (item.item_name) {
          const k = item.item_name.trim().toLowerCase();
          if (!itemByUni[uniId]) itemByUni[uniId] = {};
          itemByUni[uniId][k] = (itemByUni[uniId][k] || 0) + 1;
        }
        if (item.shop_name) {
          const k = item.shop_name.trim().toLowerCase();
          shopCount[k] = (shopCount[k] || 0) + 1;
        }
      }
    }
  }

  // แปลง zoneByUni → array เรียงตาม uni ที่มีออเดอร์เยอะสุด
  const topZonesByUni = Object.entries(zoneByUni).map(([uniId, zones]) => ({
    uniId,
    uniName: uniMap[uniId] || uniId,
    zones: Object.entries(zones).sort((a, b) => b[1] - a[1]).slice(0, 4),
  })).sort((a, b) => {
    const totalA = a.zones.reduce((s, [, c]) => s + c, 0);
    const totalB = b.zones.reduce((s, [, c]) => s + c, 0);
    return totalB - totalA;
  });

  // แปลง itemByUni → array
  const topItemsByUni = Object.entries(itemByUni).map(([uniId, items]) => ({
    uniId,
    uniName: uniMap[uniId] || uniId,
    items: Object.entries(items).sort((a, b) => b[1] - a[1]).slice(0, 5),
  })).sort((a, b) => {
    const totalA = a.items.reduce((s, [, c]) => s + c, 0);
    const totalB = b.items.reduce((s, [, c]) => s + c, 0);
    return totalB - totalA;
  });

  const topHours = Object.entries(hourCount).sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([h, c]) => ({ hour: parseInt(h), count: c }));
  const topShops = Object.entries(shopCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const totalRecent = (recentOrders || []).length;

  return (
    <I18nDashboard
      username={username}
      trips={trips}
      orders={orders || []}
      allActiveOrders={allActiveOrders}
      currentUserId={user?.id || ""}
      insights={{ topZonesByUni, topItemsByUni, topHours, topShops, totalRecent }}
    />
  );
}
