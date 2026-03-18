"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Globe, Lock, Eye, EyeOff, Sun, Moon, Accessibility,
  Volume2, Brain, MoreHorizontal, Check, ChevronRight, LogOut,
  Mic, Palette, Layers
} from "lucide-react";
import VisualAccessibility from "@/components/VisualAccessibility";
import { useLang, type Lang } from "@/lib/LangContext";

type Theme = "light" | "dark";

const LANG_OPTIONS: { value: Lang; label: string; flag: string }[] = [
  { value: "th", label: "ภาษาไทย",  flag: "🇹🇭" },
  { value: "en", label: "English",   flag: "🇬🇧" },
  { value: "zh", label: "中文",       flag: "🇨🇳" },
  { value: "hi", label: "हिन्दी",     flag: "🇮🇳" },
];

const LABELS: Record<Lang, Record<string, string>> = {
  th: {
    title: "ตั้งค่าบัญชี",
    language: "ภาษา",
    security: "ความปลอดภัย",
    changePassword: "เปลี่ยนรหัสผ่าน",
    currentPw: "รหัสผ่านปัจจุบัน",
    newPw: "รหัสผ่านใหม่",
    confirmPw: "ยืนยันรหัสผ่านใหม่",
    savePw: "บันทึกรหัสผ่าน",
    saving: "กำลังบันทึก...",
    universal: "Universal Design",
    universalDesc: "ปรับแต่งการแสดงผลตามความต้องการของคุณ",
    visual: "ผู้พิการทางสายตา",
    visualDesc: "จอสีดำ contrast สูง + อ่านข้อความออกเสียง",
    hearing: "ผู้พิการทางการได้ยิน",
    hearingDesc: "แสดงคำบรรยายและการแจ้งเตือนด้วยภาพ",
    autism: "ออทิสติก",
    autismDesc: "ลด animation, UI เรียบง่ายขึ้น",
    other: "อื่นๆ",
    otherDesc: "ปรับแต่งเพิ่มเติมตามต้องการ",
    otherTTS: "อ่านข้อความออกเสียง",
    otherTTSDesc: "แตะข้อความใดก็ได้เพื่อฟังเสียงอ่าน",
    otherReduceUI: "ลด UI",
    otherReduceUIDesc: "ซ่อน gradient, shadow และ decoration",
    otherColorBlind: "สำหรับตาบอดสี",
    otherColorBlindDesc: "ปรับสีให้แยกแยะได้ง่ายขึ้น",
    theme: "ธีม",
    themeLight: "Light",
    themeDark: "Dark",
    logout: "ออกจากระบบ",
    pwSuccess: "เปลี่ยนรหัสผ่านสำเร็จ",
    pwError: "รหัสผ่านไม่ตรงกัน",
    pwWrong: "รหัสผ่านปัจจุบันไม่ถูกต้อง",
    pwShort: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
    ttsNote: "* เมื่อเปิดโหมดนี้ แตะที่ข้อความใดก็ได้เพื่อฟังเสียงอ่าน",
  },
  en: {
    title: "Account Settings",
    language: "Language",
    security: "Security",
    changePassword: "Change Password",
    currentPw: "Current Password",
    newPw: "New Password",
    confirmPw: "Confirm New Password",
    savePw: "Save Password",
    saving: "Saving...",
    universal: "Universal Design",
    universalDesc: "Customize display for your needs",
    visual: "Visual Impairment",
    visualDesc: "Black screen high contrast + text-to-speech",
    hearing: "Hearing Impairment",
    hearingDesc: "Show captions and visual alerts",
    autism: "Autism",
    autismDesc: "Reduce animations, simpler UI",
    other: "Other",
    otherDesc: "Additional customization",
    otherTTS: "Text-to-Speech",
    otherTTSDesc: "Tap any text to hear it read aloud",
    otherReduceUI: "Reduce UI",
    otherReduceUIDesc: "Hide gradients, shadows and decorations",
    otherColorBlind: "Color Blind Mode",
    otherColorBlindDesc: "Adjust colors for easier distinction",
    theme: "Theme",
    themeLight: "Light",
    themeDark: "Dark",
    logout: "Sign Out",
    pwSuccess: "Password changed successfully",
    pwError: "Passwords do not match",
    pwWrong: "Current password is incorrect",
    pwShort: "Password must be at least 6 characters",
    ttsNote: "* When enabled, tap any text to hear it read aloud",
  },
  zh: {
    title: "账户设置",
    language: "语言",
    security: "安全",
    changePassword: "更改密码",
    currentPw: "当前密码",
    newPw: "新密码",
    confirmPw: "确认新密码",
    savePw: "保存密码",
    saving: "保存中...",
    universal: "无障碍设计",
    universalDesc: "根据您的需求自定义显示",
    visual: "视觉障碍",
    visualDesc: "黑色高对比度屏幕 + 文字转语音",
    hearing: "听觉障碍",
    hearingDesc: "显示字幕和视觉提醒",
    autism: "自闭症",
    autismDesc: "减少动画，简化界面",
    other: "其他",
    otherDesc: "其他自定义设置",
    otherTTS: "文字转语音",
    otherTTSDesc: "点击任意文字即可听到朗读",
    otherReduceUI: "简化界面",
    otherReduceUIDesc: "隐藏渐变、阴影和装饰",
    otherColorBlind: "色盲模式",
    otherColorBlindDesc: "调整颜色以便于区分",
    theme: "主题",
    themeLight: "浅色",
    themeDark: "深色",
    logout: "退出登录",
    pwSuccess: "密码更改成功",
    pwError: "密码不匹配",
    pwWrong: "当前密码不正确",
    pwShort: "密码至少需要6个字符",
    ttsNote: "* 启用后，点击任意文字即可听到朗读",
  },
  hi: {
    title: "खाता सेटिंग",
    language: "भाषा",
    security: "सुरक्षा",
    changePassword: "पासवर्ड बदलें",
    currentPw: "वर्तमान पासवर्ड",
    newPw: "नया पासवर्ड",
    confirmPw: "नया पासवर्ड पुष्टि करें",
    savePw: "पासवर्ड सहेजें",
    saving: "सहेज रहे हैं...",
    universal: "यूनिवर्सल डिज़ाइन",
    universalDesc: "अपनी ज़रूरत के अनुसार डिस्प्ले कस्टमाइज़ करें",
    visual: "दृष्टि बाधित",
    visualDesc: "काली स्क्रीन उच्च कंट्रास्ट + टेक्स्ट-टू-स्पीच",
    hearing: "श्रवण बाधित",
    hearingDesc: "कैप्शन और विज़ुअल अलर्ट दिखाएं",
    autism: "ऑटिज़्म",
    autismDesc: "एनिमेशन कम करें, सरल UI",
    other: "अन्य",
    otherDesc: "अतिरिक्त कस्टमाइज़ेशन",
    otherTTS: "टेक्स्ट-टू-स्पीच",
    otherTTSDesc: "किसी भी टेक्स्ट पर टैप करें",
    otherReduceUI: "UI कम करें",
    otherReduceUIDesc: "ग्रेडिएंट, शैडो छुपाएं",
    otherColorBlind: "कलर ब्लाइंड मोड",
    otherColorBlindDesc: "रंगों को आसानी से पहचानें",
    theme: "थीम",
    themeLight: "लाइट",
    themeDark: "डार्क",
    logout: "लॉग आउट",
    pwSuccess: "पासवर्ड सफलतापूर्वक बदला गया",
    pwError: "पासवर्ड मेल नहीं खाते",
    pwWrong: "वर्तमान पासवर्ड गलत है",
    pwShort: "पासवर्ड कम से कम 6 अक्षर का होना चाहिए",
    ttsNote: "* सक्षम होने पर, किसी भी टेक्स्ट पर टैप करें",
  },
};

