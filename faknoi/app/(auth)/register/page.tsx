"use client";

import { useState } from "react";
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

export default function RegisterPage() {
  const router = useRouter();
  const { lang, setLang } = useLang();
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
    if (!/^\d{13}$/.test(form.nationalId)) { setError("เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก"); return; }
    if (!acceptTerms) { setError("กรุณายอมรับเงื่อนไขและนโยบายความเป็นส่วนตัวก่อน"); return; }
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
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">เลขบัตรประชาชน 13 หลัก *</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="\d{13}"
            maxLength={13}
            className="input-field"
            placeholder="1234567890123"
            value={form.nationalId}
            onChange={(e) => update("nationalId", e.target.value.replace(/\D/g, "").slice(0, 13))}
            required
          />
          <p className="text-xs text-gray-400 mt-1">ตัวเลขเท่านั้น ไม่ต้องใส่ขีด</p>
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

        {/* Terms checkbox */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative mt-0.5 flex-shrink-0">
            <input
              type="checkbox"
              className="sr-only"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
            />
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
              acceptTerms ? "bg-brand-blue border-brand-blue" : "border-gray-300 bg-white group-hover:border-brand-blue/50"
            }`}>
              {acceptTerms && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
          <span className="text-sm text-gray-600 leading-relaxed">
            ฉันยอมรับ{" "}
            <span className="text-brand-blue font-semibold">เงื่อนไขการใช้งาน</span>
            {" "}และ{" "}
            <span className="text-brand-blue font-semibold">นโยบายความเป็นส่วนตัว</span>
            {" "}ของ FakNoi
          </span>
        </label>

        {/* Language (optional) */}
        <div className="border border-gray-100 rounded-2xl p-4 space-y-3 bg-gray-50">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-brand-blue" />
            <p className="font-black text-brand-navy text-sm">ภาษาในการแสดงผล <span className="text-gray-400 font-normal text-xs">(ตัวเลือกเสริม)</span></p>
          </div>
          <p className="text-xs text-gray-400">เลือกได้เลยถ้าต้องการปรับการแสดงผลตามความต้องการ สามารถเปลี่ยนได้ภายหลังที่ "ตั้งค่าบัญชี"</p>
          <div className="grid grid-cols-2 gap-2">
            {LANG_OPTIONS.map(({ value, label, flag }) => (
              <button key={value} type="button" onClick={() => setLang(value)}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-xs transition-all border-2 ${
                  lang === value ? "text-white border-brand-blue" : "border-gray-200 bg-white text-gray-600 hover:border-brand-blue/30"
                }`}
                style={lang === value ? { background: "linear-gradient(135deg,#5478FF,#53CBF3)" } : {}}>
                <span className="text-base">{flag}</span> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Universal Design (optional) */}
        <div className="border border-gray-100 rounded-2xl p-4 space-y-3 bg-gray-50">
          <div className="flex items-center gap-2">
            <Accessibility className="w-4 h-4 text-brand-blue" />
            <p className="font-black text-brand-navy text-sm">Universal Design <span className="text-gray-400 font-normal text-xs">(ตัวเลือกเสริม)</span></p>
          </div>
          <p className="text-xs text-gray-400">เลือกได้เลยถ้าต้องการปรับการแสดงผลตามความต้องการ สามารถเปลี่ยนได้ภายหลังที่ "ตั้งค่าบัญชี"</p>
          <div className="space-y-2">
            {[
              { val: udVisual,  set: setUdVisual,  icon: Eye,           label: "ผู้พิการทางสายตา",     desc: "จอสีดำ contrast สูง + อ่านออกเสียง" },
              { val: udHearing, set: setUdHearing, icon: Volume2,        label: "ผู้พิการทางการได้ยิน", desc: "แสดงคำบรรยายและการแจ้งเตือนด้วยภาพ" },
              { val: udAutism,  set: setUdAutism,  icon: Brain,          label: "ออทิสติก",             desc: "ลด animation, UI เรียบง่ายขึ้น" },
              { val: udOther,   set: setUdOther,   icon: MoreHorizontal, label: "อื่นๆ",                desc: "ปรับแต่งเพิ่มเติม" },
            ].map(({ val, set, icon: Icon, label, desc }) => (
              <button key={label} type="button" onClick={() => set(!val)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-all text-left ${
                  val ? "border-brand-blue bg-brand-blue/5" : "border-gray-200 bg-white hover:border-brand-blue/30"
                }`}>
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
          {/* Sub-options for อื่นๆ */}
          {udOther && (
            <div className="ml-4 space-y-1.5 border-l-2 border-brand-blue/20 pl-3">
              {[
                { val: udOtherTTS,        set: setUdOtherTTS,        icon: Mic,     label: "อ่านข้อความออกเสียง" },
                { val: udOtherReduceUI,   set: setUdOtherReduceUI,   icon: Layers,  label: "ลด UI" },
                { val: udOtherColorBlind, set: setUdOtherColorBlind, icon: Palette, label: "สำหรับตาบอดสี" },
              ].map(({ val, set, icon: Icon, label }) => (
                <button key={label} type="button" onClick={() => set(!val)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-left ${
                    val ? "border-brand-blue/40 bg-brand-blue/5" : "border-gray-100 bg-white hover:border-brand-blue/20"
                  }`}>
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

        <button type="submit" disabled={loading || !acceptTerms} className="btn-primary w-full flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
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
