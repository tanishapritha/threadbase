// lib/ensureUserExists.ts
// Bootstrap guard — ensures a user record + workspace + preferences exist in Supabase.
// Called on every dashboard load as a safety net for users who signed up before the webhook was working.

import { supabaseAdmin } from "./supabaseAdmin";

export async function ensureUserExists(
  clerkUserId: string,
  email: string,
  name: string
) {
  // Check if user already exists
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("id", clerkUserId)
    .single();

  if (existing) {
    // Already bootstrapped
    return;
  }

  const now = new Date().toISOString();
  const workspaceId = crypto.randomUUID();

  console.log("[ensureUserExists] Creating user + workspace for", clerkUserId);

  // 1. Create user record
  const { error: userError } = await supabaseAdmin
    .from("users")
    .insert({
      id: clerkUserId,
      email: email || "unknown@threadbase.app",
      name: name || "User",
      created_at: now,
    });

  if (userError) {
    console.error("[ensureUserExists] Failed to create user:", userError);
    return;
  }

  // 2. Create workspace
  const slug =
    name
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") ||
    "workspace-" + clerkUserId.slice(-8);

  const { error: workspaceError } = await supabaseAdmin
    .from("workspaces")
    .insert({
      id: workspaceId,
      owner_id: clerkUserId,
      name: name ? `${name}'s workspace` : "My workspace",
      slug: slug + "-" + clerkUserId.slice(-6),
      created_at: now,
    });

  if (workspaceError) {
    console.error("[ensureUserExists] Failed to create workspace:", workspaceError);
    return;
  }

  // 3. Create workspace membership
  const { error: memberError } = await supabaseAdmin
    .from("workspace_members")
    .insert({
      workspace_id: workspaceId,
      user_id: clerkUserId,
      role: "owner",
      joined_at: now,
    });

  if (memberError) {
    console.error(
      "[ensureUserExists] Failed to create workspace member:",
      memberError
    );
    return;
  }

  // 4. Create preferences
  const { error: prefsError } = await supabaseAdmin
    .from("preferences")
    .insert({
      workspace_id: workspaceId,
      default_tone: "professional",
      created_at: now,
      updated_at: now,
    });

  if (prefsError) {
    console.error(
      "[ensureUserExists] Failed to create preferences:",
      prefsError
    );
    return;
  }

  console.log(
    "[ensureUserExists] Successfully bootstrapped user",
    clerkUserId,
    "with workspace",
    workspaceId
  );
}
