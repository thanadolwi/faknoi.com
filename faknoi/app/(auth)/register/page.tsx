"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, UserPlus, Accessibility, Volume2, Brain, MoreHorizontal, Mic, Layers, Palette, Check, Globe } from "lucide-react";
import { useLang, type Lang } from "@/lib/LangContext";
import { t } from "@/lib/i18n";

const LANG_OPTIONS: { value: Lang; label: string; flag: string }[] = [
  { value: "th", label: "ภาษาไทย", flag: "🇹🇭" },
  { value: "en", label: "English",  flag: "🇬🇧" },
  { value: "zh", label: "中文",      flag: "🇨🇳" },
  { value: "hi", label: "हिन्दी",    flag: "🇮🇳" },
];

// Static labels per lang for things not in i18n
const REG_LABELS: Record<Lang, {
  nationalId: string; nationalIdHint: string; terms: string; termsLink1: string; termsAnd: string; termsLink2: string; termsOf: string;
  langTitle: string; udTitle: string; optionalHint: string; udHint: string;
  udVisual: string; udVisualDesc: string; udHearing: string; udHearingDesc: string;
  udAutism: string; udAutismDesc: string; udOther: string; udOtherDesc: string;
  udTTS: string; udReduceUI: string; udColorBlind: string;
  termsErr: string; nationalIdErr: string;
}> = {
  th: {
    nationalId: "เลขบัตรประชาชน 13 หลัก *", nationalIdHint: "ตัวเลขเท่านั้น ไม่ต้องใส่ขีด",
    terms: "ฉันยอมรับ", termsLink1: "เงื่อนไขการใช้งาน", termsAnd: "และ", termsLink2: "นโยบายความเป็นส่วนตัว", termsOf: "ของ FakNoi",
    langTitle: "ภาษาในการแสดงผล", udTitle: "Universal Design",
    optionalHint: "(ตัวเลือกเสริม)", udHint: "เลือกได้เลยถ้าต้องการปรับการแสดงผลตามความต้องการ สามารถเปลี่ยนได้ภายหลังที่ \"ตั้งค่าบัญชี\"",
    udVisual: "ผู้พิการทางสายตา", udVisualDesc: "จอสีดำ contrast สูง + อ่านออกเสียง",
    udHearing: "ผู้พิการทางการได้ยิน", udHearingDesc: "แสดงคำบรรยายและการแจ้งเตือนด้วยภาพ",
    udAutism: "ออทิสติก", udAutismDesc: "ลด animation, UI เรียบง่ายขึ้น",
    udOther: "อื่นๆ", udOtherDesc: "ปรับแต่งเพิ่มเติม",
    udTTS: "อ่านข้อความออกเสียง", udReduceUI: "ลด UI", udColorBlind: "สำหรับตาบอดสี",
    termsErr: "กรุณายอมรับเงื่อนไขและนโยบายความเป็นส่วนตัวก่อน",
    nationalIdErr: "เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก",
  },
  en: {
    nationalId: "National ID (13 digits) *", nationalIdHint: "Numbers only, no dashes",
    terms: "I accept the", termsLink1: "Terms of Service", termsAnd: "and", termsLink2: "Privacy Policy", termsOf: "of FakNoi",
    langTitle: "Display Language", udTitle: "Universal Design",
    optionalHint: "(optional)", udHint: "Choose if you want to customize the display. You can change this later in \"Account Settings\".",
    udVisual: "Visual Impairment", udVisualDesc: "High contrast dark screen + text-to-speech",
    udHearing: "Hearing Impairment", udHearingDesc: "Show captions and visual alerts",
    udAutism: "Autism", udAutismDesc: "Reduce animations, simpler UI",
    udOther: "Other", udOtherDesc: "Additional customization",
    udTTS: "Text-to-Speech", udReduceUI: "Reduce UI", udColorBlind: "Color Blind Mode",
    termsErr: "Please accept the terms and privacy policy first",
    nationalIdErr: "National ID must be 13 digits",
  },
  zh: {
    nationalId: "身份证号码（13位）*", nationalIdHint: "仅限数字，无需连字符",
    terms: "我接受", termsLink1: "服务条款", termsAnd: "和", termsLink2: "隐私政策", termsOf: "FakNoi",
    langTitle: "显示语言", udTitle: "无障碍设计",
    optionalHint: "（可选）", udHint: "如需自定义显示，可以选择。之后可在\"账户设置\"中更改。",
    udVisual: "视觉障碍", udVisualDesc: "高对比度黑色屏幕 + 文字转语音",
    udHearing: "听觉障碍", udHearingDesc: "显示字幕和视觉提醒",
    udAutism: "自闭症", udAutismDesc: "减少动画，简化界面",
    udOther: "其他", udOtherDesc: "其他自定义设置",
    udTTS: "文字转语音", udReduceUI: "简化界面", udColorBlind: "色盲模式",
    termsErr: "请先接受条款和隐私政策",
    nationalIdErr: "身份证号码必须是13位数字",
  },
  hi: {
    nationalId: "राष्ट्रीय आईडी (13 अंक) *", nationalIdHint: "केवल अंक, कोई डैश नहीं",
    terms: "मैं स्वीकार करता/करती हूं", termsLink1: "सेवा की शर्तें", termsAnd: "और", termsLink2: "गोपनीयता नीति", termsOf: "FakNoi की",
    langTitle: "प्रदर्शन भाषा", udTitle: "यूनिवर्सल डिज़ाइन",
    optionalHint: "(वैकल्पिक)", udHint: "यदि आप डिस्प्ले कस्टमाइज़ करना चाहते हैं तो चुनें। बाद में \"अकाउंट सेटिंग\" में बदल सकते हैं।",
    udVisual: "दृष्टि बाधित", udVisualDesc: "उच्च कंट्रास्ट काली स्क्रीन + टेक्स्ट-टू-स्पीच",
    udHearing: "श्रवण बाधित", udHearingDesc: "कैप्शन और विज़ुअल अलर्ट दिखाएं",
    udAutism: "ऑटिज़्म", udAutismDesc: "एनिमेशन कम करें, सरल UI",
    udOther: "अन्य", udOtherDesc: "अतिरिक्त कस्टमाइज़ेशन",
    udTTS: "टेक्स्ट-टू-स्पीच", udReduceUI: "UI कम करें", udColorBlind: "कलर ब्लाइंड मोड",
    termsErr: "कृपया पहले शर्तें और गोपनीयता नीति स्वीकार करें",
    nationalIdErr: "राष्ट्रीय आईडी 13 अंकों की होनी चाहिए",
  },
};

