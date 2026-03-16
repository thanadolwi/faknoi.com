import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const username = user.user_metadata?.username || user.email?.split("@")[0] || "ผู้ใช้";

  return (
    <div className="min-h-screen">
      <Navbar username={username} />
      <main className="max-w-5xl mx-auto px-4 py-6 pb-28 md:pb-8">
        {children}
      </main>
    </div>
  );
}
