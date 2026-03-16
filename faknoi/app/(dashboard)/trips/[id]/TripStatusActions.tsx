"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ShoppingCart, Truck, CheckCircle } from "lucide-react";
import type { TripStatus } from "@/lib/types";
import { useLang } from "@/lib/LangContext";
import { t } from "@/lib/i18n";

export default function TripStatusActions({ tripId, currentStatus }: { tripId: string; currentStatus: TripStatus }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { lang } = useLang();

  type NextInfo = { status: TripStatus; labelKey: string; icon: React.ReactNode };
  const nextStatus: Partial<Record<TripStatus, NextInfo>> = {
    open:       { status: "shopping",   labelKey: "tsa_open",       icon: <ShoppingCart className="w-4 h-4" /> },
    shopping:   { status: "delivering", labelKey: "tsa_shopping",   icon: <Truck className="w-4 h-4" /> },
    delivering: { status: "completed",  labelKey: "tsa_delivering", icon: <CheckCircle className="w-4 h-4" /> },
  };

  const next = nextStatus[currentStatus];
  if (!next) return null;

  async function advance() {
    setLoading(true);
    const supabase = createClient();
    await supabase.from("trips").update({
      status: next!.status,
      ...(next!.status === "completed" ? { closed_at: new Date().toISOString() } : {}),
    }).eq("id", tripId);
    router.refresh();
    setLoading(false);
  }

  return (
    <button onClick={advance} disabled={loading} className="btn-secondary w-full flex items-center justify-center gap-2 text-sm">
      {loading ? <span className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-600 rounded-full animate-spin" /> : next.icon}
      {loading ? t(lang, "osa_updating") : t(lang, next.labelKey)}
    </button>
  );
}
