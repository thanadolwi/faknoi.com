import { ShoppingBag } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-navy via-brand-blue to-brand-cyan flex flex-col items-center justify-center p-4">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 rounded-xl bg-brand-yellow flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-brand-navy" />
        </div>
        <span className="font-bold text-2xl text-white">FakNoi</span>
      </Link>
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
        {children}
      </div>
    </div>
  );
}
