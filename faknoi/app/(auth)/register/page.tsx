"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { useLang } from "@/lib/LangContext";
import { t } from "@/lib/i18n";

export default function RegisterPage() {
  const router = useRouter();
  const { lang } = useLang();
  const [form, setForm] = useState({ email: "", username: "", password: "", confirmPassword: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) { setError(t(lang, "reg_err_pass_mismatch")); return; }
    if (form.password.length < 6) { setError(t(lang, "reg_err_pass_short")); return; }
    if (form.username.length < 3) { setError(t(lang, "reg_err_username_short")); return; }
    setLoading(true);
    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { username: form.username } },
    });
    if (signUpError) {
      setError(signUpError.message.includes("already registered") ? t(lang, "reg_err_email_used") : signUpError.message);
      setLoading(false); return;
    }
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
        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
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
