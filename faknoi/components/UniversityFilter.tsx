"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UNIVERSITIES } from "@/lib/universities";
import { GraduationCap, ChevronDown, X } from "lucide-react";
import { useLang } from "@/lib/LangContext";
import { t } from "@/lib/i18n";

export default function UniversityFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang } = useLang();
  const [open, setOpen] = useState(false);

  const selectedUni = searchParams.get("uni") || "";
  const selectedZone = searchParams.get("zone") || "";
  const university = UNIVERSITIES.find((u) => u.id === selectedUni);

  function selectUni(id: string) {
    const params = new URLSearchParams();
    if (id) params.set("uni", id);
    router.push(`/trips?${params.toString()}`);
    setOpen(false);
  }

  function selectZone(zone: string) {
    const params = new URLSearchParams();
    if (selectedUni) params.set("uni", selectedUni);
    if (zone) params.set("zone", zone);
    router.push(`/trips?${params.toString()}`);
  }

  function clear() { router.push("/trips"); }

  return (
    <div className="space-y-3">
      <div className="relative">
        <button onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm hover:border-brand-blue/40 transition-colors">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-brand-blue" />
            <span className={university ? "text-brand-navy font-medium" : "text-gray-400"}>
              {university ? university.name : t(lang, "uf_select")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {selectedUni && (
              <button onClick={(e) => { e.stopPropagation(); clear(); }} className="p-0.5 rounded-full hover:bg-gray-100">
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            )}
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
          </div>
        </button>

        {open && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
            {UNIVERSITIES.map((uni) => (
              <button key={uni.id} onClick={() => selectUni(uni.id)}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                  selectedUni === uni.id ? "bg-brand-blue/5 text-brand-blue font-medium" : "text-gray-700"
                }`}>
                <p className="font-medium">{uni.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{uni.zones.length} {t(lang, "uf_zones")}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {university && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => selectZone("")}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              !selectedZone ? "bg-brand-blue text-white border-brand-blue" : "bg-white text-gray-500 border-gray-200 hover:border-brand-blue/40"
            }`}>
            {t(lang, "uf_all_zones")}
          </button>
          {university.zones.map((zone) => (
            <button key={zone} onClick={() => selectZone(zone)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                selectedZone === zone ? "bg-brand-blue text-white border-brand-blue" : "bg-white text-gray-500 border-gray-200 hover:border-brand-blue/40"
              }`}>
              {zone}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
