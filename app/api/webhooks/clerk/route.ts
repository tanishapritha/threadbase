import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, workspaces, workspaceMembers } from "@/lib/db/schema";

export async function POST(req: Request) {
  const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!SIGNING_SECRET) {
    console.error("Missing CLERK_WEBHOOK_SECRET");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  // Get headers for Svix verification
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing Svix headers" },
      { status: 400 }
    );
  }

  // Read raw body for signature verification (must use req.text() to preserve original bytes)
  const body = await req.text();
  const payload = JSON.parse(body);

  let evt: { type: string; data: Record<string, unknown> };
  try {
    const wh = new Webhook(SIGNING_SECRET);
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as { type: string; data: Record<string, unknown> };
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }

  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data as {
      id: string;
      email_addresses: { email_address: string }[];
      first_name?: string;
      last_name?: string;
      image_url?: string;
    };

    const email = email_addresses?.[0]?.email_address ?? "unknown@threadbase.app";
    const name = [first_name, last_name].filter(Boolean).join(" ") || "User";

    // Create user in our database
    const [user] = await db
      .insert(users)
      .values({
        clerkId: id,
        email,
        name,
        avatarUrl: image_url,
      })
      .onConflictDoNothing()
      .returning();

    if (user) {
      // Create a default workspace for the new user
      const slug = `workspace-${user.id.slice(0, 8)}`;

      const [workspace] = await db
        .insert(workspaces)
        .values({
          ownerId: user.id,
          name: `${name}'s Workspace`,
          slug,
        })
        .returning();

      // Add them as a member
      await db.insert(workspaceMembers).values({
        workspaceId: workspace.id,
        userId: user.id,
        role: "owner",
      });
    }
  }

  if (eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data as {
      id: string;
      email_addresses: { email_address: string }[];
      first_name?: string;
      last_name?: string;
      image_url?: string;
    };

    const email = email_addresses?.[0]?.email_address ?? undefined;
    const name = [first_name, last_name].filter(Boolean).join(" ") || undefined;

    await db
      .update(users)
      .set({
        ...(email && { email }),
        ...(name && { name }),
        ...(image_url && { avatarUrl: image_url }),
      })
      .where(eq(users.clerkId, id));
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data as { id: string };
    // Soft-delete or remove the user
    await db.delete(users).where(eq(users.clerkId, id));
  }

  return NextResponse.json({ success: true });
}
