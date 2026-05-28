import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { posts, users, workspaces, workspaceMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function getOrCreateWorkspace(clerkId: string) {
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (existingUser) {
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.ownerId, existingUser.id))
      .limit(1);
    if (workspace) return workspace.id;
  }

  const [newUser] = await db
    .insert(users)
    .values({ clerkId, email: "pending@threadbase.app", name: "User" })
    .returning();

  const slug = `workspace-${newUser.id.slice(0, 8)}`;

  const [newWorkspace] = await db
    .insert(workspaces)
    .values({ ownerId: newUser.id, name: "My Workspace", slug })
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { rawIdea, postType, twitterContent, linkedinContent, platforms } = body;

    if (!rawIdea) {
      return NextResponse.json({ error: "rawIdea is required" }, { status: 400 });
    }

    const workspaceId = await getOrCreateWorkspace(userId);

    const [post] = await db
      .insert(posts)
      .values({
        workspaceId,
        rawIdea,
        postType: postType || "Tip",
        formattedContent: {
          twitter: twitterContent || null,
          linkedin: linkedinContent || null,
        },
        status: "draft",
      })
      .returning();

    return NextResponse.json({ postId: post.id });
  } catch (error: any) {
    console.error("[SAVE_PENDING]", error);
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}
