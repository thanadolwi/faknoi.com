import Link from "next/link";
import { ShoppingBag, Zap, Shield, TrendingUp, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-brand-navy flex items-center justify-center shadow-md">
            <ShoppingBag className="w-4.5 h-4.5 text-brand-yellow" />
          </div>
          <span className="font-extrabold text-xl text-brand-navy tracking-tight">FakNoi</span>
        </div>
        <div className="flex gap-2">
          <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-brand-navy px-4 py-2 rounded-xl transition-colors">
            เข้าสู่ระบบ
          </Link>
          <Link href="/register" className="btn-primary text-sm py-2 px-5 shadow-sm">
            สมัครฟรี
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative max-w-5xl mx-auto px-6 pt-14 pb-24 text-center">
        {/* Background blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand-blue/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-0 w-64 h-64 bg-brand-yellow/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-brand-navy/5 border border-brand-navy/10 text-brand-navy text-xs font-semibold px-4 py-2 rounded-full mb-8">
            <Zap className="w-3 h-3 text-brand-blue" />
            Trip-Based Matching System
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-brand-navy leading-[1.1] mb-6 tracking-tight">
            ฝากหน่อย
            <br />
            <span className="bg-gradient-to-r from-brand-blue to-brand-cyan bg-clip-text text-transparent">
              สั่งง่าย ใกล้ตัว
            </span>
          </h1>
          <p className="text-gray-500 text-lg max-w-lg mx-auto mb-10 leading-relaxed">
            แพลตฟอร์มรับหิ้วอาหารในมหาวิทยาลัย เปลี่ยนความวุ่นวายในกลุ่มแชท
            มาสู่ระบบออเดอร์ที่ชัดเจน โปร่งใส ตรวจสอบได้
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="btn-primary text-base py-3.5 px-8 shadow-lg shadow-brand-blue/20 flex items-center justify-center gap-2">
              เริ่มใช้งานฟรี <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="btn-secondary text-base py-3.5 px-8 flex items-center justify-center gap-2">
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-xs font-semibold text-brand-blue uppercase tracking-widest mb-3">ทำไมต้อง FakNoi</p>
          <h2 className="text-3xl font-extrabold text-center text-brand-navy mb-12 tracking-tight">ระบบที่ออกแบบมาเพื่อชุมชนหอพัก</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Zap className="w-5 h-5 text-brand-blue" />,
                bg: "bg-brand-blue/10",
                border: "border-brand-blue/10",
                title: "Trip-Based Matching",
                desc: "ผู้รับหิ้วประกาศทริปล่วงหน้า ผู้ซื้อเลือกทริปที่ผ่านหอพักตัวเอง ไม่มีออเดอร์ตกหล่นอีกต่อไป",
              },
              {
                icon: <Shield className="w-5 h-5 text-brand-cyan" />,
                bg: "bg-brand-cyan/10",
                border: "border-brand-cyan/10",
                title: "ชำระเงินโปร่งใส",
                desc: "ระบุราคาสุทธิจริงหลังซื้อ อัปโหลดสลิปยืนยัน ไม่มีความสับสนเรื่องยอดเงินอีก",
              },
              {
                icon: <TrendingUp className="w-5 h-5 text-brand-navy" />,
                bg: "bg-brand-yellow/20",
                border: "border-brand-yellow/30",
                title: "Micro-Retail Access",
                desc: "สั่งจากร้านรถเข็นหรือร้านใต้หอพักที่แอปใหญ่เข้าไม่ถึง พร้อมระบุตัวเลือกสำรอง",
              },
            ].map((f, i) => (
              <div key={i} className={`card border ${f.border} hover:shadow-md transition-shadow duration-200`}>
                <div className={`w-11 h-11 rounded-2xl ${f.bg} flex items-center justify-center mb-4`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-brand-navy mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <div className="bg-gradient-to-br from-brand-navy to-brand-blue rounded-3xl p-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-yellow/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative">
            <h2 className="text-3xl font-extrabold mb-3">พร้อมเริ่มใช้งานแล้วหรือยัง?</h2>
            <p className="text-white/70 mb-8 text-base">สมัครฟรี ไม่มีค่าใช้จ่าย ใช้งานได้ทันที</p>
            <Link href="/register" className="inline-flex items-center gap-2 bg-brand-yellow text-brand-navy font-bold py-3.5 px-8 rounded-xl hover:bg-yellow-300 transition-colors shadow-lg">
              เริ่มใช้งานเลย <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-sm text-gray-400 border-t border-gray-100">
        © 2026 FakNoi · สร้างเพื่อชุมชนมหาวิทยาลัย
      </footer>
    </main>
  );
}
