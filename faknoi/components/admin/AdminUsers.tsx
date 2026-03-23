"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, ArrowLeft, ArrowRight, Loader2, Trash2, XCircle, AlertCircle, Coins } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  outstanding_balance: number;
  coins: number;
  created_at: string;
}

export default function AdminUsers() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [actionModal, setActionModal] = useState<{ type: string; id: string; label: string } | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [editCoins, setEditCoins] = useState(false);
  const [coinsInput, setCoinsInput] = useState("");
  const [savingCoins, setSavingCoins] = useState(false);

  async function searchUsers(q: string) {
    setQuery(q);
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    const res = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setResults(data.users || []);
    setSearching(false);
  }

  const loadUser = useCallback(async (user: UserProfile) => {
    setSelectedUser(user);
    setResults([]);
    setQuery(user.username);
    setLoadingUser(true);
    const res = await fetch(`/api/admin/users?userId=${user.id}`);
    const data = await res.json();
    setUserData(data);
    if (data.profile) {
      setSelectedUser((prev) => prev ? {
        ...prev,
        coins: data.profile.coins ?? prev.coins,
        outstanding_balance: data.profile.outstanding_balance ?? prev.outstanding_balance,
      } : prev);
    }
    setLoadingUser(false);
  }, []);

  useEffect(() => {
    if (!selectedUser?.id) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`admin-user-${selectedUser.id}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "profiles",
        filter: `id=eq.${selectedUser.id}`,
      }, (payload) => {
        const p = payload.new as any;
        setSelectedUser((prev) => prev ? {
          ...prev,
          coins: p.coins ?? prev.coins,
          outstanding_balance: p.outstanding_balance ?? prev.outstanding_balance,
          role: p.role ?? prev.role,
        } : prev);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedUser?.id]);

  async function performAction() {
    if (!actionModal || !selectedUser) return;
    setActionLoading(true);
    await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: actionModal.type,
        targetUserId: selectedUser.id,
        tripId: actionModal.type.includes("trip") ? actionModal.id : undefined,
        orderId: actionModal.type.includes("order") ? actionModal.id : undefined,
        note: actionNote,
      }),
    });
    setActionModal(null);
    setActionNote("");
    setActionLoading(false);
    await loadUser(selectedUser);
  }

  async function saveCoins() {
    if (!selectedUser) return;
    const val = parseInt(coinsInput);
    if (isNaN(val) || val < 0) return;
    setSavingCoins(true);
    await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "adjust_coins",
        targetUserId: selectedUser.id,
        coins: val,
        note: `Admin adjusted coins to ${val}`,
      }),
    });
    setSavingCoins(false);
    setEditCoins(false);
    await loadUser(selectedUser);
  }

  const statusLabel: Record<string, string> = {
    pending: "รอรับ", accepted: "รับแล้ว", shopping: "กำลังซื้อ",
    bought: "ซื้อแล้ว", delivering: "กำลังส่ง", completed: "สำเร็จ", cancelled: "ยกเลิก",
    open: "เปิด", closed: "ปิด",
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-brand-navy">👤 ผู้ใช้งาน</h1>
          <p className="text-sm text-gray-400">ค้นหาและจัดการบัญชีผู้ใช้</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" className="input-field pl-9" placeholder="ค้นหา Username..."
          value={query} onChange={(e) => searchUsers(e.target.value)} />
        {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />}
        {results.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-lg z-10 overflow-hidden">
            {results.map((u) => (
              <button key={u.id} type="button" onClick={() => loadUser(u)}
                className="w-full text-left px-4 py-3 hover:bg-brand-blue/5 transition-colors border-b border-gray-50 last:border-0">
                <p className="font-bold text-brand-navy">@{u.username}</p>
                <p className="text-xs text-gray-400">{u.email}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {loadingUser && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-brand-blue animate-spin" /></div>}

      {selectedUser && userData && !loadingUser && (
        <div className="space-y-4">
          <div className="card space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-black text-brand-navy text-lg">@{selectedUser.username}</p>
                <p className="text-xs text-gray-400">{selectedUser.email}</p>
              </div>
              <span className={`pill ${selectedUser.role === "admin" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                {selectedUser.role}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-gray-50 rounded-xl px-3 py-2">
                <p className="text-gray-400">ค้างชำระ</p>
                <p className="font-black text-brand-navy">฿{Number(selectedUser.outstanding_balance || 0).toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl px-3 py-2">
                <p className="text-gray-400">คอยน์</p>
                <div className="flex items-center gap-1">
                  <Coins className="w-3 h-3 text-brand-blue" />
                  <p className="font-black text-brand-navy">{selectedUser.coins || 0}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl px-3 py-2">
                <p className="text-gray-400">สมัครเมื่อ</p>
                <p className="font-black text-brand-navy">{new Date(selectedUser.created_at).toLocaleDateString("th-TH")}</p>
              </div>
            </div>
            {!editCoins ? (
              <button onClick={() => { setEditCoins(true); setCoinsInput(String(selectedUser.coins || 0)); }}
                className="text-xs text-brand-blue hover:underline">
                ✏️ ปรับคอยน์
              </button>
            ) : (
              <div className="flex gap-2 items-center">
                <input type="number" min="0" className="input-field text-sm flex-1"
                  value={coinsInput} onChange={(e) => setCoinsInput(e.target.value)} />
                <button onClick={saveCoins} disabled={savingCoins}
                  className="text-xs font-bold px-3 py-2 rounded-xl bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20 transition-colors">
                  {savingCoins ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "บันทึก"}
                </button>
                <button onClick={() => setEditCoins(false)}
                  className="text-xs px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                  ยกเลิก
                </button>
              </div>
            )}
          </div>

          {userData.trips?.length > 0 && (
            <div>
              <h3 className="font-black text-brand-navy text-sm mb-2">🛵 ทริป ({userData.trips.length})</h3>
              <div className="space-y-2">
                {userData.trips.map((trip: any) => (
                  <div key={trip.id} className="card flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-bold text-brand-navy">{trip.origin_zone} → {trip.destination_zone}</p>
                      <p className="text-xs text-gray-400">{statusLabel[trip.status] || trip.status} · {new Date(trip.created_at).toLocaleDateString("th-TH")}</p>
                    </div>
                    <div className="flex gap-1">
                      <Link href={`/trips/${trip.id}`} className="p-1.5 rounded-lg bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20 transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                      {trip.status !== "cancelled" && trip.status !== "completed" && (
                        <>
                          <button onClick={() => setActionModal({ type: "cancel_trip", id: trip.id, label: `ยกเลิกทริป` })}
                            className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors">
                            <XCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => setActionModal({ type: "delete_trip", id: trip.id, label: `ลบทริป` })}
                            className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {userData.orders?.length > 0 && (
            <div>
              <h3 className="font-black text-brand-navy text-sm mb-2">📋 ออเดอร์ ({userData.orders.length})</h3>
              <div className="space-y-2">
                {userData.orders.map((order: any) => (
                  <div key={order.id} className="card flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-bold text-brand-navy">{order.trips?.origin_zone} → {order.trips?.destination_zone}</p>
                      <p className="text-xs text-gray-400">{statusLabel[order.status] || order.status} · {new Date(order.created_at).toLocaleDateString("th-TH")}</p>
                    </div>
                    {order.status !== "cancelled" && order.status !== "completed" && (
                      <button onClick={() => setActionModal({ type: "cancel_order", id: order.id, label: "ยกเลิกออเดอร์" })}
                        className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {userData.actions?.length > 0 && (
            <div>
              <h3 className="font-black text-brand-navy text-sm mb-2">📝 ประวัติการดำเนินการ</h3>
              <div className="space-y-2">
                {userData.actions.map((a: any) => (
                  <div key={a.id} className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                    <p className="text-xs font-bold text-red-700">{a.action_type}</p>
                    {a.note && <p className="text-xs text-red-600 mt-0.5">{a.note}</p>}
                    <p className="text-xs text-red-400 mt-1">{new Date(a.created_at).toLocaleString("th-TH")}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-black text-brand-navy">ยืนยันการดำเนินการ</p>
                <p className="text-sm text-gray-600 mt-1">{actionModal.label}</p>
              </div>
            </div>
            <textarea className="input-field text-sm resize-none" rows={3}
              placeholder="ระบุเหตุผล..." value={actionNote}
              onChange={(e) => setActionNote(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={performAction} disabled={actionLoading || !actionNote.trim()}
                className="btn-primary flex-1 text-sm py-2.5 flex items-center justify-center gap-2">
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                ยืนยัน
              </button>
              <button onClick={() => { setActionModal(null); setActionNote(""); }}
                className="flex-1 text-sm py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
