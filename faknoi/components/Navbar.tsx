"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ShoppingBag, LayoutDashboard, MapPin, ClipboardList, Wallet, AlertTriangle, LogOut, User, Settings, Bell, X } from "lucide-react";
import clsx from "clsx";
import { useLang } from "@/lib/LangContext";
import { t } from "@/lib/i18n";
import { MessageCircle } from "lucide-react";

export default function Navbar({ username }: { username: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const { lang } = useLang();
  const [isAdmin, setIsAdmin] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const [currentUserId, setCurrentUserId] = useState("");
  const [reportMsgPopup, setReportMsgPopup] = useState<{ subject: string; message: string } | null>(null);

  // Reset unread เมื่ออยู่ในหน้า orders หรือ order detail
  useEffect(() => {
    if (pathname.startsWith("/orders")) {
      setTotalUnread(0);
    }
  }, [pathname]);

  // Listen localStorage changes (เมื่อ OrderChat mark read)
  useEffect(() => {
    function recalcUnread() {
      // นับ unread จาก localStorage keys ที่มีอยู่
      // ถ้า key ไหน timestamp ใหม่กว่า last message ก็ถือว่าอ่านแล้ว
      // ง่ายสุดคือ reset เป็น 0 แล้วให้ realtime subscription นับใหม่
      setTotalUnread(0);
    }
    window.addEventListener("chat-all-read", recalcUnread);
    return () => window.removeEventListener("chat-all-read", recalcUnread);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setCurrentUserId(user.id);
      supabase.from("profiles").select("role, username").eq("id", user.id).single().then(({ data }) => {
        setIsAdmin(data?.role === "admin" || data?.username === "admin");
      });
    });
  }, []);

  // Subscribe to new messages across all user's active orders
  useEffect(() => {
    if (!currentUserId) return;
    const supabase = createClient();

    // Get active order IDs for this user (as buyer or shopper)
    async function subscribeUnread() {
      // Fetch orders where user is buyer
      const { data: buyerOrders } = await supabase
        .from("orders")
        .select("id")
        .eq("buyer_id", currentUserId)
        .not("status", "in", '("completed","cancelled")');

      // Fetch orders where user is shopper (via trips)
      const { data: myTrips } = await supabase
        .from("trips")
        .select("id")
        .eq("shopper_id", currentUserId)
        .not("status", "in", '("completed","cancelled")');
      const tripIds = (myTrips || []).map((tr: any) => tr.id);
      let shopperOrders: any[] = [];
      if (tripIds.length) {
        const { data } = await supabase
          .from("orders")
          .select("id")
          .in("trip_id", tripIds)
          .not("status", "in", '("completed","cancelled")');
        shopperOrders = data || [];
      }

      const allOrderIds = [
        ...new Set([
          ...(buyerOrders || []).map((o: any) => o.id),
          ...shopperOrders.map((o: any) => o.id),
        ]),
      ];

      if (!allOrderIds.length) return;

      const channel = supabase
        .channel(`navbar-unread-${currentUserId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages" },
          (payload) => {
            if (
              allOrderIds.includes(payload.new.order_id) &&
              payload.new.sender_id !== currentUserId
            ) {
              // ตรวจสอบว่า order นี้ถูกอ่านแล้วหรือยัง
              const readKey = `chat-read-${payload.new.order_id}`;
              const lastRead = localStorage.getItem(readKey);
              const msgTime = new Date(payload.new.created_at).getTime();
              if (!lastRead || msgTime > parseInt(lastRead)) {
                setTotalUnread((n) => n + 1);
              }
            }
          }
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }

    const cleanup = subscribeUnread();
    return () => { cleanup.then((fn) => fn && fn()); };
  }, [currentUserId]);

  // Admin: subscribe to new report messages from users
  useEffect(() => {
    if (!isAdmin || !currentUserId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`admin-report-msg-notify-${currentUserId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "report_messages" }, async (payload) => {
        if (payload.new.sender_id === currentUserId) return; // ignore own messages
        const supabase2 = createClient();
        const { data: rep } = await supabase2.from("reports").select("subject").eq("id", payload.new.report_id).single();
        setReportMsgPopup({ subject: rep?.subject || "รายงาน", message: payload.new.message });
        setTimeout(() => setReportMsgPopup(null), 6000);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAdmin, currentUserId]);

  const navItems = isAdmin ? [
    { href: "/admin",         label: "หน้าหลัก",  icon: LayoutDashboard, emoji: "🏠",  unread: 0 },
    { href: "/admin/users",   label: "ผู้ใช้งาน", icon: User,             emoji: "👤",  unread: 0 },
    { href: "/admin/areas",   label: "พื้นที่",   icon: MapPin,           emoji: "🏫",  unread: 0 },
    { href: "/admin/wallet",  label: "ถุงเงิน",   icon: Wallet,           emoji: "💰",  unread: 0 },
    { href: "/admin/reports", label: "รายงาน",    icon: AlertTriangle,    emoji: "📋",  unread: 0 },
  ] : [
    { href: "/dashboard", label: t(lang, "nav_home"),   icon: LayoutDashboard, emoji: "🏠",  unread: 0 },
    { href: "/trips",     label: t(lang, "nav_trips"),  icon: MapPin,           emoji: "🛵",  unread: 0 },
    { href: "/orders",    label: t(lang, "nav_orders"), icon: ClipboardList,    emoji: "📋",  unread: totalUnread },
    { href: "/wallet",    label: t(lang, "nav_wallet"), icon: Wallet,           emoji: "💰",  unread: 0 },
    { href: "/report",    label: t(lang, "nav_report"), icon: AlertTriangle,    emoji: "🚨",  unread: 0 },
  ];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Report message popup (admin) */}
      {reportMsgPopup && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[90vw] max-w-sm bg-brand-navy text-white rounded-3xl shadow-blue-md px-4 py-3 flex items-start gap-3 animate-pop">
          <Bell className="w-5 h-5 flex-shrink-0 mt-0.5 text-brand-yellow" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-brand-yellow">💬 ผู้ใช้ตอบกลับรายงาน</p>
            <p className="text-xs font-bold opacity-80 truncate">{reportMsgPopup.subject}</p>
            <p className="text-sm mt-0.5 line-clamp-2">{reportMsgPopup.message}</p>
          </div>
          <button onClick={() => setReportMsgPopup(null)} className="flex-shrink-0 opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Desktop */}
      <header className="hidden md:block bg-white border-b border-gray-100 sticky top-0 z-50"
        style={{boxShadow:"0 2px 12px rgba(84,120,255,0.06)"}}>
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-2xl hero-grad flex items-center justify-center shadow-blue-sm group-hover:scale-105 transition-transform duration-200">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-brand-navy tracking-tight text-lg">FakNoi</span>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.slice(0, 5).map(({ href, label, icon: Icon, unread }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link key={href} href={href} onClick={() => { if (href === "/orders") setTotalUnread(0); }}
                  className={clsx(
                  "relative flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-bold transition-all duration-200",
                  active ? "text-white shadow-blue-sm" : "text-gray-500 hover:text-brand-navy hover:bg-brand-blue/5"
                )} style={active ? {background:"linear-gradient(135deg,#5478FF,#53CBF3)"} : {}}>
                  <Icon className="w-4 h-4" />{label}
                  {(unread ?? 0) > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black px-1 py-0.5 rounded-full min-w-[16px] text-center leading-none">
                      {unread}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Account dropdown */}
          <div className="relative" ref={dropRef}>
            <button onClick={() => setOpen(!open)}
              className={clsx(
                "flex items-center gap-2 px-3 py-1.5 rounded-2xl border transition-all duration-200",
                open ? "border-brand-blue bg-brand-blue/5" : "border-brand-blue/10 bg-brand-blue/5 hover:border-brand-blue/30"
              )}>
              <div className="w-7 h-7 rounded-full hero-grad flex items-center justify-center">
                <span className="text-white text-xs font-black">{username[0]?.toUpperCase()}</span>
              </div>
              <span className="text-sm font-bold text-brand-navy">{username}</span>
            </button>

            {open && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-3xl border border-gray-100 shadow-blue-md overflow-hidden z-50 animate-pop">
                <div className="px-4 py-3 border-b border-gray-50">
                  <p className="text-xs text-gray-400 font-medium">{t(lang, "nav_logged_as")}</p>
                  <p className="font-black text-brand-navy">{username}</p>
                </div>
                <div className="p-2">
                  <Link href="/account" onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-bold text-gray-700 hover:bg-brand-blue/5 hover:text-brand-navy transition-colors">
                    <Settings className="w-4 h-4 text-brand-blue" /> {t(lang, "nav_settings")}
                  </Link>
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors">
                    <LogOut className="w-4 h-4" /> {t(lang, "nav_logout")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="md:hidden bg-white border-b border-gray-100 sticky top-0 z-50"
        style={{paddingTop:"env(safe-area-inset-top)", boxShadow:"0 2px 12px rgba(84,120,255,0.06)"}}>
        <div className="px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl hero-grad flex items-center justify-center shadow-blue-sm">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-brand-navy tracking-tight">FakNoi</span>
          </Link>
          <Link href="/account"
            className={clsx("w-8 h-8 rounded-full flex items-center justify-center transition-all",
              pathname.startsWith("/account") ? "ring-2 ring-brand-blue" : ""
            )}
            style={{background:"linear-gradient(135deg,#5478FF,#53CBF3)"}}>
            <span className="text-white text-xs font-black">{username[0]?.toUpperCase()}</span>
          </Link>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100"
        style={{paddingBottom:"env(safe-area-inset-bottom)", boxShadow:"0 -4px 20px rgba(84,120,255,0.08)"}}>
        <div className="flex px-1 py-1">
          {navItems.map(({ href, label, emoji, unread }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={href} href={href}
                onClick={() => { if (href === "/orders") setTotalUnread(0); }}
                className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-2xl transition-all duration-200">
                <div className={clsx("relative w-10 h-7 flex items-center justify-center rounded-2xl transition-all duration-200", active ? "scale-110" : "")}
                  style={active ? {background:"linear-gradient(135deg,#5478FF,#53CBF3)"} : {}}>
                  <span className="text-lg leading-none">{emoji}</span>
                  {(unread ?? 0) > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black px-1 py-0.5 rounded-full min-w-[16px] text-center leading-none">
                      {unread}
                    </span>
                  )}
                </div>
                <span className={clsx("text-[9px] font-black", active ? "text-brand-blue" : "text-gray-400")}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
