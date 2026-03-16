import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import I18nOrderDetail from "@/components/I18nOrderDetail";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: order } = await supabase
    .from("orders")
    .select("*, trips(*, profiles(username)), profiles(username)")
    .eq("id", id)
    .single();

  if (!order) notFound();

  const isBuyer = order.buyer_id === user?.id;
  const isShopper = order.trips?.shopper_id === user?.id;

  return (
    <I18nOrderDetail
      order={order}
      userId={user!.id}
      username={user?.user_metadata?.username || ""}
      isBuyer={isBuyer}
      isShopper={isShopper}
    />
  );
}
