import { createAdminClient, createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { UNIVERSITIES } from "@/lib/universities";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: recentOrders } = await admin
    .from("orders")
    .select("items, trips(origin_zone, university_id, cutoff_time)")
    .gte("created_at", since)
    .not("status", "eq", "cancelled");

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

  return NextResponse.json({
    topZonesByUni, topItemsByUni, topHoursByUni, topShopsByUni,
    totalRecent: (recentOrders || []).length,
  });
}
