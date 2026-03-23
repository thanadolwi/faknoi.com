"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Banner {
  id: string;
  image_url: string;
  caption?: string | null;
  link_url?: string | null;
  created_at: string;
}

interface Props {
  initialBanners: Banner[];
}

export default function BannerSlider({ initialBanners }: Props) {
  const [banners, setBanners] = useState<Banner[]>(initialBanners);
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("banners-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "banners" }, (payload) => {
        setBanners((prev) => [...prev, payload.new as Banner]);
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "banners" }, (payload) => {
        setBanners((prev) => {
          const next = prev.filter((b) => b.id !== payload.old.id);
          setCurrent((c) => Math.min(c, Math.max(0, next.length - 1)));
          return next;
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % banners.length);
    }, 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [banners.length]);

  function goTo(idx: number) {
    setCurrent((idx + banners.length) % banners.length);
    if (timerRef.current) clearInterval(timerRef.current);
    if (banners.length > 1) {
      timerRef.current = setInterval(() => {
        setCurrent((c) => (c + 1) % banners.length);
      }, 4000);
    }
  }

  if (banners.length === 0) return null;

  const activeBanner = banners[current];

  return (
    <div className="w-full">
      {/* Slider */}
      <div className="relative w-full overflow-hidden rounded-3xl shadow-blue-sm"
        style={{ aspectRatio: "2160/900" }}>
        <div className="relative w-full h-full">
          {banners.map((b, i) => (
            <div key={b.id}
              className="absolute inset-0 transition-opacity duration-700"
              style={{ opacity: i === current ? 1 : 0, pointerEvents: i === current ? "auto" : "none" }}>
              <img src={b.image_url} alt={b.caption || `banner-${i + 1}`}
                className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        {banners.length > 1 && (
          <>
            <button onClick={() => goTo(current - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center transition-colors z-10">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => goTo(current + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center transition-colors z-10">
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {banners.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {banners.map((_, i) => (
              <button key={i} onClick={() => goTo(i)}
                className={`rounded-full transition-all duration-300 ${i === current ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"}`} />
            ))}
          </div>
        )}
      </div>

      {/* Caption */}
      {activeBanner.caption && (
        <div className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400 px-2">
          {activeBanner.link_url ? (
            <a
              href={activeBanner.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {activeBanner.caption}
            </a>
          ) : (
            <span>{activeBanner.caption}</span>
          )}
        </div>
      )}
    </div>
  );
}
