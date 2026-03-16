"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { useLang } from "@/lib/LangContext";
import { t } from "@/lib/i18n";

export default function CountdownTimer({ cutoffTime }: { cutoffTime: string }) {
  const { lang } = useLang();
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(cutoffTime));

  function getTimeLeft(target: string) {
    const diff = new Date(target).getTime() - Date.now();
    if (diff <= 0) return null;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { h, m, s, diff };
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(cutoffTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [cutoffTime]);

  if (!timeLeft) {
    return (
      <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-2.5 rounded-xl">
        <Clock className="w-4 h-4" />
        <span className="font-semibold">{t(lang, "timer_expired")}</span>
      </div>
    );
  }

  const isUrgent  = timeLeft.diff < 10 * 60 * 1000;
  const isWarning = timeLeft.diff < 30 * 60 * 1000;

  const bgColor   = isUrgent ? "bg-red-50 border-red-200"       : isWarning ? "bg-yellow-50 border-yellow-200"   : "bg-brand-blue/5 border-brand-blue/20";
  const textColor = isUrgent ? "text-red-600"                   : isWarning ? "text-yellow-700"                  : "text-brand-navy dark:text-white";
  const dotColor  = isUrgent ? "bg-red-500"                     : isWarning ? "bg-yellow-500"                    : "bg-brand-blue";

  return (
    <div className={`flex items-center gap-3 border px-4 py-2.5 rounded-xl ${bgColor}`}>
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full animate-pulse ${dotColor}`} />
        <Clock className={`w-4 h-4 ${textColor}`} />
      </div>
      <span className={`text-sm font-medium ${textColor}`}>{t(lang, "timer_cutoff_in")}</span>
      <div className="flex items-center gap-1">
        {timeLeft.h > 0 && (
          <>
            <span className={`font-mono font-bold text-lg tabular-nums ${textColor}`}>
              {String(timeLeft.h).padStart(2, "0")}
            </span>
            <span className={`text-xs ${textColor} opacity-60`}>{t(lang, "timer_h")}</span>
          </>
        )}
        <span className={`font-mono font-bold text-lg tabular-nums ${textColor}`}>
          {String(timeLeft.m).padStart(2, "0")}
        </span>
        <span className={`text-xs ${textColor} opacity-60`}>{t(lang, "timer_m")}</span>
        <span className={`font-mono font-bold text-lg tabular-nums ${textColor}`}>
          {String(timeLeft.s).padStart(2, "0")}
        </span>
        <span className={`text-xs ${textColor} opacity-60`}>{t(lang, "timer_s")}</span>
      </div>
    </div>
  );
}
