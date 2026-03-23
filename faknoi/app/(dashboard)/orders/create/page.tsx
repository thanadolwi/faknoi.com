"use client";

export const dynamic = "force-dynamic";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Plus, Trash2, ShoppingBag } from "lucide-react";
import Link from "next/link";
import type { OrderItem } from "@/lib/types";
import { useLang } from "@/lib/LangContext";
import { t } from "@/lib/i18n";

const emptyItem = (): OrderItem => ({
  shop_name: "", item_name: "", quantity: 1, note: "", fallback_option: "",
});

export default function CreateOrderPage() {
  return (
    <Suspense>
      <CreateOrderForm />
    </Suspense>
  );
}

function CreateOrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tripId = searchParams.get("trip_id") || "";
  const { lang } = useLang();

  const [items, setItems] = useState<OrderItem[]>([emptyItem()]);
  const [estimatedPrice, setEstimatedPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateItem(index: number, field: keyof OrderItem, value: string | number) {
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }

  function addItem() { setItems((prev) => [...prev, emptyItem()]); }
  function removeItem(index: number) { setItems((prev) => prev.filter((_, i) => i !== index)); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tripId) { setError(t(lang, "co_err_no_trip")); return; }
    const validItems = items.filter((i) => i.shop_name && i.item_name);
    if (validItems.length === 0) { setError(t(lang, "co_err_no_items")); return; }

    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const accessibilityMode = (() => {
      if (localStorage.getItem("ud_visual") === "1") return "visual";
      if (localStorage.getItem("ud_hearing") === "1") return "hearing";
      if (localStorage.getItem("ud_autism") === "1") return "autism";
      if (localStorage.getItem("ud_other") === "1") return "other";
      return "normal";
    })();

    const { error: insertError } = await supabase.from("orders").insert({
      trip_id: tripId, buyer_id: user.id, items: validItems,
      estimated_price: parseFloat(estimatedPrice) || 0,
      status: "pending", payment_confirmed: false,
      accessibility_mode: accessibilityMode,
    });

    if (insertError) { setError(t(lang, "co_err_generic")); setLoading(false); return; }
    await supabase.rpc("increment_trip_orders", { trip_id: tripId });
    router.push("/orders");
    router.refresh();
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href={tripId ? `/trips/${tripId}` : "/trips"} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-brand-navy">{t(lang, "co_title")}</h1>
          <p className="text-sm text-gray-400">{t(lang, "co_subtitle")}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-brand-navy flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-brand-blue" />
                {t(lang, "co_item_no")} {index + 1}
              </span>
              {items.length > 1 && (
                <button type="button" onClick={() => removeItem(index)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">{t(lang, "co_shop_name")} *</label>
                <input type="text" className="input-field text-sm" placeholder={t(lang, "co_shop_placeholder")}
                  value={item.shop_name} onChange={(e) => updateItem(index, "shop_name", e.target.value)} required />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">{t(lang, "co_item_name")} *</label>
                <input type="text" className="input-field text-sm" placeholder={t(lang, "co_item_placeholder")}
                  value={item.item_name} onChange={(e) => updateItem(index, "item_name", e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">{t(lang, "co_quantity")}</label>
                <input type="number" className="input-field text-sm" min={1} value={item.quantity}
                  onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value))} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">{t(lang, "co_note")}</label>
                <input type="text" className="input-field text-sm" placeholder={t(lang, "co_note_placeholder")}
                  value={item.note} onChange={(e) => updateItem(index, "note", e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">{t(lang, "co_fallback")}</label>
              <input type="text" className="input-field text-sm" placeholder={t(lang, "co_fallback_placeholder")}
                value={item.fallback_option} onChange={(e) => updateItem(index, "fallback_option", e.target.value)} />
            </div>
          </div>
        ))}

        <button type="button" onClick={addItem}
          className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm text-gray-400 hover:border-brand-blue hover:text-brand-blue transition-colors flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" />{t(lang, "co_add_item")}
        </button>

        <div className="card">
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t(lang, "co_est_price")}</label>
          <input type="number" className="input-field" placeholder="0"
            value={estimatedPrice} onChange={(e) => setEstimatedPrice(e.target.value)} />
          <p className="text-xs text-gray-400 mt-1.5">{t(lang, "co_est_hint")}</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">{error}</div>}

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-3">
          <span className="text-lg flex-shrink-0">⚠️</span>
          <div className="text-xs text-amber-800 space-y-1">
            <p className="font-black">ข้อควรระวัง</p>
            <p>FakNoi เป็นเพียงตัวกลางในการเชื่อมต่อระหว่างผู้ฝากหิ้วและผู้รับหิ้วเท่านั้น ไม่มีส่วนเกี่ยวข้องกับสินค้าหรือบริการที่สั่ง</p>
            <p>การสั่งสินค้า <span className="font-black">ผิดกฎหมาย สินค้าต้องห้าม หรือสิ่งผิดกฎหมายทุกประเภท</span> ถือเป็นความรับผิดชอบของผู้ใช้งานโดยตรง FakNoi ขอสงวนสิทธิ์ระงับบัญชีและดำเนินการตามกฎหมายกับผู้ที่กระทำผิด</p>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
          {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
          {loading ? t(lang, "co_submitting") : t(lang, "co_confirm")}
        </button>
      </form>
    </div>
  );
}
