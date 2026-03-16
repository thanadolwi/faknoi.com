"use client";

import Link from "next/link";
import { Plus, MapPin, ArrowRight, Users, GraduationCap } from "lucide-react";
import CountdownTimer from "./CountdownTimer";
import UniversityFilter from "./UniversityFilter";
import { UNIVERSITIES } from "@/lib/universities";
import { useLang } from "@/lib/LangContext";
import { t } from "@/lib/i18n";

interface Props {
  trips: any[];
  zone?: string;
}

export default function I18nTrips({ trips, zone }: Props) {
  const { lang } = useLang();

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

      {trips.length > 0 ? (
        <div className="space-y-3">
          {trips.map((trip: any) => (
            <Link key={trip.id} href={`/trips/${trip.id}`} className="card flex items-start justify-between hover:border-brand-blue/40 transition-all group">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    trip.status === "open" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    {trip.status === "open" ? t(lang,"trips_open") : t(lang,"trips_shopping")}
                  </span>
                  {trip.university_id && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <GraduationCap className="w-3 h-3" />
                      {UNIVERSITIES.find((u) => u.id === trip.university_id)?.shortName}
                    </span>
                  )}
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
