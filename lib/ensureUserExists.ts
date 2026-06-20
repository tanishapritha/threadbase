// lib/ensureUserExists.ts
// Bootstrap guard — ensures a user record + workspace + preferences exist in Supabase.
// Called on every dashboard load as a safety net for users who signed up before the webhook was working.

import { supabaseAdmin } from "./supabaseAdmin";

const bootstrapSkippedUsers = new Set<string>();

function isSupabaseConnectivityError(err: {
  message?: string;
  details?: string;
  code?: string;
} | null | undefined) {
  const haystack = `${err?.message ?? ""}\n${err?.details ?? ""}`.toLowerCase();
  return (
    haystack.includes("fetch failed") ||
    haystack.includes("enotfound") ||
    haystack.includes("getaddrinfo") ||
    haystack.includes("network")
  );
}

export async function ensureUserExists(
  clerkUserId: string,
  email: string,
  name: string
) {
  if (bootstrapSkippedUsers.has(clerkUserId)) {
    return;
  }

  // Check if user already exists
  if (!supabaseAdmin) {
    console.warn('[ensureUserExists] Supabase admin not configured');
    bootstrapSkippedUsers.add(clerkUserId);
    return;
  }

  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("id", clerkUserId)
    .maybeSingle();

  if (fetchError) {
    if (isSupabaseConnectivityError(fetchError)) {
      console.warn("[ensureUserExists] Supabase unreachable, skipping bootstrap for now");
      bootstrapSkippedUsers.add(clerkUserId);
      return;
    }

    console.warn("[ensureUserExists] Error fetching existing user:", fetchError.message);
    return;
  }

  if (existing) {
    // Already bootstrapped
    return;
  }

  const now = new Date().toISOString();
  const workspaceId = crypto.randomUUID();

  console.log("[ensureUserExists] Creating user + workspace for", clerkUserId);

  // 1. Create user record (use upsert to be safe)
  const { error: userError } = await supabaseAdmin
    .from("users")
    .upsert({
      id: clerkUserId,
      email: email || "unknown@threadbase.app",
      name: name || "User",
      created_at: now,
    }, { onConflict: 'id', ignoreDuplicates: true });

  if (userError) {
    if (isSupabaseConnectivityError(userError)) {
      console.warn("[ensureUserExists] Supabase unreachable while creating user");
      bootstrapSkippedUsers.add(clerkUserId);
      return;
    }

    console.warn("[ensureUserExists] Failed to create user:", userError.message);
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
    if (isSupabaseConnectivityError(workspaceError)) {
      console.warn("[ensureUserExists] Supabase unreachable while creating workspace");
      bootstrapSkippedUsers.add(clerkUserId);
      return;
    }

    console.warn("[ensureUserExists] Failed to create workspace:", workspaceError.message);
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
    console.warn(
      "[ensureUserExists] Failed to create workspace member:",
      memberError.message
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
    console.warn(
      "[ensureUserExists] Failed to create preferences:",
      prefsError.message
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
