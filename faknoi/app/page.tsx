import Link from "next/link";
import { ShoppingBag, Zap, Shield, TrendingUp } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-navy flex items-center justify-center">
            <ShoppingBag className="w-4 h-4 text-brand-yellow" />
          </div>
          <span className="font-bold text-xl text-brand-navy">FakNoi</span>
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-brand-navy px-4 py-2 rounded-xl transition-colors">
            เข้าสู่ระบบ
          </Link>
          <Link href="/register" className="btn-primary text-sm py-2 px-4">
            สมัครใช้งาน
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-yellow/20 text-brand-navy text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <Zap className="w-3 h-3" />
          Trip-Based Matching System
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-brand-navy leading-tight mb-5">
          ฝากหน่อย<br />
          <span className="text-brand-blue">สั่งง่าย ฝากได้ ใกล้ตัวกว่าเดลิเวอรี่</span>
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
          แพลตฟอร์มรับหิ้วอาหารในมหาวิทยาลัย เปลี่ยนความวุ่นวายในกลุ่มแชท
          มาสู่ระบบจัดการออเดอร์ที่ชัดเจน โปร่งใส และตรวจสอบได้
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register" className="btn-primary text-base py-3 px-8">
            เริ่มใช้งานฟรี
          </Link>
          <Link href="/login" className="btn-secondary text-base py-3 px-8">
            เข้าสู่ระบบ
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center text-brand-navy mb-10">ทำไมต้อง FakNoi?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: <Zap className="w-5 h-5 text-brand-blue" />,
                bg: "bg-brand-blue/10",
                title: "Trip-Based Matching",
                desc: "ผู้รับหิ้วประกาศทริปล่วงหน้า ผู้ซื้อเลือกทริปที่ผ่านหอพักตัวเอง ไม่มีออเดอร์ตกหล่นอีกต่อไป",
              },
              {
                icon: <Shield className="w-5 h-5 text-brand-cyan" />,
                bg: "bg-brand-cyan/10",
                title: "ชำระเงินโปร่งใส",
                desc: "ระบุราคาสุทธิจริงหลังซื้อ อัปโหลดสลิปยืนยัน ไม่มีความสับสนเรื่องยอดเงินอีก",
              },
              {
                icon: <TrendingUp className="w-5 h-5 text-brand-yellow" />,
                bg: "bg-brand-yellow/10",
                title: "Micro-Retail Access",
                desc: "สั่งจากร้านรถเข็นหรือร้านใต้หอพักที่แอปใหญ่เข้าไม่ถึง พร้อมระบุตัวเลือกสำรอง",
              },
            ].map((f, i) => (
              <div key={i} className="card">
                <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                  {f.icon}
                </div>
                <h3 className="font-semibold text-brand-navy mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-sm text-gray-400">
        © 2026 FakNoi · สร้างเพื่อชุมชนมหาวิทยาลัย
      </footer>
    </main>
  );
}
