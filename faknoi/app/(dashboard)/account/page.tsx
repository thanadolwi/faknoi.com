"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Globe, Lock, Eye, EyeOff, Sun, Moon, Accessibility,
  Volume2, Brain, MoreHorizontal, Check, ChevronRight, LogOut
} from "lucide-react";

type Lang = "th" | "en";
type Theme = "light" | "dark";

const LABELS: Record<Lang, Record<string, string>> = {
  th: {
    title: "ตั้งค่าบัญชี",
    language: "ภาษา",
    langTH: "ภาษาไทย",
    langEN: "English",
    security: "ความปลอดภัย",
    changePassword: "เปลี่ยนรหัสผ่าน",
    currentPw: "รหัสผ่านปัจจุบัน",
    newPw: "รหัสผ่านใหม่",
    confirmPw: "ยืนยันรหัสผ่านใหม่",
    savePw: "บันทึกรหัสผ่าน",
    universal: "Universal Design",
    universalDesc: "ปรับแต่งการแสดงผลตามความต้องการของคุณ",
    visual: "ผู้พิการทางสายตา",
    visualDesc: "ขนาดตัวอักษรใหญ่ขึ้น, contrast สูง",
    hearing: "ผู้พิการทางการได้ยิน",
    hearingDesc: "แสดงคำบรรยายและการแจ้งเตือนด้วยภาพ",
    autism: "ออทิสติก",
    autismDesc: "ลด animation, UI เรียบง่ายขึ้น",
    other: "อื่นๆ",
    otherDesc: "ปรับแต่งเพิ่มเติมตามต้องการ",
    theme: "ธีม",
    themeLight: "Light",
    themeDark: "Dark",
    logout: "ออกจากระบบ",
    pwSuccess: "เปลี่ยนรหัสผ่านสำเร็จ",
    pwError: "รหัสผ่านไม่ตรงกัน",
    pwWrong: "รหัสผ่านปัจจุบันไม่ถูกต้อง",
    pwShort: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
  },
  en: {
    title: "Account Settings",
    language: "Language",
    langTH: "ภาษาไทย",
    langEN: "English",
    security: "Security",
    changePassword: "Change Password",
    currentPw: "Current Password",
    newPw: "New Password",
    confirmPw: "Confirm New Password",
    savePw: "Save Password",
    universal: "Universal Design",
    universalDesc: "Customize display for your needs",
    visual: "Visual Impairment",
    visualDesc: "Larger text, high contrast",
    hearing: "Hearing Impairment",
    hearingDesc: "Show captions and visual alerts",
    autism: "Autism",
    autismDesc: "Reduce animations, simpler UI",
    other: "Other",
    otherDesc: "Additional customization",
    theme: "Theme",
    themeLight: "Light",
    themeDark: "Dark",
    logout: "Sign Out",
    pwSuccess: "Password changed successfully",
    pwError: "Passwords do not match",
    pwWrong: "Current password is incorrect",
    pwShort: "Password must be at least 6 characters",
  },
};

