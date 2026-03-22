import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminUsers from "@/components/admin/AdminUsers";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role, username").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.username !== "admin") redirect("/dashboard");

  return <AdminUsers />;
}
