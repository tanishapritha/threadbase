// ─────────────────────────────────────────────────────────────────────────────
// Clerk Webhook Handler
// ─────────────────────────────────────────────────────────────────────────────
// This endpoint receives webhook events from Clerk (user.created, etc.),
// verifies the Svix signature, and bootstraps the user's workspace in Supabase.
//
// SETUP (Clerk Dashboard):
// 1. Go to https://dashboard.clerk.com → Webhooks → Add Endpoint
// 2. Endpoint URL: https://your-domain.com/api/webhooks/clerk
// 3. Events to subscribe: user.created
// 4. Copy the Signing Secret into your .env.local as CLERK_WEBHOOK_SECRET
//    (and add it to Vercel env vars for production)
// ─────────────────────────────────────────────────────────────────────────────

import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!SIGNING_SECRET) {
    console.error("[WEBHOOK] Missing CLERK_WEBHOOK_SECRET");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  // ── Verify Svix signature ──────────────────────────────────────────────
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error("[WEBHOOK] Missing Svix headers");
    return NextResponse.json(
      { error: "Missing Svix headers" },
      { status: 400 }
    );
  }

  // Read raw body for signature verification
  const body = await req.text();

  let evt: { type: string; data: Record<string, unknown> };
  try {
    const wh = new Webhook(SIGNING_SECRET);
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as { type: string; data: Record<string, unknown> };
  } catch (err) {
    console.error("[WEBHOOK] Signature verification failed:", err);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 400 }
    );
  }

  // ── Handle user.created only ──────────────────────────────────────────
  const eventType = evt.type;
  console.log("[WEBHOOK] Received event:", eventType);

  if (eventType !== "user.created") {
    // Ignore other events silently
    return NextResponse.json({ received: true });
  }

  const {
    id,
    email_addresses,
    first_name,
    last_name,
    image_url,
  } = evt.data as {
    id: string;
    email_addresses: { email_address: string }[];
    first_name?: string;
    last_name?: string;
    image_url?: string;
  };

  const clerkUserId = id;
  const email = email_addresses?.[0]?.email_address ?? "unknown@threadbase.app";
  const name = [first_name, last_name].filter(Boolean).join(" ") || "User";
  const now = new Date().toISOString();
  const workspaceId = crypto.randomUUID();

  console.log("[WEBHOOK] Bootstrapping user:", { clerkUserId, email, name });

  try {
    // ── Step 1: Upsert user ───────────────────────────────────────────
    const { error: userError } = await supabaseAdmin
      .from("users")
      .upsert(
        {
          id: clerkUserId,
          email,
          name,
          avatar_url: image_url ?? null,
          created_at: now,
        },
        { onConflict: "id", ignoreDuplicates: true }
      );

    if (userError) {
      console.error("[WEBHOOK] Failed to upsert user:", userError);
      return NextResponse.json(
        { error: `Failed to create user: ${userError.message}` },
        { status: 500 }
      );
    }
    console.log("[WEBHOOK] User upserted:", clerkUserId);

    // ── Step 2: Create workspace ──────────────────────────────────────
    const slug =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") ||
      "workspace";

    const { error: workspaceError } = await supabaseAdmin
      .from("workspaces")
      .insert({
        id: workspaceId,
        owner_id: clerkUserId,
        name: `${name}'s workspace`,
        slug: `${slug}-${clerkUserId.slice(-6)}`,
        created_at: now,
      });

    if (workspaceError) {
      console.error("[WEBHOOK] Failed to create workspace:", workspaceError);
      return NextResponse.json(
        { error: `Failed to create workspace: ${workspaceError.message}` },
        { status: 500 }
      );
    }
    console.log("[WEBHOOK] Workspace created:", workspaceId);

    // ── Step 3: Create workspace membership ───────────────────────────
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
        "[WEBHOOK] Failed to create workspace member:",
        memberError
      );
      return NextResponse.json(
        {
          error: `Failed to create workspace member: ${memberError.message}`,
        },
        { status: 500 }
      );
    }
    console.log("[WEBHOOK] Workspace member created");

    // ── Step 4: Create default preferences ────────────────────────────
    const { error: prefsError } = await supabaseAdmin
      .from("preferences")
      .insert({
        workspace_id: workspaceId,
        default_tone: "professional",
        created_at: now,
        updated_at: now,
      });

    if (prefsError) {
      console.error("[WEBHOOK] Failed to create preferences:", prefsError);
      return NextResponse.json(
        { error: `Failed to create preferences: ${prefsError.message}` },
        { status: 500 }
      );
    }
    console.log("[WEBHOOK] Preferences created");

    // ── Success ─────────────────────────────────────────────────────
    console.log("[WEBHOOK] User fully bootstrapped:", clerkUserId);
    return NextResponse.json({ received: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown webhook error";
    console.error("[WEBHOOK] Unexpected error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
