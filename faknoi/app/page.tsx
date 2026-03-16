import Link from "next/link";
import { ShoppingBag, ArrowRight, Zap, Shield, Star } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl hero-grad flex items-center justify-center shadow-blue-sm">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-xl text-brand-navy tracking-tight">FakNoi</span>
        </div>
        <div className="flex gap-2 items-center">
          <Link href="/login" className="text-sm font-bold text-gray-500 hover:text-brand-navy px-4 py-2 rounded-2xl transition-colors">
            เข้าสู่ระบบ
          </Link>
          <Link href="/register" className="btn-primary text-sm py-2.5 px-5">
            สมัครฟรี
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative max-w-5xl mx-auto px-6 pt-10 pb-20 text-center overflow-hidden">
        {/* Blob decorations */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10 hero-grad blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-20 w-72 h-72 rounded-full opacity-10 bg-brand-cyan blur-3xl pointer-events-none" />

        {/* Doodle floating elements */}
        <div className="absolute top-8 left-[8%] text-3xl animate-float pointer-events-none select-none opacity-70">🛵</div>
        <div className="absolute top-16 right-[8%] text-2xl animate-float-slow pointer-events-none select-none opacity-70" style={{animationDelay:"1.5s"}}>🍜</div>
        <div className="absolute bottom-24 left-[5%] text-2xl animate-float pointer-events-none select-none opacity-60" style={{animationDelay:"0.8s"}}>⭐</div>
        <div className="absolute bottom-20 right-[6%] text-2xl animate-float-slow pointer-events-none select-none opacity-60" style={{animationDelay:"2s"}}>🧋</div>

        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-brand-blue/8 border border-brand-blue/15 text-brand-blue text-xs font-black px-4 py-2 rounded-full mb-8">
            <Zap className="w-3.5 h-3.5" />
            Trip-Based Matching · ใหม่ล่าสุด 2026
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-brand-navy leading-[1.05] mb-5 tracking-tight">
            ฝากหน่อย
            <br />
            <span className="text-grad">สั่งง่าย ใกล้ตัว</span>
          </h1>

          <p className="text-gray-500 text-lg max-w-md mx-auto mb-10 leading-relaxed font-medium">
            แพลตฟอร์มรับหิ้วอาหารในมหาวิทยาลัย เปลี่ยนความวุ่นวายในกลุ่มแชท
            มาสู่ระบบออเดอร์ที่ชัดเจน โปร่งใส ✨
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Link href="/register" className="btn-primary text-base py-4 px-8">
              เริ่มใช้งานฟรี <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/login" className="btn-ghost text-base py-4 px-8">
              เข้าสู่ระบบ
            </Link>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap items-center justify-center gap-8">
            {[
              { num: "ฟรี", label: "ไม่มีค่าใช้จ่าย" },
              { num: "Real-time", label: "แชทกับผู้รับหิ้ว" },
              { num: "ง่าย", label: "ใช้งานได้ทันที" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-xl font-black text-grad">{s.num}</div>
                <div className="text-xs text-gray-400 font-medium mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-16 px-6 bg-gray-50/60">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-black text-brand-blue uppercase tracking-widest mb-2">วิธีใช้งาน</p>
            <h2 className="text-3xl font-black text-brand-navy tracking-tight">ง่ายแค่ 3 ขั้นตอน</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { step: "01", emoji: "🔍", title: "เลือกทริป", desc: "ดูทริปที่ผ่านหอพักของคุณ เลือกตามเวลาและเส้นทาง" },
              { step: "02", emoji: "�", title: "สั่งออเดอร์", desc: "ระบุรายการที่ต้องการ พร้อมตัวเลือกสำรอง" },
              { step: "03", emoji: "🎉", title: "รับของ", desc: "ติดตามสถานะ real-time แชทกับผู้รับหิ้วได้เลย" },
            ].map((s, i) => (
              <div key={i} className="card group hover:scale-[1.02] transition-all duration-200 cursor-default">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl hero-grad flex items-center justify-center flex-shrink-0 shadow-blue-sm">
                    <span className="text-white text-xs font-black">{s.step}</span>
                  </div>
                  <div>
                    <div className="text-2xl mb-2">{s.emoji}</div>
                    <h3 className="font-black text-brand-navy mb-1">{s.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed font-medium">{s.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-black text-brand-blue uppercase tracking-widest mb-2">ฟีเจอร์</p>
            <h2 className="text-3xl font-black text-brand-navy tracking-tight">ทำไมต้อง FakNoi?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: <Zap className="w-5 h-5 text-white" />, title: "Trip Matching", desc: "จับคู่ทริปอัตโนมัติ ไม่มีออเดอร์ตกหล่น" },
              { icon: <Shield className="w-5 h-5 text-white" />, title: "โปร่งใส 100%", desc: "อัปโหลดสลิป ยืนยันราคาจริง ไม่มีสับสน" },
              { icon: <Star className="w-5 h-5 text-white" />, title: "Micro-Retail", desc: "สั่งร้านรถเข็นที่แอปใหญ่เข้าไม่ถึง" },
            ].map((f, i) => (
              <div key={i} className="card hover:scale-[1.02] transition-all duration-200 cursor-default">
                <div className="w-11 h-11 rounded-2xl hero-grad flex items-center justify-center mb-4 shadow-blue-sm">
                  {f.icon}
                </div>
                <h3 className="font-black text-brand-navy mb-1.5">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="relative hero-grad rounded-[2.5rem] p-10 text-center overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-yellow/15 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
            </div>
            <div className="absolute top-6 left-8 text-3xl animate-float pointer-events-none">🛵</div>
            <div className="absolute bottom-6 right-8 text-2xl animate-float-slow pointer-events-none" style={{animationDelay:"1s"}}>⭐</div>
            <div className="relative">
              <div className="text-5xl mb-4">🎓</div>
              <h2 className="text-3xl font-black text-white mb-3 tracking-tight">พร้อมแล้วหรือยัง?</h2>
              <p className="text-white/70 mb-8 font-medium">สมัครฟรี ไม่มีค่าใช้จ่าย ใช้งานได้ทันที</p>
              <Link href="/register"
                className="inline-flex items-center gap-2 bg-brand-yellow text-brand-navy font-black py-4 px-10 rounded-2xl hover:brightness-105 active:scale-95 transition-all duration-150 shadow-xl text-lg">
                เริ่มเลย <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="text-center pb-10 text-sm text-gray-400 font-medium border-t border-gray-100 pt-8">
        © 2026 FakNoi · สร้างเพื่อชุมชนมหาวิทยาลัย 💙
      </footer>
    </main>
  );
}
