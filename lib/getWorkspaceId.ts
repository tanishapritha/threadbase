// lib/getWorkspaceId.ts
// Returns the workspace UUID for a given Clerk user ID.
// Every API route must call this instead of using userId as workspace_id directly.

import { supabaseAdmin } from "./supabaseAdmin";

export async function getWorkspaceId(
  clerkUserId: string
): Promise<string | null> {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin not configured");
  }

  const { data, error } = await supabaseAdmin
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", clerkUserId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[getWorkspaceId] Lookup failed for user", clerkUserId, error);
    throw new Error("Failed to resolve workspace");
  }

  if (!data) {
    return null;
  }

  return data.workspace_id;
}
