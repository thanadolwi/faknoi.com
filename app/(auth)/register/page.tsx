"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, UserPlus } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
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

    if (form.password !== form.confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }
    if (form.password.length < 6) {
      setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    if (form.username.length < 3) {
      setError("ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { username: form.username },
      },
    });

    if (signUpError) {
      if (signUpError.message.includes("already registered")) {
        setError("อีเมลนี้ถูกใช้งานแล้ว");
      } else {
        setError(signUpError.message);
      }
      setLoading(false);
      return;
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
        <h2 className="text-xl font-bold text-brand-navy mb-2">สมัครสำเร็จ!</h2>
        <p className="text-sm text-gray-400">กำลังพาคุณไปยังหน้าหลัก...</p>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-brand-navy mb-1">สร้างบัญชีใหม่</h1>
      <p className="text-sm text-gray-400 mb-7">เริ่มต้นใช้งาน FakNoi ได้เลย ฟรี!</p>

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">อีเมล</label>
          <input
            type="email"
            className="input-field"
            placeholder="your@email.com"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">ชื่อผู้ใช้งาน</label>
          <input
            type="text"
            className="input-field"
            placeholder="เช่น somchai99"
            value={form.username}
            onChange={(e) => update("username", e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">รหัสผ่าน</label>
          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              className="input-field pr-11"
              placeholder="อย่างน้อย 6 ตัวอักษร"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">ยืนยันรหัสผ่าน</label>
          <input
            type={showPass ? "text" : "password"}
            className="input-field"
            placeholder="••••••••"
            value={form.confirmPassword}
            onChange={(e) => update("confirmPassword", e.target.value)}
            required
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <UserPlus className="w-4 h-4" />
          )}
          {loading ? "กำลังสมัคร..." : "สมัครใช้งาน"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-400 mt-6">
        มีบัญชีอยู่แล้ว?{" "}
        <Link href="/login" className="text-brand-blue font-semibold hover:underline">
          เข้าสู่ระบบ
        </Link>
      </p>
    </>
  );
}
