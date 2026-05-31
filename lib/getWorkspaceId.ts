// lib/getWorkspaceId.ts
// Returns the workspace UUID for a given Clerk user ID.
// Every API route must call this instead of using userId as workspace_id directly.

import { supabaseAdmin } from "./supabaseAdmin";

export async function getWorkspaceId(
  clerkUserId: string
): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", clerkUserId)
    .eq("role", "owner")
    .single();

  if (error || !data) {
    console.error("[getWorkspaceId] Failed for user", clerkUserId, error);
    return null;
  }

  return data.workspace_id;
}
