"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import VisualAccessibility from "@/components/VisualAccessibility";
import AdminNotificationBanner from "@/components/AdminNotificationBanner";
import { useLang } from "@/lib/LangContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { lang } = useLang();
  const [ttsActive, setTtsActive] = useState(false);
  const [username, setUsername] = useState("ผู้ใช้");
  const router = useRouter();

  useEffect(() => {
    // Apply all UD classes from localStorage on mount
    const udVisual = localStorage.getItem("ud_visual") === "1";
    const udHearing = localStorage.getItem("ud_hearing") === "1";
    const udAutism = localStorage.getItem("ud_autism") === "1";
    const udOtherTTS = localStorage.getItem("ud_other_tts") === "1";
    const udOtherReduceUI = localStorage.getItem("ud_other_reduce_ui") === "1";
    const udOtherColorBlind = localStorage.getItem("ud_other_colorblind") === "1";
    document.documentElement.classList.toggle("ud-visual", udVisual);
    document.documentElement.classList.toggle("ud-hearing", udHearing);
    document.documentElement.classList.toggle("ud-autism", udAutism);
    document.documentElement.classList.toggle("ud-other-tts", udOtherTTS);
    document.documentElement.classList.toggle("ud-other-reduce-ui", udOtherReduceUI);
    document.documentElement.classList.toggle("ud-other-colorblind", udOtherColorBlind);
    setTtsActive(udVisual || udOtherTTS);

    function onStorage(e: StorageEvent) {
      if (e.key === "ud_visual") {
        document.documentElement.classList.toggle("ud-visual", e.newValue === "1");
        setTtsActive(e.newValue === "1" || localStorage.getItem("ud_other_tts") === "1");
      }
      if (e.key === "ud_other_tts") {
        document.documentElement.classList.toggle("ud-other-tts", e.newValue === "1");
        setTtsActive(localStorage.getItem("ud_visual") === "1" || e.newValue === "1");
      }
      if (e.key === "ud_other_reduce_ui") document.documentElement.classList.toggle("ud-other-reduce-ui", e.newValue === "1");
      if (e.key === "ud_other_colorblind") document.documentElement.classList.toggle("ud-other-colorblind", e.newValue === "1");
      if (e.key === "ud_autism") document.documentElement.classList.toggle("ud-autism", e.newValue === "1");
      if (e.key === "ud_hearing") document.documentElement.classList.toggle("ud-hearing", e.newValue === "1");
    }
    function onUdChange(e: Event) {
      const val = (e as CustomEvent).detail === "1";
      setTtsActive(val || localStorage.getItem("ud_other_tts") === "1");
    }
    window.addEventListener("storage", onStorage);
    window.addEventListener("ud_visual_change", onUdChange);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("ud_visual_change", onUdChange);
    };
  }, []);

  useEffect(() => {
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
        <AdminNotificationBanner />
        {children}
      </main>
      {ttsActive && <VisualAccessibility lang={lang} />}
    </div>
  );
}
