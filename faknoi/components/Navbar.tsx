"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ShoppingBag, LayoutDashboard, MapPin, ClipboardList, Wallet, AlertTriangle, LogOut } from "lucide-react";
import clsx from "clsx";

const navItems = [
  { href: "/dashboard", label: "หน้าหลัก", icon: LayoutDashboard, emoji: "🏠" },
  { href: "/trips",     label: "ทริป",      icon: MapPin,           emoji: "🛵" },
  { href: "/orders",    label: "ออเดอร์",   icon: ClipboardList,    emoji: "📋" },
  { href: "/wallet",    label: "ถุงเงิน",   icon: Wallet,           emoji: "💰" },
  { href: "/report",    label: "รายงาน",    icon: AlertTriangle,    emoji: "🚨" },
];

export default function Navbar({ username }: { username: string }) {
  const router = useRouter();
  const pathname = usePathname();

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
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link key={href} href={href} className={clsx(
                  "flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-bold transition-all duration-200",
                  active
                    ? "text-white shadow-blue-sm"
                    : "text-gray-500 hover:text-brand-navy hover:bg-brand-blue/5"
                )}
                style={active ? {background:"linear-gradient(135deg,#5478FF,#53CBF3)"} : {}}>
                  <Icon className="w-4 h-4" />{label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-brand-blue/5 px-3 py-1.5 rounded-2xl border border-brand-blue/10">
              <div className="w-6 h-6 rounded-full hero-grad flex items-center justify-center">
                <span className="text-white text-[10px] font-black">{username[0]?.toUpperCase()}</span>
              </div>
              <span className="text-sm font-bold text-brand-navy">{username}</span>
            </div>
            <button onClick={handleLogout}
              className="p-2.5 rounded-2xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200">
              <LogOut className="w-4 h-4" />
            </button>
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
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full hero-grad flex items-center justify-center">
              <span className="text-white text-[10px] font-black">{username[0]?.toUpperCase()}</span>
            </div>
            <button onClick={handleLogout}
              className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100"
        style={{paddingBottom:"env(safe-area-inset-bottom)", boxShadow:"0 -4px 20px rgba(84,120,255,0.08)"}}>
        <div className="flex px-2 py-1">
          {navItems.map(({ href, label, emoji }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={href} href={href} className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-2xl transition-all duration-200">
                <div className={clsx(
                  "w-12 h-8 flex items-center justify-center rounded-2xl transition-all duration-200",
                  active ? "scale-110" : ""
                )}
                style={active ? {background:"linear-gradient(135deg,#5478FF,#53CBF3)"} : {}}>
                  <span className="text-xl leading-none">{emoji}</span>
                </div>
                <span className={clsx("text-[10px] font-black", active ? "text-brand-blue" : "text-gray-400")}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
