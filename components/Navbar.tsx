"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ShoppingBag, LayoutDashboard, MapPin, ClipboardList, LogOut, User } from "lucide-react";
import clsx from "clsx";

const navItems = [
  { href: "/dashboard", label: "หน้าหลัก", icon: LayoutDashboard },
  { href: "/trips",     label: "ทริป",      icon: MapPin },
  { href: "/orders",    label: "ออเดอร์",   icon: ClipboardList },
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
      <header className="hidden md:block bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-navy flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5 text-brand-yellow" />
            </div>
            <span className="font-bold text-brand-navy">FakNoi</span>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === href || pathname.startsWith(href + "/")
                    ? "bg-brand-blue/10 text-brand-blue"
                    : "text-gray-500 hover:text-brand-navy hover:bg-gray-50"
                )}>
                <Icon className="w-4 h-4" />{label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              สวัสดี, <span className="font-semibold text-brand-navy">{username}</span>
            </span>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors px-3 py-2 rounded-lg hover:bg-red-50">
              <LogOut className="w-4 h-4" />ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="md:hidden bg-white border-b border-gray-100 sticky top-0 z-50"
        style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-navy flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5 text-brand-yellow" />
            </div>
            <span className="font-bold text-brand-navy">FakNoi</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">{username}</span>
            <button onClick={handleLogout}
              className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={href} href={href}
                className={clsx(
                  "flex-1 flex flex-col items-center gap-1 py-3 transition-colors",
                  active ? "text-brand-blue" : "text-gray-400"
                )}>
                <Icon className={clsx("w-5 h-5", active && "scale-110 transition-transform")} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
