"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ShoppingBag, LayoutDashboard, MapPin, ClipboardList, LogOut } from "lucide-react";
import clsx from "clsx";

const navItems = [
  { href: "/dashboard", label: "หน้าหลัก", icon: LayoutDashboard, emoji: "🏠" },
  { href: "/trips",     label: "ทริป",      icon: MapPin,           emoji: "🛵" },
  { href: "/orders",    label: "ออเดอร์",   icon: ClipboardList,    emoji: "📋" },
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
      {/* Desktop top navbar */}
      <header className="hidden md:block bg-white/70 backdrop-blur-xl border-b border-white/80 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-2xl bg-brand-navy flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
              <ShoppingBag className="w-4.5 h-4.5 text-brand-yellow" />
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
                    ? "bg-brand-blue text-white shadow-md shadow-brand-blue/25"
                    : "text-gray-500 hover:text-brand-navy hover:bg-brand-blue/5"
                )}>
                  <Icon className="w-4 h-4" />{label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-brand-blue/5 px-3 py-1.5 rounded-2xl">
              <div className="w-6 h-6 rounded-full bg-brand-navy flex items-center justify-center">
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
      <header className="md:hidden bg-white/70 backdrop-blur-xl border-b border-white/80 sticky top-0 z-50"
        style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-navy flex items-center justify-center shadow-md">
              <ShoppingBag className="w-4 h-4 text-brand-yellow" />
            </div>
            <span className="font-black text-brand-navy tracking-tight">FakNoi</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-brand-navy flex items-center justify-center">
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-white/80 shadow-lg"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex px-2 py-1">
          {navItems.map(({ href, label, emoji }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={href} href={href} className={clsx(
                "flex-1 flex flex-col items-center gap-0.5 py-2 rounded-2xl transition-all duration-200",
                active ? "text-brand-blue" : "text-gray-400"
              )}>
                <div className={clsx(
                  "w-12 h-8 flex items-center justify-center rounded-2xl transition-all duration-200",
                  active && "bg-brand-blue/10 scale-110"
                )}>
                  <span className="text-xl leading-none">{emoji}</span>
                </div>
                <span className={clsx("text-[10px] font-bold", active ? "text-brand-blue" : "text-gray-400")}>
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
