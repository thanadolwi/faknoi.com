"use client";

import { useState, useEffect } from "react";
import { Navigation, MapPin } from "lucide-react";
import { useLang } from "@/lib/LangContext";
import { t } from "@/lib/i18n";

interface LatLng { lat: number; lng: number }

interface LatLngPublic { lat: number; lng: number }

interface Props {
  trips: any[];
  onSorted: (sorted: any[]) => void;
  onLocated?: (loc: LatLngPublic) => void;
}

function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export default function NearbyTrips({ trips, onSorted, onLocated }: Props) {
  const { lang } = useLang();
  const [userLoc, setUserLoc] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [denied, setDenied] = useState(false);
  const [locationName, setLocationName] = useState<string | null>(null);

  useEffect(() => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLoc(loc);
        setLocating(false);
        onLocated?.(loc);
        // Reverse geocode using Nominatim (free, no key needed)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${loc.lat}&lon=${loc.lng}&format=json&accept-language=th`,
            { headers: { "Accept-Language": "th" } }
          );
          const data = await res.json();
          const name =
            data.address?.suburb ||
            data.address?.neighbourhood ||
            data.address?.road ||
            data.address?.city ||
            data.display_name?.split(",")[0] ||
            `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`;
          setLocationName(name);
        } catch {
          setLocationName(`${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`);
        }
        // Sort trips by distance to destination_lat/lng (delivery zone)
        const sorted = [...trips].sort((a, b) => {
          const aHasPin = a.destination_lat != null && a.destination_lng != null;
          const bHasPin = b.destination_lat != null && b.destination_lng != null;
          if (!aHasPin && !bHasPin) return 0;
          if (!aHasPin) return 1;
          if (!bHasPin) return -1;
          const da = haversineKm(loc, { lat: a.destination_lat, lng: a.destination_lng });
          const db = haversineKm(loc, { lat: b.destination_lat, lng: b.destination_lng });
          return da - db;
        });
        onSorted(sorted);
      },
      () => {
        setDenied(true);
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (locating) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400 py-1">
        <Navigation className="w-3.5 h-3.5 animate-pulse text-brand-blue" />
        {t(lang, "trips_locating")}
      </div>
    );
  }

  if (denied) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400 py-1">
        <MapPin className="w-3.5 h-3.5 text-gray-300" />
        {t(lang, "trips_location_denied")}
      </div>
    );
  }

  if (!userLoc) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-gray-500 bg-brand-blue/5 border border-brand-blue/10 rounded-xl px-3 py-2">
      <Navigation className="w-3.5 h-3.5 text-brand-blue flex-shrink-0" />
      <span>
        <span className="font-semibold text-brand-navy">{t(lang, "trips_your_location")} : </span>
        {locationName || `${userLoc.lat.toFixed(4)}, ${userLoc.lng.toFixed(4)}`}
      </span>
    </div>
  );
}

/** Helper: get distance label for a trip card */
export function getTripDistanceLabel(trip: any, userLoc: LatLng | null, kmLabel: string): string | null {
  if (!userLoc || trip.destination_lat == null || trip.destination_lng == null) return null;
  const d = haversineKm(userLoc, { lat: trip.destination_lat, lng: trip.destination_lng });
  return `${d < 1 ? (d * 1000).toFixed(0) + "m" : d.toFixed(1) + " " + kmLabel}`;
}
