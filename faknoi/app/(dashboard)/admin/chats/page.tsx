import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminChats from "@/components/admin/AdminChats";

export const revalidate = 0;

export default async function AdminChatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, username")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.username !== "admin") redirect("/dashboard");

  // ดึง orders ทั้งหมดพร้อม buyer/shopper username
  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, item_name, created_at, buyer_id, profiles(username), trips(shopper_id, profiles(username))")
    .order("created_at", { ascending: false })
    .limit(200);

  // นับ unread ต่อ order (messages ที่ไม่ใช่ของ admin)
  const { data: msgCounts } = await supabase
    .from("messages")
    .select("order_id")
    .not("sender_id", "eq", user.id);

  const unreadMap: Record<string, number> = {};
  for (const m of msgCounts || []) {
    unreadMap[m.order_id] = (unreadMap[m.order_id] || 0) + 1;
  }

  const ordersWithUnread = (orders || []).map((o: any) => ({
    ...o,
    unread: unreadMap[o.id] || 0,
  }));

  return <AdminChats orders={ordersWithUnread} currentUserId={user.id} />;
}
