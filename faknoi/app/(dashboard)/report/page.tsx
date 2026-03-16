import { createClient } from "@/lib/supabase/server";
import ReportForm from "./ReportForm";
import AdminReports from "./AdminReports";

export default async function ReportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const username = user?.user_metadata?.username || "";

  if (username === "testtest") {
    const { data: reports } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });
    return <AdminReports reports={reports || []} />;
  }

  return <ReportForm />;
}
