import { ShoppingBag } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-brand-blue/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-brand-yellow/15 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-brand-cyan/5 rounded-full blur-3xl" />
      </div>

      <Link href="/" className="flex items-center gap-2.5 mb-8 relative group">
        <div className="w-12 h-12 rounded-2xl bg-brand-navy flex items-center justify-center shadow-xl shadow-brand-navy/20 group-hover:scale-105 transition-transform duration-200">
          <ShoppingBag className="w-6 h-6 text-brand-yellow" />
        </div>
        <span className="font-black text-2xl text-brand-navy tracking-tight">FakNoi</span>
      </Link>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-brand-navy/10 border border-white/80 p-8 relative">
        {children}
      </div>

      <p className="text-gray-400 text-xs mt-6 font-medium relative">© 2026 FakNoi 💙</p>
    </div>
  );
}
