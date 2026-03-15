"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ShoppingCart, Truck, CheckCircle } from "lucide-react";
import type { TripStatus } from "@/lib/types";

const nextStatus: Partial<Record<TripStatus, { status: TripStatus; label: string; icon: React.ReactNode }>> = {
  open:      { status: "shopping",   label: "เริ่มซื้อของแล้ว",  icon: <ShoppingCart className="w-4 h-4" /> },
  shopping:  { status: "delivering", label: "กำลังไปส่ง",        icon: <Truck className="w-4 h-4" /> },
  delivering:{ status: "completed",  label: "ส่งครบแล้ว",        icon: <CheckCircle className="w-4 h-4" /> },
};

export default function TripStatusActions({ tripId, currentStatus }: { tripId: string; currentStatus: TripStatus }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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
      {loading ? "กำลังอัปเดต..." : next.label}
    </button>
  );
}
