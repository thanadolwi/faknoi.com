import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminReportsPage from "@/components/admin/AdminReportsPage";
import { UNIVERSITIES } from "@/lib/universities";

export const dynamic = "force-dynamic";

export default async function AdminReportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role, username").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.username !== "admin") redirect("/dashboard");

  const admin = createAdminClient();
  const { data: reports } = await admin
    .from("reports")
    .select("id, subject, body, role, report_status, created_at, reporter_id, reporter_username, phone, gmail, image_url, university_id")
    .order("created_at", { ascending: false });

  return <AdminReportsPage reports={reports || []} universities={UNIVERSITIES} adminId={user.id} />;
}
