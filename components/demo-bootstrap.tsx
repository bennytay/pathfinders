"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export function DemoBootstrap() {
  const router = useRouter();
  useEffect(() => { let active = true; (async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const current = user ?? (await supabase.auth.signInAnonymously()).data.user;
    if (!current || !active) return;
    const { data: workspace } = await supabase.from("workspaces").select("id").eq("owner_user_id", current.id).maybeSingle();
    if (!workspace) await supabase.from("workspaces").insert({ owner_user_id: current.id });
    if (active) router.refresh();
  })(); return () => { active = false; }; }, [router]);
  return null;
}