export default function AccountPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("th");
  const [theme, setTheme] = useState<Theme>("light");
  const [udVisual, setUdVisual] = useState(false);
  const [udHearing, setUdHearing] = useState(false);
  const [udAutism, setUdAutism] = useState(false);
  const [udOther, setUdOther] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pwOpen, setPwOpen] = useState(false);

  const t = LABELS[lang];

  // Load from localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem("faknoi_lang") as Lang | null;
    const savedTheme = localStorage.getItem("faknoi_theme") as Theme | null;
    if (savedLang) setLang(savedLang);
    if (savedTheme) setTheme(savedTheme);
    setUdVisual(localStorage.getItem("ud_visual") === "1");
    setUdHearing(localStorage.getItem("ud_hearing") === "1");
    setUdAutism(localStorage.getItem("ud_autism") === "1");
    setUdOther(localStorage.getItem("ud_other") === "1");
  }, []);

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("faknoi_theme", theme);
  }, [theme]);

  // Apply UD
  useEffect(() => {
    document.documentElement.classList.toggle("ud-visual", udVisual);
    localStorage.setItem("ud_visual", udVisual ? "1" : "0");
  }, [udVisual]);
  useEffect(() => {
    document.documentElement.classList.toggle("ud-hearing", udHearing);
    localStorage.setItem("ud_hearing", udHearing ? "1" : "0");
  }, [udHearing]);
  useEffect(() => {
    document.documentElement.classList.toggle("ud-autism", udAutism);
    localStorage.setItem("ud_autism", udAutism ? "1" : "0");
  }, [udAutism]);
  useEffect(() => {
    localStorage.setItem("ud_other", udOther ? "1" : "0");
  }, [udOther]);

  function handleLang(l: Lang) {
    setLang(l);
    localStorage.setItem("faknoi_lang", l);
  }

  async function handleChangePw() {
    setPwMsg(null);
    if (newPw.length < 6) { setPwMsg({ type: "error", text: t.pwShort }); return; }
    if (newPw !== confirmPw) { setPwMsg({ type: "error", text: t.pwError }); return; }
    setPwLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) { setPwLoading(false); return; }
    // Re-authenticate
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPw });
    if (signInErr) { setPwMsg({ type: "error", text: t.pwWrong }); setPwLoading(false); return; }
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) { setPwMsg({ type: "error", text: error.message }); }
    else {
      setPwMsg({ type: "success", text: t.pwSuccess });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setPwOpen(false);
    }
    setPwLoading(false);
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const udItems = [
    { key: "visual", icon: Eye, val: udVisual, set: setUdVisual, label: t.visual, desc: t.visualDesc },
    { key: "hearing", icon: Volume2, val: udHearing, set: setUdHearing, label: t.hearing, desc: t.hearingDesc },
    { key: "autism", icon: Brain, val: udAutism, set: setUdAutism, label: t.autism, desc: t.autismDesc },
    { key: "other", icon: MoreHorizontal, val: udOther, set: setUdOther, label: t.other, desc: t.otherDesc },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-28 md:pb-10">
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-4">
        <h1 className="text-2xl font-black text-brand-navy">{t.title}</h1>

        {/* Language */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-5 h-5 text-brand-blue" />
            <span className="font-black text-brand-navy">{t.language}</span>
          </div>
          <div className="flex gap-2">
            {(["th", "en"] as Lang[]).map((l) => (
              <button key={l} onClick={() => handleLang(l)}
                className={`flex-1 py-2.5 rounded-2xl font-black text-sm transition-all duration-200 ${
                  lang === l
                    ? "text-white shadow-blue-sm"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
                style={lang === l ? { background: "linear-gradient(135deg,#5478FF,#53CBF3)" } : {}}>
                {l === "th" ? t.langTH : t.langEN}
              </button>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-5 h-5 text-brand-blue" />
            <span className="font-black text-brand-navy">{t.security}</span>
          </div>
          <button onClick={() => setPwOpen(!pwOpen)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-gray-50 hover:bg-brand-blue/5 transition-colors">
            <span className="font-bold text-gray-700">{t.changePassword}</span>
            <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${pwOpen ? "rotate-90" : ""}`} />
          </button>

          {pwOpen && (
            <div className="mt-3 space-y-3">
              {[
                { label: t.currentPw, val: currentPw, set: setCurrentPw, show: showCurrent, toggle: () => setShowCurrent(!showCurrent) },
                { label: t.newPw, val: newPw, set: setNewPw, show: showNew, toggle: () => setShowNew(!showNew) },
                { label: t.confirmPw, val: confirmPw, set: setConfirmPw, show: showConfirm, toggle: () => setShowConfirm(!showConfirm) },
              ].map(({ label, val, set, show, toggle }) => (
                <div key={label} className="relative">
                  <input type={show ? "text" : "password"} placeholder={label} value={val}
                    onChange={(e) => set(e.target.value)}
                    className="input-field pr-12" />
                  <button type="button" onClick={toggle}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-blue">
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              ))}
              {pwMsg && (
                <p className={`text-sm font-bold ${pwMsg.type === "success" ? "text-green-600" : "text-red-500"}`}>
                  {pwMsg.text}
                </p>
              )}
              <button onClick={handleChangePw} disabled={pwLoading} className="btn-primary w-full">
                {pwLoading ? "กำลังบันทึก..." : t.savePw}
              </button>
            </div>
          )}
        </div>

        {/* Universal Design */}
        <div className="card">
          <div className="flex items-center gap-2 mb-1">
            <Accessibility className="w-5 h-5 text-brand-blue" />
            <span className="font-black text-brand-navy">{t.universal}</span>
          </div>
          <p className="text-xs text-gray-400 mb-3">{t.universalDesc}</p>
          <div className="space-y-2">
            {udItems.map(({ key, icon: Icon, val, set, label, desc }) => (
              <button key={key} onClick={() => set(!val)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all duration-200 text-left ${
                  val ? "border-brand-blue bg-brand-blue/5" : "border-gray-100 bg-gray-50 hover:border-brand-blue/30"
                }`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  val ? "text-white" : "bg-gray-200 text-gray-500"
                }`} style={val ? { background: "linear-gradient(135deg,#5478FF,#53CBF3)" } : {}}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-black text-sm ${val ? "text-brand-navy" : "text-gray-700"}`}>{label}</p>
                  <p className="text-xs text-gray-400 truncate">{desc}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  val ? "border-brand-blue bg-brand-blue" : "border-gray-300"
                }`}>
                  {val && <Check className="w-3 h-3 text-white" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Sun className="w-5 h-5 text-brand-blue" />
            <span className="font-black text-brand-navy">{t.theme}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setTheme("light")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl font-black text-sm transition-all duration-200 ${
                theme === "light" ? "text-white shadow-blue-sm" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
              style={theme === "light" ? { background: "linear-gradient(135deg,#5478FF,#53CBF3)" } : {}}>
              <Sun className="w-4 h-4" /> {t.themeLight}
            </button>
            <button onClick={() => setTheme("dark")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl font-black text-sm transition-all duration-200 ${
                theme === "dark" ? "text-white shadow-blue-sm" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
              style={theme === "dark" ? { background: "linear-gradient(135deg,#111FA2,#5478FF)" } : {}}>
              <Moon className="w-4 h-4" /> {t.themeDark}
            </button>
          </div>
        </div>

        {/* Logout */}
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-red-500 bg-red-50 hover:bg-red-100 transition-colors">
          <LogOut className="w-4 h-4" /> {t.logout}
        </button>
      </div>
    </div>
  );
}
