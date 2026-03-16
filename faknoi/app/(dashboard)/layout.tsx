"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import VisualAccessibility from "@/components/VisualAccessibility";
import { useLang } from "@/lib/LangContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { lang } = useLang();
  const [udVisual, setUdVisual] = useState(false);
  const [username, setUsername] = useState("ผู้ใช้");
  const router = useRouter();

  useEffect(() => {
    // load visual accessibility setting
    setUdVisual(localStorage.getItem("ud_visual") === "1");

    // listen for changes (when user toggles in account page)
    function onStorage(e: StorageEvent) {
      if (e.key === "ud_visual") setUdVisual(e.newValue === "1");
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    // get username from supabase
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      setUsername(user.user_metadata?.username || user.email?.split("@")[0] || "ผู้ใช้");
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar username={username} />
      <main className="max-w-5xl mx-auto px-4 py-6 pb-28 md:pb-8">
        {children}
      </main>
      {udVisual && <VisualAccessibility lang={lang} />}
    </div>
  );
}
