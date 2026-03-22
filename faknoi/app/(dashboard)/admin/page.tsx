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
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: userCount },
    { data: openTrips },
    { data: slipsPending },
    { data: slipsVerified },
    { data: slipsUpdated },
    { data: areaStatuses },
    { data: recentOrders },
    { data: recentTrips },
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("trips").select("id, university_id, status, origin_zone, destination_zone, current_orders, max_orders, profiles(username)")
      .in("status", ["open", "shopping"])
      .gt("cutoff_time", new Date().toISOString()),
    admin.from("payment_slips").select("id, user_id, university_id, profiles!payment_slips_user_id_fkey(username)").eq("status", "pending"),
    admin.from("payment_slips").select("id, user_id, university_id, profiles!payment_slips_user_id_fkey(username)").eq("status", "verified"),
    admin.from("payment_slips").select("id, user_id, university_id, profiles!payment_slips_user_id_fkey(username)").eq("status", "updated"),
    admin.from("area_status").select("*"),
    admin.from("orders").select("items, accessibility_mode, trips(origin_zone, university_id, cutoff_time)")
      .gte("created_at", since)
      .not("status", "eq", "cancelled"),
    admin.from("trips").select("university_id, accessibility_mode")
      .gte("created_at", since)
      .not("status", "eq", "cancelled"),
  ]);

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
    if (zone) {
      if (!zoneByUni[uniId]) zoneByUni[uniId] = {};
      zoneByUni[uniId][zone] = (zoneByUni[uniId][zone] || 0) + 1;
    }
    if (trip?.cutoff_time) {
      const h = new Date(new Date(trip.cutoff_time).getTime() + 7 * 60 * 60 * 1000).getUTCHours();
      if (!hourByUni[uniId]) hourByUni[uniId] = {};
      hourByUni[uniId][h] = (hourByUni[uniId][h] || 0) + 1;
    }
    if (Array.isArray((order as any).items)) {
      for (const item of (order as any).items as any[]) {
        if (item.item_name?.trim()) {
          const k = item.item_name.trim().toLowerCase();
          if (!itemByUni[uniId]) itemByUni[uniId] = {};
          itemByUni[uniId][k] = (itemByUni[uniId][k] || 0) + (item.quantity || 1);
        }
        if (item.shop_name?.trim()) {
          const k = item.shop_name.trim().toLowerCase();
          if (!shopByUni[uniId]) shopByUni[uniId] = {};
          shopByUni[uniId][k] = (shopByUni[uniId][k] || 0) + 1;
        }
      }
    }
  }

  // Accessibility breakdown: count by mode for orders and trips
  const ACCESS_MODES = ["normal", "visual", "hearing", "autism", "other"] as const;
  type AccessMode = typeof ACCESS_MODES[number];

  const ordersByMode: Record<string, number> = {};
  const tripsByMode: Record<string, number> = {};
  for (const m of ACCESS_MODES) { ordersByMode[m] = 0; tripsByMode[m] = 0; }

  for (const order of recentOrders || []) {
    const m = (order as any).accessibility_mode || "normal";
    ordersByMode[m] = (ordersByMode[m] || 0) + 1;
  }
  for (const trip of recentTrips || []) {
    const m = (trip as any).accessibility_mode || "normal";
    tripsByMode[m] = (tripsByMode[m] || 0) + 1;
  }

  // Per-university accessibility breakdown
  const uniAccessOrders: Record<string, Record<string, number>> = {};
  const uniAccessTrips: Record<string, Record<string, number>> = {};
  for (const order of recentOrders || []) {
    const trip = (order as any).trips as any;
    const uniId = trip?.university_id || "other";
    const m = (order as any).accessibility_mode || "normal";
    if (!uniAccessOrders[uniId]) uniAccessOrders[uniId] = {};
    uniAccessOrders[uniId][m] = (uniAccessOrders[uniId][m] || 0) + 1;
  }
  for (const trip of recentTrips || []) {
    const uniId = (trip as any).university_id || "other";
    const m = (trip as any).accessibility_mode || "normal";
    if (!uniAccessTrips[uniId]) uniAccessTrips[uniId] = {};
    uniAccessTrips[uniId][m] = (uniAccessTrips[uniId][m] || 0) + 1;
  }

  const accessibilityInsights = {
    ordersByMode,
    tripsByMode,
    uniAccessOrders: Object.entries(uniAccessOrders).map(([uniId, modes]) => ({ uniId, uniName: uniMap[uniId] || uniId, modes })),
    uniAccessTrips: Object.entries(uniAccessTrips).map(([uniId, modes]) => ({ uniId, uniName: uniMap[uniId] || uniId, modes })),
  };

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

  return (
    <AdminDashboard
      userCount={userCount || 0}
      openTrips={openTrips || []}
      slipsPending={slipsPending || []}
      slipsVerified={slipsVerified || []}
      slipsUpdated={slipsUpdated || []}
      areaStatuses={areaStatuses || []}
      universities={UNIVERSITIES}
      insights={{ topZonesByUni, topItemsByUni, topHoursByUni, topShopsByUni, totalRecent: (recentOrders || []).length }}
      accessibilityInsights={accessibilityInsights}
    />
  );
}
