"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, MapPin, ArrowRight, Users, GraduationCap, Clock, Navigation } from "lucide-react";
import CountdownTimer from "./CountdownTimer";
import UniversityFilter from "./UniversityFilter";
import NearbyTrips, { getTripDistanceLabel } from "./NearbyTrips";
import { UNIVERSITIES } from "@/lib/universities";
import { useLang } from "@/lib/LangContext";
import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

interface Props {
  trips: any[];
}

export default function I18nTrips({ trips: initialTrips }: Props) {
  const { lang } = useLang();
  const searchParams = useSearchParams();
  const uni = searchParams.get("uni") || "";
  const zone = searchParams.get("zone") || "";

  const [trips, setTrips] = useState<any[]>(initialTrips);
  const [sortedTrips, setSortedTrips] = useState<any[]>([]);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);

  // Realtime: subscribe to trips table changes
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("trips-list-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "trips" },
        async (payload) => {
          const updated = payload.new;
          const hideStatuses = ["delivering", "completed", "cancelled"];
          const showStatuses = ["open", "shopping"];

          if (hideStatuses.includes(updated.status)) {
            // ซ่อนทริปที่ไม่รับออเดอร์แล้ว
            setTrips((prev) => prev.filter((t) => t.id !== updated.id));
          } else if (showStatuses.includes(updated.status)) {
            // ถ้ากลับมาเป็น open/shopping ให้ fetch กลับมาใส่ list
            setTrips((prev) => {
              const exists = prev.find((t) => t.id === updated.id);
              if (exists) {
                return prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t));
              } else {
                // fetch full trip with profile แล้วเพิ่มเข้า list
                const supabase = createClient();
                supabase
                  .from("trips")
                  .select("*, profiles(username)")
                  .eq("id", updated.id)
                  .single()
                  .then(({ data }) => {
                    if (data) setTrips((p) => [data, ...p]);
                  });
                return prev;
              }
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "trips" },
        async (payload) => {
          // fetch full trip with profile
          const { data } = await supabase
            .from("trips")
            .select("*, profiles(username)")
            .eq("id", payload.new.id)
            .single();
          if (data) setTrips((prev) => [data, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "trips" },
        (payload) => {
          setTrips((prev) => prev.filter((t) => t.id !== payload.old.id));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // filter ฝั่ง client ตาม uni + zone
  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      if (uni && trip.university_id !== uni) return false;
      if (zone && trip.origin_zone !== zone && trip.destination_zone !== zone) return false;
      return true;
    });
  }, [trips, uni, zone]);

  // sync sortedTrips เมื่อ filter เปลี่ยน
  useEffect(() => {
    setSortedTrips(filteredTrips);
  }, [filteredTrips]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-brand-navy">{t(lang,"trips_title")}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{t(lang,"trips_subtitle")}</p>
        </div>
        <Link href="/trips/create" className="btn-primary flex items-center gap-2 text-sm py-2 px-4">
          <Plus className="w-4 h-4" />
          {t(lang,"trips_open_trip")}
        </Link>
      </div>

      <UniversityFilter />

      {/* Current location + sort by distance */}
      <NearbyTrips trips={filteredTrips} onSorted={setSortedTrips} onLocated={setUserLoc} />

      {sortedTrips.length > 0 ? (
        <div className="space-y-3">
          {sortedTrips.map((trip: any) => (
            <Link key={trip.id} href={`/trips/${trip.id}`} className="card flex items-start justify-between hover:border-brand-blue/40 transition-all group">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    trip.status === "open" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    {trip.status === "open" ? t(lang,"trips_open") : t(lang,"trips_shopping")}
                  </span>
                  {trip.display_id && (
                    <span className="text-xs font-black text-brand-blue bg-brand-blue/10 px-2 py-0.5 rounded-lg">
                      {trip.display_id}
                    </span>
                  )}
                  {trip.university_id && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <GraduationCap className="w-3 h-3" />
                      {UNIVERSITIES.find((u) => u.id === trip.university_id)?.shortName}
                    </span>
                  )}
                  {(() => {
                    const dist = getTripDistanceLabel(trip, userLoc, "km");
                    return dist ? (
                      <span className="text-xs text-brand-blue font-semibold flex items-center gap-1 ml-auto">
                        <Navigation className="w-3 h-3" />
                        {dist}
                      </span>
                    ) : null;
                  })()}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-brand-blue flex-shrink-0" />
                  <span className="font-semibold text-brand-navy">{trip.origin_zone}</span>
                  <ArrowRight className="w-3 h-3 text-gray-400" />
                  <span className="font-semibold text-brand-navy">{trip.destination_zone}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mb-2">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {trip.current_orders}/{trip.max_orders} {t(lang,"trips_orders")}
                  </span>
                  <span>{t(lang,"trips_by")} {trip.profiles?.username}</span>
                  {trip.estimated_delivery_time && (
                    <span className="flex items-center gap-1 text-brand-cyan font-medium">
                      <Clock className="w-3 h-3" />
                      {t(lang,"trips_est_delivery")} {new Date(trip.estimated_delivery_time).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>
                {trip.note && (
                  <p className="text-xs text-gray-400 mb-2 bg-gray-50 px-3 py-1.5 rounded-lg">{trip.note}</p>
                )}
                <CountdownTimer cutoffTime={trip.cutoff_time} />
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-brand-blue transition-colors mt-1 ml-3 flex-shrink-0" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="card text-center py-16 text-gray-400">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium mb-1">
            {zone ? `${t(lang,"trips_no_zone")} "${zone}"` : t(lang,"trips_no_trips")}
          </p>
          <p className="text-sm mb-4">{t(lang,"trips_be_first")}</p>
          <Link href="/trips/create" className="btn-primary text-sm inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {t(lang,"trips_open_new")}
          </Link>
        </div>
      )}
    </div>
  );
}
