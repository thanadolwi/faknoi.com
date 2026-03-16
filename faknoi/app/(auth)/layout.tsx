import { ShoppingBag } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 opacity-[0.07] hero-grad rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 opacity-[0.07] bg-brand-cyan rounded-full translate-x-1/3 translate-y-1/3 blur-2xl pointer-events-none" />

      {/* Floating doodles */}
      <div className="absolute top-[8%] right-[10%] text-3xl animate-float pointer-events-none select-none opacity-50">🍜</div>
      <div className="absolute bottom-[10%] left-[8%] text-2xl animate-float-slow pointer-events-none select-none opacity-50" style={{animationDelay:"1.5s"}}>🛵</div>

      <Link href="/" className="flex items-center gap-2.5 mb-8 relative group">
        <div className="w-12 h-12 rounded-2xl hero-grad flex items-center justify-center shadow-blue-md group-hover:scale-105 transition-transform duration-200">
          <ShoppingBag className="w-6 h-6 text-white" />
        </div>
        <span className="font-black text-2xl text-brand-navy tracking-tight">FakNoi</span>
      </Link>

      <div className="w-full max-w-md bg-white rounded-3xl p-8 relative border border-gray-100"
        style={{boxShadow: "0 8px 40px rgba(84,120,255,0.12)"}}>
        {children}
      </div>

      <p className="text-gray-400 text-xs mt-6 font-medium">© 2026 FakNoi</p>
    </div>
  );
}
