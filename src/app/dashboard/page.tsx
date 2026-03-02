import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: interviews } = await supabase
    .from("interviews")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return <DashboardClient interviews={interviews ?? []} userEmail={user.email ?? ""} />;
}
