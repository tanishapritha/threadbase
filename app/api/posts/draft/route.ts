import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { posts, users, workspaces, workspaceMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function getOrCreateWorkspace(clerkId: string) {
  // Look up the user by clerkId
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (existingUser) {
    // Find their workspace
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.ownerId, existingUser.id))
      .limit(1);

    if (workspace) return workspace.id;
  }

  // If we got here, the user doesn't exist yet — create them and a workspace on the fly
  // We use placeholder data since the webhook will eventually handle this properly
  const [newUser] = await db
    .insert(users)
    .values({
      clerkId,
      email: "pending@threadbase.app",
      name: "User",
    })
    .returning();

  const slug = `workspace-${newUser.id.slice(0, 8)}`;

  const [newWorkspace] = await db
    .insert(workspaces)
    .values({
      ownerId: newUser.id,
      name: "My Workspace",
      slug,
    })
    .returning();

  await db.insert(workspaceMembers).values({
    workspaceId: newWorkspace.id,
    userId: newUser.id,
    role: "owner",
  });

  return newWorkspace.id;
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const workspaceId = await getOrCreateWorkspace(userId);

    const { id, rawIdea, formattedContent, tone } = await req.json();

    if (id) {
      // Update existing draft
      const [updatedPost] = await db
        .update(posts)
        .set({
          rawIdea,
          formattedContent,
          tone,
          updatedAt: new Date(),
        })
        .where(eq(posts.id, id))
        .returning();

      return NextResponse.json(updatedPost);
    } else {
      // Create new draft
      const [newPost] = await db
        .insert(posts)
        .values({
          workspaceId,
          rawIdea,
          formattedContent,
          tone,
          status: "draft",
        })
        .returning();

      return NextResponse.json(newPost);
    }
  } catch (error) {
    console.error("[DRAFT_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
