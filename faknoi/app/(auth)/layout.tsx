import { ShoppingBag } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-navy via-brand-blue to-brand-cyan flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-yellow/10 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <Link href="/" className="flex items-center gap-2.5 mb-8 relative">
        <div className="w-11 h-11 rounded-2xl bg-brand-yellow flex items-center justify-center shadow-lg">
          <ShoppingBag className="w-5 h-5 text-brand-navy" />
        </div>
        <span className="font-extrabold text-2xl text-white tracking-tight">FakNoi</span>
      </Link>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-brand-navy/20 p-8 relative">
        {children}
      </div>

      <p className="text-white/40 text-xs mt-6 relative">© 2026 FakNoi</p>
    </div>
  );
}
