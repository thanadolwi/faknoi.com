import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminTrips from "@/components/admin/AdminTrips";

export const dynamic = "force-dynamic";

export default async function AdminTripsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role, username").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.username !== "admin") redirect("/dashboard");

  return <AdminTrips />;
}