export default function RegisterPage() {
  const router = useRouter();
  const { lang, setLang } = useLang();
  const L = REG_LABELS[lang];
  const [form, setForm] = useState({ email: "", username: "", nationalId: "", password: "", confirmPassword: "" });
  const [showPass, setShowPass] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // UD states
  const [udVisual, setUdVisual] = useState(false);
  const [udHearing, setUdHearing] = useState(false);
  const [udAutism, setUdAutism] = useState(false);
  const [udOther, setUdOther] = useState(false);
  const [udOtherTTS, setUdOtherTTS] = useState(false);
  const [udOtherReduceUI, setUdOtherReduceUI] = useState(false);
  const [udOtherColorBlind, setUdOtherColorBlind] = useState(false);

  // Apply UD classes live as user toggles
  useEffect(() => { document.documentElement.classList.toggle("ud-visual", udVisual); }, [udVisual]);
  useEffect(() => { document.documentElement.classList.toggle("ud-hearing", udHearing); }, [udHearing]);
  useEffect(() => { document.documentElement.classList.toggle("ud-autism", udAutism); }, [udAutism]);
  useEffect(() => { document.documentElement.classList.toggle("ud-other-tts", udOtherTTS); }, [udOtherTTS]);
  useEffect(() => { document.documentElement.classList.toggle("ud-other-reduce-ui", udOtherReduceUI); }, [udOtherReduceUI]);
  useEffect(() => { document.documentElement.classList.toggle("ud-other-colorblind", udOtherColorBlind); }, [udOtherColorBlind]);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function saveUDToLocalStorage() {
    localStorage.setItem("ud_visual", udVisual ? "1" : "0");
    localStorage.setItem("ud_hearing", udHearing ? "1" : "0");
    localStorage.setItem("ud_autism", udAutism ? "1" : "0");
    localStorage.setItem("ud_other", udOther ? "1" : "0");
    localStorage.setItem("ud_other_tts", udOtherTTS ? "1" : "0");
    localStorage.setItem("ud_other_reduce_ui", udOtherReduceUI ? "1" : "0");
    localStorage.setItem("ud_other_colorblind", udOtherColorBlind ? "1" : "0");
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) { setError(t(lang, "reg_err_pass_mismatch")); return; }
    if (form.password.length < 6) { setError(t(lang, "reg_err_pass_short")); return; }
    if (form.username.length < 3) { setError(t(lang, "reg_err_username_short")); return; }
    if (!/^\d{13}$/.test(form.nationalId)) { setError(L.nationalIdErr); return; }
    if (!acceptTerms) { setError(L.termsErr); return; }
    setLoading(true);
    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { username: form.username, national_id: form.nationalId } },
    });
    if (signUpError) {
      setError(signUpError.message.includes("already registered") ? t(lang, "reg_err_email_used") : signUpError.message);
      setLoading(false); return;
    }
    saveUDToLocalStorage();
    setSuccess(true);
    setLoading(false);
    setTimeout(() => router.push("/dashboard"), 1500);
  }

  if (success) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🎉</span>
        </div>
        <h2 className="text-xl font-bold text-brand-navy mb-2">{t(lang, "reg_success_title")}</h2>
        <p className="text-sm text-gray-400">{t(lang, "reg_success_body")}</p>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-brand-navy mb-1">{t(lang, "reg_title")}</h1>
      <p className="text-sm text-gray-400 mb-7">{t(lang, "reg_subtitle")}</p>

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t(lang, "reg_email")}</label>
          <input type="email" className="input-field" placeholder="your@email.com"
            value={form.email} onChange={(e) => update("email", e.target.value)} required />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t(lang, "reg_username")}</label>
          <input type="text" className="input-field" placeholder="somchai99"
            value={form.username} onChange={(e) => update("username", e.target.value)} required />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">{L.nationalId}</label>
          <input type="text" inputMode="numeric" pattern="\d{13}" maxLength={13} className="input-field"
            placeholder="1234567890123" value={form.nationalId}
            onChange={(e) => update("nationalId", e.target.value.replace(/\D/g, "").slice(0, 13))} required />
          <p className="text-xs text-gray-400 mt-1">{L.nationalIdHint}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t(lang, "reg_password")}</label>
          <div className="relative">
            <input type={showPass ? "text" : "password"} className="input-field pr-11"
              placeholder={t(lang, "reg_password_hint")}
              value={form.password} onChange={(e) => update("password", e.target.value)} required />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t(lang, "reg_confirm_password")}</label>
          <input type={showPass ? "text" : "password"} className="input-field" placeholder="••••••••"
            value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} required />
        </div>
        {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">{error}</div>}

        {/* Terms */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative mt-0.5 flex-shrink-0">
            <input type="checkbox" className="sr-only" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} />
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${acceptTerms ? "bg-brand-blue border-brand-blue" : "border-gray-300 bg-white group-hover:border-brand-blue/50"}`}>
              {acceptTerms && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
            </div>
          </div>
          <span className="text-sm text-gray-600 leading-relaxed">
            {L.terms}{" "}
            <span className="text-brand-blue font-semibold">{L.termsLink1}</span>
            {" "}{L.termsAnd}{" "}
            <span className="text-brand-blue font-semibold">{L.termsLink2}</span>
            {" "}{L.termsOf}
          </span>
        </label>

        {/* Language */}
        <div className="border border-gray-100 rounded-2xl p-4 space-y-3 bg-gray-50">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-brand-blue" />
            <p className="font-black text-brand-navy text-sm">{L.langTitle} <span className="text-gray-400 font-normal text-xs">{L.optionalHint}</span></p>
          </div>
          <p className="text-xs text-gray-400">{L.udHint}</p>
          <div className="grid grid-cols-2 gap-2">
            {LANG_OPTIONS.map(({ value, label, flag }) => (
              <button key={value} type="button" onClick={() => setLang(value)}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-xs transition-all border-2 ${lang === value ? "text-white border-brand-blue" : "border-gray-200 bg-white text-gray-600 hover:border-brand-blue/30"}`}
                style={lang === value ? { background: "linear-gradient(135deg,#5478FF,#53CBF3)" } : {}}>
                <span className="text-base">{flag}</span> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Universal Design */}
        <div className="border border-gray-100 rounded-2xl p-4 space-y-3 bg-gray-50">
          <div className="flex items-center gap-2">
            <Accessibility className="w-4 h-4 text-brand-blue" />
            <p className="font-black text-brand-navy text-sm">{L.udTitle} <span className="text-gray-400 font-normal text-xs">{L.optionalHint}</span></p>
          </div>
          <p className="text-xs text-gray-400">{L.udHint}</p>
          <div className="space-y-2">
            {[
              { val: udVisual,  set: setUdVisual,  icon: Eye,           label: L.udVisual,  desc: L.udVisualDesc },
              { val: udHearing, set: setUdHearing, icon: Volume2,        label: L.udHearing, desc: L.udHearingDesc },
              { val: udAutism,  set: setUdAutism,  icon: Brain,          label: L.udAutism,  desc: L.udAutismDesc },
              { val: udOther,   set: setUdOther,   icon: MoreHorizontal, label: L.udOther,   desc: L.udOtherDesc },
            ].map(({ val, set, icon: Icon, label, desc }) => (
              <button key={label} type="button" onClick={() => set(!val)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-all text-left ${val ? "border-brand-blue bg-brand-blue/5" : "border-gray-200 bg-white hover:border-brand-blue/30"}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${val ? "text-white" : "bg-gray-100 text-gray-400"}`}
                  style={val ? { background: "linear-gradient(135deg,#5478FF,#53CBF3)" } : {}}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <p className={`text-xs font-black ${val ? "text-brand-navy" : "text-gray-700"}`}>{label}</p>
                  <p className="text-[10px] text-gray-400">{desc}</p>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${val ? "border-brand-blue bg-brand-blue" : "border-gray-300"}`}>
                  {val && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
              </button>
            ))}
          </div>
          {udOther && (
            <div className="ml-4 space-y-1.5 border-l-2 border-brand-blue/20 pl-3">
              {[
                { val: udOtherTTS,        set: setUdOtherTTS,        icon: Mic,     label: L.udTTS },
                { val: udOtherReduceUI,   set: setUdOtherReduceUI,   icon: Layers,  label: L.udReduceUI },
                { val: udOtherColorBlind, set: setUdOtherColorBlind, icon: Palette, label: L.udColorBlind },
              ].map(({ val, set, icon: Icon, label }) => (
                <button key={label} type="button" onClick={() => set(!val)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-left ${val ? "border-brand-blue/40 bg-brand-blue/5" : "border-gray-100 bg-white hover:border-brand-blue/20"}`}>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${val ? "text-white" : "bg-gray-100 text-gray-400"}`}
                    style={val ? { background: "linear-gradient(135deg,#5478FF,#53CBF3)" } : {}}>
                    <Icon className="w-3 h-3" />
                  </div>
                  <p className={`text-xs font-bold flex-1 ${val ? "text-brand-navy" : "text-gray-600"}`}>{label}</p>
                  <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${val ? "border-brand-blue bg-brand-blue" : "border-gray-300"}`}>
                    {val && <Check className="w-2 h-2 text-white" />}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <button type="submit" disabled={loading || !acceptTerms}
          className="btn-primary w-full flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UserPlus className="w-4 h-4" />}
          {loading ? t(lang, "reg_loading") : t(lang, "reg_btn")}
        </button>
      </form>

      <p className="text-center text-sm text-gray-400 mt-6">
        {t(lang, "reg_has_account")}{" "}
        <Link href="/login" className="text-brand-blue font-semibold hover:underline">{t(lang, "reg_login")}</Link>
      </p>
    </>
  );
}
