import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getWorkspaceId } from "@/lib/getWorkspaceId";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await getWorkspaceId(userId);
    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const postId = params.id;

    // Verify the post belongs to this workspace
    const { data: existing } = await supabaseAdmin
      .from("posts")
      .select("id")
      .eq("id", postId)
      .eq("workspace_id", workspaceId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const body = await req.json();
    const updates: Record<string, unknown> = {};

    if (body.rawIdea !== undefined) updates.raw_idea = body.rawIdea;
    if (body.formattedContent !== undefined) updates.formatted_content = body.formattedContent;
    if (body.postType !== undefined) updates.post_type = body.postType;
    if (body.tone !== undefined) updates.tone = body.tone;
    if (body.hashtags !== undefined) updates.hashtags = body.hashtags;
    if (body.status !== undefined) updates.status = body.status;
    if (body.scheduledAt !== undefined) updates.scheduled_at = body.scheduledAt;
    if (body.postedAt !== undefined) updates.posted_at = body.postedAt;

    updates.updated_at = new Date().toISOString();

    const { data: post, error } = await supabaseAdmin
      .from("posts")
      .update(updates)
      .eq("id", postId)
      .select()
      .single();

    if (error) {
      console.error("[POSTS_PATCH]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    console.error("[POSTS_PATCH]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await getWorkspaceId(userId);
    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const postId = params.id;

    // Soft delete: set deleted_at
    const { error } = await supabaseAdmin
      .from("posts")
      .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", postId)
      .eq("workspace_id", workspaceId);

    if (error) {
      console.error("[POSTS_DELETE]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    console.error("[POSTS_DELETE]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