export default function AccountPage() {
  const router = useRouter();
  const { lang, setLang } = useLang();
  const [theme, setTheme] = useState<Theme>("light");
  const [udVisual, setUdVisual] = useState(false);
  const [udHearing, setUdHearing] = useState(false);
  const [udAutism, setUdAutism] = useState(false);
  const [udOther, setUdOther] = useState(false);
  const [udOtherTTS, setUdOtherTTS] = useState(false);
  const [udOtherReduceUI, setUdOtherReduceUI] = useState(false);
  const [udOtherColorBlind, setUdOtherColorBlind] = useState(false);

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
    const savedTheme = localStorage.getItem("faknoi_theme") as Theme | null;
    if (savedTheme) setTheme(savedTheme);
    setUdVisual(localStorage.getItem("ud_visual") === "1");
    setUdHearing(localStorage.getItem("ud_hearing") === "1");
    setUdAutism(localStorage.getItem("ud_autism") === "1");
    setUdOther(localStorage.getItem("ud_other") === "1");
    setUdOtherTTS(localStorage.getItem("ud_other_tts") === "1");
    setUdOtherReduceUI(localStorage.getItem("ud_other_reduce_ui") === "1");
    setUdOtherColorBlind(localStorage.getItem("ud_other_colorblind") === "1");
  }, []);

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("faknoi_theme", theme);
  }, [theme]);

  // TTS click handler — now handled by VisualAccessibility component

  // Apply UD visual
  useEffect(() => {
    document.documentElement.classList.toggle("ud-visual", udVisual);
    localStorage.setItem("ud_visual", udVisual ? "1" : "0");
    // notify layout (same tab)
    window.dispatchEvent(new CustomEvent("ud_visual_change", { detail: udVisual ? "1" : "0" }));
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

  useEffect(() => {
    document.documentElement.classList.toggle("ud-other-tts", udOtherTTS);
    localStorage.setItem("ud_other_tts", udOtherTTS ? "1" : "0");
  }, [udOtherTTS]);

  useEffect(() => {
    document.documentElement.classList.toggle("ud-other-reduce-ui", udOtherReduceUI);
    localStorage.setItem("ud_other_reduce_ui", udOtherReduceUI ? "1" : "0");
  }, [udOtherReduceUI]);

  useEffect(() => {
    document.documentElement.classList.toggle("ud-other-colorblind", udOtherColorBlind);
    localStorage.setItem("ud_other_colorblind", udOtherColorBlind ? "1" : "0");
  }, [udOtherColorBlind]);

  // setLang is now from useLang() context — no local handler needed

  async function handleChangePw() {
    setPwMsg(null);
    if (newPw.length < 6) { setPwMsg({ type: "error", text: t.pwShort }); return; }
    if (newPw !== confirmPw) { setPwMsg({ type: "error", text: t.pwError }); return; }
    setPwLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) { setPwLoading(false); return; }
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
    { key: "visual",  icon: Eye,           val: udVisual,  set: setUdVisual,  label: t.visual,  desc: t.visualDesc },
    { key: "hearing", icon: Volume2,        val: udHearing, set: setUdHearing, label: t.hearing, desc: t.hearingDesc },
    { key: "autism",  icon: Brain,          val: udAutism,  set: setUdAutism,  label: t.autism,  desc: t.autismDesc },
    { key: "other",   icon: MoreHorizontal, val: udOther,   set: setUdOther,   label: t.other,   desc: t.otherDesc },
  ];

  const udOtherSubItems = [
    { key: "tts",        icon: Mic,     val: udOtherTTS,        set: setUdOtherTTS,        label: t.otherTTS,        desc: t.otherTTSDesc },
    { key: "reduceui",   icon: Layers,  val: udOtherReduceUI,   set: setUdOtherReduceUI,   label: t.otherReduceUI,   desc: t.otherReduceUIDesc },
    { key: "colorblind", icon: Palette, val: udOtherColorBlind, set: setUdOtherColorBlind, label: t.otherColorBlind, desc: t.otherColorBlindDesc },
  ];

  const ttsActive = udVisual || udOtherTTS;

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
          <div className="grid grid-cols-2 gap-2">
            {LANG_OPTIONS.map(({ value, label, flag }) => (
              <button key={value} onClick={() => setLang(value)}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-2xl font-black text-sm transition-all duration-200 ${
                  lang === value
                    ? "text-white shadow-blue-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                style={lang === value ? { background: "linear-gradient(135deg,#5478FF,#53CBF3)" } : {}}>
                <span className="text-base">{flag}</span> {label}
              </button>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-5 h-5 text-brand-blue" />
            <span className="font-black text-brand-navy">{t.security}</span>
          </div>
          <button onClick={() => setPwOpen(!pwOpen)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-gray-50 hover:bg-brand-blue/5 transition-colors">
            <span className="font-bold text-gray-700">{t.changePassword}</span>
            <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${pwOpen ? "rotate-90" : ""}`} />
          </button>

          {pwOpen && (
            <div className="mt-3 space-y-3">
              {[
                { label: t.currentPw, val: currentPw, set: setCurrentPw, show: showCurrent, toggle: () => setShowCurrent(!showCurrent) },
                { label: t.newPw,     val: newPw,      set: setNewPw,     show: showNew,     toggle: () => setShowNew(!showNew) },
                { label: t.confirmPw, val: confirmPw,  set: setConfirmPw, show: showConfirm, toggle: () => setShowConfirm(!showConfirm) },
              ].map(({ label, val, set, show, toggle }) => (
                <div key={label} className="relative">
                  <input type={show ? "text" : "password"} placeholder={label} value={val}
                    onChange={(e) => set(e.target.value)} className="input-field pr-12" />
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
                {pwLoading ? t.saving : t.savePw}
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
              <div key={key}>
                <button onClick={() => set(!val)}
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
                {/* Sub-options for "อื่นๆ" */}
                {key === "other" && val && (
                  <div className="mt-2 ml-4 space-y-1.5 border-l-2 border-brand-blue/20 pl-3">
                    {udOtherSubItems.map(({ key: sk, icon: SIcon, val: sv, set: sset, label: slabel, desc: sdesc }) => (
                      <button key={sk} onClick={() => sset(!sv)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl border transition-all duration-200 text-left ${
                          sv ? "border-brand-blue/40 bg-brand-blue/5" : "border-gray-100 bg-gray-50 hover:border-brand-blue/20"
                        }`}>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          sv ? "text-white" : "bg-gray-200 text-gray-500"
                        }`} style={sv ? { background: "linear-gradient(135deg,#5478FF,#53CBF3)" } : {}}>
                          <SIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-xs ${sv ? "text-brand-navy" : "text-gray-700"}`}>{slabel}</p>
                          <p className="text-[10px] text-gray-400 truncate">{sdesc}</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          sv ? "border-brand-blue bg-brand-blue" : "border-gray-300"
                        }`}>
                          {sv && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          {ttsActive && (
            <p className="mt-3 text-xs text-brand-blue font-bold bg-brand-blue/5 rounded-2xl px-3 py-2">
              {t.ttsNote}
            </p>
          )}
        </div>

        {/* Theme */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            {theme === "dark" ? <Moon className="w-5 h-5 text-brand-blue" /> : <Sun className="w-5 h-5 text-brand-blue" />}
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

      {/* Visual Accessibility floating widget */}
      {ttsActive && <VisualAccessibility lang={lang} />}
    </div>
  );
}
