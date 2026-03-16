import { ShoppingBag } from "lucide-react";
import Link from "next/link";

function Star({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Blob decorations */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-candy-lilac/25 rounded-[60%_40%_70%_30%/50%_60%_40%_50%] -translate-x-1/3 -translate-y-1/3 blur-xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-candy-pink/20 rounded-[40%_60%_30%_70%/60%_40%_50%_50%] translate-x-1/3 translate-y-1/3 blur-xl pointer-events-none" />
      <div className="absolute top-1/2 right-[5%] w-40 h-40 bg-candy-sky/20 rounded-full blur-2xl pointer-events-none" />

      {/* Floating stars */}
      <Star className="absolute top-[10%] right-[12%] w-5 h-5 text-candy-lilac/60 animate-spin-slow pointer-events-none" />
      <Star className="absolute bottom-[12%] left-[10%] w-4 h-4 text-candy-pink/60 animate-spin-slow pointer-events-none" style={{animationDelay:"2s"}} />

      <Link href="/" className="flex items-center gap-2.5 mb-8 relative group">
        <div className="w-12 h-12 rounded-2xl bg-brand-navy flex items-center justify-center shadow-xl shadow-brand-navy/20 group-hover:scale-105 transition-transform duration-200">
          <ShoppingBag className="w-6 h-6 text-brand-yellow" />
        </div>
        <span className="font-black text-2xl text-brand-navy tracking-tight">FakNoi</span>
        <Star className="w-3.5 h-3.5 text-candy-lilac" />
      </Link>

      <div className="w-full max-w-md bg-white/85 backdrop-blur-xl rounded-3xl shadow-xl shadow-candy-lilac/20 border-2 border-white p-8 relative">
        {children}
      </div>

      <p className="text-gray-400 text-xs mt-6 font-bold relative">© 2026 FakNoi 💜</p>
    </div>
  );
}
