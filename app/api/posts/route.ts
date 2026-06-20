import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getWorkspaceId } from "@/lib/getWorkspaceId";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await getWorkspaceId(userId);
    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get("status");

    let query = supabaseAdmin
      .from("posts")
      .select("*")
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: posts, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("[POSTS_GET]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ posts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    console.error("[POSTS_GET]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const body = await req.json();
    const {
      rawIdea,
      formattedContent,
      postType,
      tone,
      hashtags,
      status,
      scheduledAt,
    } = body;

    if (!rawIdea) {
      return NextResponse.json({ error: "rawIdea is required" }, { status: 400 });
    }

    const { data: post, error } = await supabaseAdmin
      .from("posts")
      .insert({
        workspace_id: workspaceId,
        raw_idea: rawIdea,
        formatted_content: formattedContent ?? null,
        post_type: postType ?? null,
        tone: tone ?? null,
        hashtags: hashtags ?? null,
        status: status ?? "draft",
        scheduled_at: scheduledAt ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("[POSTS_POST]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    console.error("[POSTS_POST]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
