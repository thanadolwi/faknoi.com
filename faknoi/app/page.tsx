import Link from "next/link";
import { ShoppingBag, Zap, Shield, TrendingUp, ArrowRight, Sparkles } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-brand-navy flex items-center justify-center shadow-lg shadow-brand-navy/20">
            <ShoppingBag className="w-5 h-5 text-brand-yellow" />
          </div>
          <span className="font-black text-xl text-brand-navy tracking-tight">FakNoi</span>
        </div>
        <div className="flex gap-2 items-center">
          <Link href="/login" className="text-sm font-bold text-gray-500 hover:text-brand-navy px-4 py-2 rounded-2xl transition-colors">
            เข้าสู่ระบบ
          </Link>
          <Link href="/register" className="btn-primary text-sm py-2.5 px-5">
            สมัครฟรี ✨
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative max-w-5xl mx-auto px-6 pt-10 pb-24 text-center">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-10 left-10 w-72 h-72 bg-brand-blue/10 rounded-full blur-3xl" />
          <div className="absolute top-20 right-10 w-64 h-64 bg-brand-yellow/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-brand-cyan/10 rounded-full blur-3xl" />
        </div>

        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-white border-2 border-brand-blue/20 text-brand-blue text-xs font-black px-4 py-2 rounded-full mb-8 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Trip-Based Matching · ใหม่ล่าสุด 2026
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-brand-navy leading-[1.05] mb-6 tracking-tight">
            ฝากหน่อย
            <br />
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-brand-blue via-brand-cyan to-brand-blue bg-clip-text text-transparent bg-[length:200%] animate-gradient">
                สั่งง่าย ใกล้ตัว
              </span>
            </span>
          </h1>

          <p className="text-gray-500 text-lg max-w-md mx-auto mb-10 leading-relaxed font-medium">
            เปลี่ยนความวุ่นวายในกลุ่มแชท มาสู่ระบบออเดอร์ที่ชัดเจน
            โปร่งใส ตรวจสอบได้ 🎯
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register"
              className="btn-primary text-base py-4 px-8 flex items-center justify-center gap-2 text-lg">
              เริ่มใช้งานฟรี <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/login" className="btn-ghost text-base py-4 px-8 flex items-center justify-center">
              เข้าสู่ระบบ
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-10 flex items-center justify-center gap-6 text-sm text-gray-400 font-medium">
            <span>✅ ฟรี 100%</span>
            <span>⚡ ใช้งานได้ทันที</span>
            <span>🔒 ปลอดภัย</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="pill bg-brand-blue/10 text-brand-blue mb-3">ทำไมต้อง FakNoi</span>
            <h2 className="text-3xl font-black text-brand-navy mt-3 tracking-tight">
              ระบบที่ออกแบบมาเพื่อ<br />
              <span className="text-brand-blue">ชุมชนหอพัก</span> โดยเฉพาะ
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                emoji: "⚡",
                bg: "from-brand-blue/10 to-brand-cyan/10",
                border: "border-brand-blue/15",
                title: "Trip-Based Matching",
                desc: "ผู้รับหิ้วประกาศทริปล่วงหน้า ผู้ซื้อเลือกทริปที่ผ่านหอพักตัวเอง ไม่มีออเดอร์ตกหล่น",
              },
              {
                emoji: "💸",
                bg: "from-brand-yellow/15 to-brand-yellow/5",
                border: "border-brand-yellow/30",
                title: "ชำระเงินโปร่งใส",
                desc: "ระบุราคาสุทธิจริงหลังซื้อ อัปโหลดสลิปยืนยัน ไม่มีความสับสนเรื่องยอดเงิน",
              },
              {
                emoji: "🛵",
                bg: "from-brand-cyan/10 to-brand-blue/5",
                border: "border-brand-cyan/20",
                title: "Micro-Retail Access",
                desc: "สั่งจากร้านรถเข็นหรือร้านใต้หอพักที่แอปใหญ่เข้าไม่ถึง พร้อมตัวเลือกสำรอง",
              },
            ].map((f, i) => (
              <div key={i} className={`card bg-gradient-to-br ${f.bg} border-2 ${f.border} hover:scale-[1.02] transition-transform duration-200 cursor-default`}>
                <div className="text-4xl mb-4">{f.emoji}</div>
                <h3 className="font-black text-brand-navy mb-2 text-lg">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="relative bg-brand-navy rounded-[2rem] p-10 text-center overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/30 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-yellow/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
            </div>
            <div className="relative">
              <div className="text-5xl mb-4">🚀</div>
              <h2 className="text-3xl font-black text-white mb-3 tracking-tight">พร้อมแล้วหรือยัง?</h2>
              <p className="text-white/60 mb-8 font-medium">สมัครฟรี ไม่มีค่าใช้จ่าย ใช้งานได้ทันที</p>
              <Link href="/register"
                className="inline-flex items-center gap-2 bg-brand-yellow text-brand-navy font-black py-4 px-10 rounded-2xl hover:brightness-105 active:scale-95 transition-all duration-150 shadow-xl shadow-brand-yellow/20 text-lg">
                เริ่มเลย ✨ <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="text-center pb-10 text-sm text-gray-400 font-medium">
        © 2026 FakNoi · สร้างเพื่อชุมชนมหาวิทยาลัย 💙
      </footer>
    </main>
  );
}
