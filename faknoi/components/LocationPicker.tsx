"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, Navigation, Check, X } from "lucide-react";
import { useLang } from "@/lib/LangContext";
import { t } from "@/lib/i18n";

interface LatLng { lat: number; lng: number }

interface Props {
  title: string;
  value: LatLng | null;
  onChange: (v: LatLng | null) => void;
  color?: "blue" | "cyan";
}

export default function LocationPicker({ title, value, onChange, color = "blue" }: Props) {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [draft, setDraft] = useState<LatLng | null>(value);
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const colorClass = color === "blue" ? "text-brand-blue" : "text-brand-cyan";
  const bgClass = color === "blue" ? "bg-brand-blue/10" : "bg-brand-cyan/10";

  function getCurrentLocation() {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const ll = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setDraft(ll);
        setLocating(false);
      },
      () => {
        alert(t(lang, "lp_err"));
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function confirm() {
    onChange(draft);
    setOpen(false);
  }

  function cancel() {
    setDraft(value);
    setOpen(false);
  }

  // Build static map URL for preview using OpenStreetMap tile via iframe
  useEffect(() => {
    if (draft) {
      setMapUrl(`https://www.openstreetmap.org/export/embed.html?bbox=${draft.lng - 0.005},${draft.lat - 0.005},${draft.lng + 0.005},${draft.lat + 0.005}&layer=mapnik&marker=${draft.lat},${draft.lng}`);
    }
  }, [draft]);

  return (
    <div>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => { setDraft(value); setOpen(true); }}
        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${
          value
            ? `border-${color === "blue" ? "brand-blue" : "brand-cyan"}/40 ${bgClass} ${colorClass} font-medium`
            : "border-gray-200 text-gray-400 hover:border-gray-300"
        }`}
      >
        <MapPin className={`w-4 h-4 flex-shrink-0 ${value ? colorClass : "text-gray-300"}`} />
        {value
          ? `${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}`
          : t(lang, "lp_tap_map")}
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <MapPin className={`w-4 h-4 ${colorClass}`} />
                <span className="font-bold text-brand-navy text-sm">{title}</span>
              </div>
              <button onClick={cancel} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Map preview */}
            <div className="relative h-52 bg-gray-100">
              {draft && mapUrl ? (
                <iframe
                  src={mapUrl}
                  className="w-full h-full border-0"
                  title="map"
                  sandbox="allow-scripts allow-same-origin"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  <MapPin className="w-8 h-8 opacity-20 mr-2" />
                  {t(lang, "lp_tap_map")}
                </div>
              )}
              {draft && (
                <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 text-xs font-mono text-gray-600 shadow">
                  {draft.lat.toFixed(5)}, {draft.lng.toFixed(5)}
                </div>
              )}
            </div>

            {/* Coords input */}
            <div className="px-5 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">{t(lang, "lp_lat")}</label>
                  <input
                    type="number"
                    step="0.00001"
                    className="input-field text-sm"
                    placeholder="13.7563"
                    value={draft?.lat ?? ""}
                    onChange={(e) => setDraft((prev) => ({ lat: parseFloat(e.target.value) || 0, lng: prev?.lng ?? 0 }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">{t(lang, "lp_lng")}</label>
                  <input
                    type="number"
                    step="0.00001"
                    className="input-field text-sm"
                    placeholder="100.5018"
                    value={draft?.lng ?? ""}
                    onChange={(e) => setDraft((prev) => ({ lat: prev?.lat ?? 0, lng: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={locating}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Navigation className="w-4 h-4 text-brand-blue" />
                {locating ? t(lang, "lp_locating") : t(lang, "lp_use_current")}
              </button>

              <button
                type="button"
                onClick={confirm}
                disabled={!draft}
                className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-2.5"
              >
                <Check className="w-4 h-4" />
                {t(lang, "lp_confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
