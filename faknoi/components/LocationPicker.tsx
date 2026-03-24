"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, Navigation, Check, X, Search, Loader2 } from "lucide-react";
import { useLang } from "@/lib/LangContext";
import { t } from "@/lib/i18n";

interface LatLng { lat: number; lng: number }

interface Props {
  title: string;
  value: LatLng | null;
  onChange: (v: LatLng | null) => void;
  color?: "blue" | "cyan";
}

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    district?: string;
  };
}

export default function LocationPicker({ title, value, onChange, color = "blue" }: Props) {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [draft, setDraft] = useState<LatLng | null>(value);
  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Drag state for map pin
  const [isDragging, setIsDragging] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const colorClass = color === "blue" ? "text-brand-blue" : "text-brand-cyan";
  const bgClass = color === "blue" ? "bg-brand-blue/10" : "bg-brand-cyan/10";
  const borderActive = color === "blue" ? "border-brand-blue/40" : "border-brand-cyan/40";

  // Debounced search via Nominatim
  const handleSearchInput = useCallback((q: string) => {
    setSearchQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!q.trim()) { setSearchResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({
          q: q,
          format: "json",
          limit: "7",
          countrycodes: "th",
          addressdetails: "1",
          "accept-language": "th",
        });
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?${params}`,
          { headers: { "User-Agent": "FaknoiApp/1.0" } }
        );
        const data: SearchResult[] = await res.json();
        setSearchResults(data);
      } catch {
        setSearchResults([]);
      }
      setSearching(false);
    }, 400);
  }, []);

  function selectSearchResult(r: SearchResult) {
    const ll = { lat: parseFloat(r.lat), lng: parseFloat(r.lon) };
    setDraft(ll);
    const label = r.name || r.display_name.split(",")[0];
    setSearchQuery(label);
    setSearchResults([]);
  }

  function getCurrentLocation() {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDraft({ lat: pos.coords.latitude, lng: pos.coords.longitude });
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
    setSearchQuery("");
    setSearchResults([]);
  }

  // Map URL for OSM embed
  const mapUrl = draft
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${draft.lng - 0.008},${draft.lat - 0.008},${draft.lng + 0.008},${draft.lat + 0.008}&layer=mapnik&marker=${draft.lat},${draft.lng}`
    : null;

  // Handle click on map container to move pin (approximate — OSM embed doesn't expose click coords)
  // We use a transparent overlay to capture clicks and compute lat/lng from position
  function handleMapClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!mapContainerRef.current || !draft) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;  // 0..1
    const y = (e.clientY - rect.top) / rect.height;   // 0..1
    // Map spans ±0.008 deg around draft
    const span = 0.016;
    const newLng = draft.lng - span / 2 + x * span;
    const newLat = draft.lat + span / 2 - y * span;
    setDraft({ lat: parseFloat(newLat.toFixed(6)), lng: parseFloat(newLng.toFixed(6)) });
  }

  return (
    <div>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setDraft(value); setOpen(true); }}
        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${
          value ? `${borderActive} ${bgClass} ${colorClass} font-medium` : "border-gray-200 text-gray-400 hover:border-gray-300"
        }`}
      >
        <MapPin className={`w-4 h-4 flex-shrink-0 ${value ? colorClass : "text-gray-300"}`} />
        {value ? `${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}` : t(lang, "lp_tap_map")}
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <MapPin className={`w-4 h-4 ${colorClass}`} />
                <span className="font-bold text-brand-navy text-sm">{title}</span>
              </div>
              <button onClick={cancel} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {/* Search box */}
              <div className="px-5 pt-4 pb-2 relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    className="input-field pl-9 pr-9 text-sm"
                    placeholder="ค้นหาสถานที่... เช่น ฟิวเจอร์พาร์ครังสิต"
                    value={searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    autoFocus
                  />
                  {searching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                  )}
                </div>
                {/* Search results dropdown */}
                {searchResults.length > 0 && (
                  <div className="absolute left-5 right-5 top-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-lg z-10 overflow-hidden">
                    {searchResults.map((r, i) => (
                      <button
                        key={i}
                        type="button"
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-brand-blue/5 transition-colors border-b border-gray-50 last:border-0"
                        onClick={() => selectSearchResult(r)}
                      >
                        <p className="font-semibold text-brand-navy truncate">{r.name || r.display_name.split(",")[0]}</p>
                        <p className="text-xs text-gray-400 truncate">
                          {[r.address?.road, r.address?.suburb || r.address?.district, r.address?.city || r.address?.town].filter(Boolean).join(", ") || r.display_name.split(",").slice(1, 3).join(",")}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Map preview with draggable overlay */}
              <div className="px-5 pb-2">
                <div
                  ref={mapContainerRef}
                  className="relative h-52 bg-gray-100 rounded-2xl overflow-hidden border border-gray-200"
                >
                  {draft && mapUrl ? (
                    <>
                      <iframe
                        ref={iframeRef}
                        src={mapUrl}
                        className="w-full h-full border-0 pointer-events-none"
                        title="map"
                        sandbox="allow-scripts allow-same-origin"
                      />
                      {/* Transparent click overlay */}
                      <div
                        className="absolute inset-0 cursor-crosshair"
                        onClick={handleMapClick}
                        title="คลิกเพื่อย้ายหมุด"
                      />
                      {/* Center pin indicator */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className={`w-6 h-6 rounded-full border-4 border-white shadow-lg ${color === "blue" ? "bg-brand-blue" : "bg-brand-cyan"} opacity-80`} />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm gap-2">
                      <MapPin className="w-8 h-8 opacity-20" />
                      <p className="text-xs">ค้นหาสถานที่หรือใช้ตำแหน่งปัจจุบัน</p>
                    </div>
                  )}
                  {draft && (
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 text-xs font-mono text-gray-600 shadow pointer-events-none">
                      {draft.lat.toFixed(5)}, {draft.lng.toFixed(5)}
                    </div>
                  )}
                  {draft && (
                    <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-lg pointer-events-none">
                      คลิกแผนที่เพื่อขยับหมุด
                    </div>
                  )}
                </div>
              </div>

              {/* Manual coords */}
              <div className="px-5 pb-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">{t(lang, "lp_lat")}</label>
                    <input
                      type="number"
                      step="0.00001"
                      className="input-field text-sm"
                      placeholder="13.7563"
                      value={draft?.lat ?? ""}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        if (!isNaN(v)) setDraft((prev) => ({ lat: v, lng: prev?.lng ?? 100.5 }));
                      }}
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
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        if (!isNaN(v)) setDraft((prev) => ({ lat: prev?.lat ?? 13.75, lng: v }));
                      }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={locating}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {locating
                    ? <Loader2 className="w-4 h-4 text-brand-blue animate-spin" />
                    : <Navigation className="w-4 h-4 text-brand-blue" />}
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
        </div>
      )}
    </div>
  );
}
