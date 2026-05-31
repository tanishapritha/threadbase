import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getWorkspaceId } from "@/lib/getWorkspaceId";
import { tasks } from "@trigger.dev/sdk/v3";
import { sendScheduledPostEmail } from "@/src/trigger/sendScheduledPostEmail";

/**
 * POST /api/posts/schedule
 *
 * Schedules a post and optionally registers a Trigger.dev email reminder job.
 * Body: { postId?, rawIdea, formattedContent, postType, tone, scheduledAt, sendEmail }
 *
 * If postId is provided, updates the existing post.
 * Otherwise, creates a new post with status='scheduled'.
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await getWorkspaceId(userId);
    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const body = await req.json();
    const { postId, rawIdea, formattedContent, postType, tone, scheduledAt, sendEmail } = body;

    if (!scheduledAt) {
      return NextResponse.json({ error: "scheduledAt is required" }, { status: 400 });
    }

    let finalPostId = postId;
    const now = new Date().toISOString();

    if (postId) {
      // Update existing post — verify ownership
      const { data: existing } = await supabaseAdmin
        .from("posts")
        .select("id")
        .eq("id", postId)
        .eq("workspace_id", workspaceId)
        .single();

      if (!existing) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }

      const { error: updateError } = await supabaseAdmin
        .from("posts")
        .update({
          status: "scheduled",
          scheduled_at: scheduledAt,
          updated_at: now,
        })
        .eq("id", postId);

      if (updateError) {
        console.error("[SCHEDULE_POST] Update error:", updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    } else {
      // Create new post
      const { data: newPost, error: insertError } = await supabaseAdmin
        .from("posts")
        .insert({
          workspace_id: workspaceId,
          raw_idea: rawIdea,
          formatted_content: formattedContent ?? null,
          post_type: postType ?? null,
          tone: tone ?? null,
          status: "scheduled",
          scheduled_at: scheduledAt,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (insertError) {
        console.error("[SCHEDULE_POST] Insert error:", insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      finalPostId = newPost.id;
    }

    // Trigger the email job at the scheduled time (if user opted in)
    if (sendEmail !== false) {
      await tasks.trigger(
        sendScheduledPostEmail.id,
        { postId: finalPostId },
        { delay: new Date(scheduledAt) }
      );
    }

    return NextResponse.json({ success: true, postId: finalPostId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    console.error("[SCHEDULE_POST]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
