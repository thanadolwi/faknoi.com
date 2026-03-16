import Link from "next/link";
import { ShoppingBag, ArrowRight } from "lucide-react";

// Decorative SVG motifs
function Star({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}
function Heart({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      {/* Floating decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <Star className="absolute top-[8%] left-[6%] w-6 h-6 text-candy-lilac animate-spin-slow opacity-60" />
        <Heart className="absolute top-[12%] right-[8%] w-5 h-5 text-candy-pink animate-float opacity-70" />
        <Star className="absolute top-[35%] right-[4%] w-4 h-4 text-brand-yellow animate-spin-slow opacity-50" />
        <Heart className="absolute bottom-[30%] left-[4%] w-6 h-6 text-candy-sky animate-float opacity-60" style={{animationDelay:"1s"}} />
        <Star className="absolute bottom-[15%] right-[10%] w-5 h-5 text-candy-mint animate-spin-slow opacity-50" />
        <Heart className="absolute top-[55%] left-[8%] w-4 h-4 text-candy-peach animate-float opacity-60" style={{animationDelay:"2s"}} />
        {/* Blob shapes */}
        <div className="absolute top-[20%] right-[-5%] w-64 h-64 bg-candy-pink/20 rounded-[60%_40%_70%_30%/50%_60%_40%_50%] blur-2xl" />
        <div className="absolute bottom-[20%] left-[-5%] w-56 h-56 bg-candy-lilac/20 rounded-[40%_60%_30%_70%/60%_40%_50%_50%] blur-2xl" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-5xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-brand-navy flex items-center justify-center shadow-lg shadow-brand-navy/20">
            <ShoppingBag className="w-5 h-5 text-brand-yellow" />
          </div>
          <span className="font-black text-xl text-brand-navy tracking-tight">FakNoi</span>
          <Star className="w-3.5 h-3.5 text-candy-lilac" />
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
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-8 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-candy-lilac/30 border-2 border-candy-lilac/40 text-brand-navy text-xs font-black px-4 py-2 rounded-full mb-8">
          <Star className="w-3 h-3 text-brand-blue" />
          Trip-Based Matching · ใหม่ล่าสุด 2026
          <Heart className="w-3 h-3 text-candy-pink" />
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-brand-navy leading-[1.05] mb-6 tracking-tight">
          ฝากหน่อย
          <br />
          <span className="bg-gradient-to-r from-brand-blue via-[#a78bfa] to-brand-cyan bg-clip-text text-transparent bg-[length:200%] animate-gradient">
            สั่งง่าย ใกล้ตัว
          </span>
          <span className="ml-2 text-4xl">🌸</span>
        </h1>

        <p className="text-gray-500 text-lg max-w-md mx-auto mb-10 leading-relaxed font-medium">
          เปลี่ยนความวุ่นวายในกลุ่มแชท มาสู่ระบบออเดอร์ที่ชัดเจน
          โปร่งใส ตรวจสอบได้ ✨
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
          <Link href="/register" className="btn-primary text-base py-4 px-8 flex items-center justify-center gap-2 text-lg">
            เริ่มใช้งานฟรี <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/login" className="btn-ghost text-base py-4 px-8 flex items-center justify-center">
            เข้าสู่ระบบ
          </Link>
        </div>

        <div className="flex items-center justify-center gap-6 text-sm text-gray-400 font-bold">
          <span>✅ ฟรี 100%</span>
          <span>⚡ ใช้งานได้ทันที</span>
          <span>🔒 ปลอดภัย</span>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-brand-blue font-black text-xs uppercase tracking-widest mb-3">
              <Star className="w-3.5 h-3.5" /> ทำไมต้อง FakNoi <Star className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-3xl font-black text-brand-navy mt-2 tracking-tight">
              ระบบที่ออกแบบมาเพื่อ
              <span className="text-brand-blue"> ชุมชนหอพัก</span> 💜
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { emoji: "⚡", bg: "bg-candy-sky/40", border: "border-candy-sky", title: "Trip-Based Matching", desc: "ผู้รับหิ้วประกาศทริปล่วงหน้า ผู้ซื้อเลือกทริปที่ผ่านหอพักตัวเอง ไม่มีออเดอร์ตกหล่น" },
              { emoji: "💸", bg: "bg-candy-lemon/40", border: "border-candy-lemon", title: "ชำระเงินโปร่งใส", desc: "ระบุราคาสุทธิจริงหลังซื้อ อัปโหลดสลิปยืนยัน ไม่มีความสับสนเรื่องยอดเงิน" },
              { emoji: "🛵", bg: "bg-candy-pink/30", border: "border-candy-pink", title: "Micro-Retail Access", desc: "สั่งจากร้านรถเข็นหรือร้านใต้หอพักที่แอปใหญ่เข้าไม่ถึง พร้อมตัวเลือกสำรอง" },
            ].map((f, i) => (
              <div key={i} className={`card-candy ${f.bg} border-2 ${f.border} hover:scale-[1.02] hover:-translate-y-1 transition-all duration-200`}>
                <div className="text-4xl mb-4">{f.emoji}</div>
                <h3 className="font-black text-brand-navy mb-2 text-lg">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="relative bg-brand-navy rounded-[2.5rem] p-10 text-center overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-64 h-64 bg-candy-lilac/20 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-candy-pink/15 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
            </div>
            {/* Floating stars in CTA */}
            <Star className="absolute top-6 left-8 w-5 h-5 text-candy-lilac/50 animate-spin-slow" />
            <Heart className="absolute top-8 right-10 w-4 h-4 text-candy-pink/50 animate-float" />
            <Star className="absolute bottom-6 right-8 w-4 h-4 text-brand-yellow/50 animate-spin-slow" />
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

      <footer className="relative z-10 text-center pb-10 text-sm text-gray-400 font-bold">
        © 2026 FakNoi · สร้างเพื่อชุมชนมหาวิทยาลัย
        <Heart className="inline w-3.5 h-3.5 text-candy-pink ml-1 mb-0.5" />
      </footer>
    </main>
  );
}
