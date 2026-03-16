"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useLang } from "@/lib/LangContext";
import { t } from "@/lib/i18n";

export default function LoginPage() {
  const router = useRouter();
  const { lang } = useLang();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data: profile, error: profileError } = await supabase
      .from("profiles").select("email").eq("username", username.trim()).single();
    if (profileError || !profile) {
      setError(t(lang, "login_err_user")); setLoading(false); return;
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: profile.email, password,
    });
    if (signInError) {
      setError(t(lang, "login_err_pass")); setLoading(false); return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-brand-navy mb-1">{t(lang, "login_welcome")}</h1>
      <p className="text-sm text-gray-400 mb-7">{t(lang, "login_subtitle")}</p>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t(lang, "login_username")}</label>
          <input type="text" className="input-field" placeholder="somchai99"
            value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t(lang, "login_password")}</label>
          <div className="relative">
            <input type={showPass ? "text" : "password"} className="input-field pr-11" placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">{error}</div>}
        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
          {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <LogIn className="w-4 h-4" />}
          {loading ? t(lang, "login_loading") : t(lang, "login_btn")}
        </button>
      </form>

      <p className="text-center text-sm text-gray-400 mt-6">
        {t(lang, "login_no_account")}{" "}
        <Link href="/register" className="text-brand-blue font-semibold hover:underline">{t(lang, "login_register")}</Link>
      </p>
    </>
  );
}
