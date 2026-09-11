"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export function DemoBootstrap() {
  const router = useRouter();
  useEffect(() => { let active = true; (async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const current = session?.user ?? (await supabase.auth.signInAnonymously()).data.user;
    if (!current || !active) return;
    const { error } = await supabase.from("workspaces").upsert({ owner_user_id: current.id }, { onConflict: "owner_user_id", ignoreDuplicates: true });
    if (error || !active) return;
    if (active) router.refresh();
  })(); return () => { active = false; }; }, [router]);
  return null;
}
