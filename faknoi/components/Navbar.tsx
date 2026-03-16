"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ShoppingBag, LayoutDashboard, MapPin, ClipboardList, Wallet, AlertTriangle, LogOut, User, Settings } from "lucide-react";
import clsx from "clsx";
import { useLang } from "@/lib/LangContext";
import { t } from "@/lib/i18n";

export default function Navbar({ username }: { username: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const { lang } = useLang();

  const navItems = [
    { href: "/dashboard", label: t(lang, "nav_home"),   icon: LayoutDashboard, emoji: "🏠" },
    { href: "/trips",     label: t(lang, "nav_trips"),  icon: MapPin,           emoji: "🛵" },
    { href: "/orders",    label: t(lang, "nav_orders"), icon: ClipboardList,    emoji: "📋" },
    { href: "/wallet",    label: t(lang, "nav_wallet"), icon: Wallet,           emoji: "💰" },
    { href: "/report",    label: t(lang, "nav_report"), icon: AlertTriangle,    emoji: "🚨" },
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
            {navItems.slice(0, 5).map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link key={href} href={href} className={clsx(
                  "flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-bold transition-all duration-200",
                  active ? "text-white shadow-blue-sm" : "text-gray-500 hover:text-brand-navy hover:bg-brand-blue/5"
                )} style={active ? {background:"linear-gradient(135deg,#5478FF,#53CBF3)"} : {}}>
                  <Icon className="w-4 h-4" />{label}
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
          {navItems.map(({ href, label, emoji }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={href} href={href} className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-2xl transition-all duration-200">
                <div className={clsx("w-10 h-7 flex items-center justify-center rounded-2xl transition-all duration-200", active ? "scale-110" : "")}
                  style={active ? {background:"linear-gradient(135deg,#5478FF,#53CBF3)"} : {}}>
                  <span className="text-lg leading-none">{emoji}</span>
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
