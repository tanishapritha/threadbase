import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { posts, users, workspaces } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the user and their workspace
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ posts: [] });
    }

    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.ownerId, user.id))
      .limit(1);

    if (!workspace) {
      return NextResponse.json({ posts: [] });
    }

    // Fetch all posts for this workspace, ordered by most recent first
    const userPosts = await db
      .select()
      .from(posts)
      .where(eq(posts.workspaceId, workspace.id))
      .orderBy(desc(posts.createdAt))
      .limit(50);

    return NextResponse.json({ posts: userPosts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    console.error("[POSTS_LIST]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
