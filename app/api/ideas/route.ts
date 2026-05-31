import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getWorkspaceId } from "@/lib/getWorkspaceId";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await getWorkspaceId(userId);
    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const { data: ideas, error } = await supabaseAdmin
      .from("ideas")
      .select("*")
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[IDEAS_GET]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ideas });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    console.error("[IDEAS_GET]", error);
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

    const body = await req.json();
    const { rawText, ideaType } = body;

    if (!rawText) {
      return NextResponse.json({ error: "rawText is required" }, { status: 400 });
    }

    const { data: idea, error } = await supabaseAdmin
      .from("ideas")
      .insert({
        workspace_id: workspaceId,
        raw_text: rawText,
        idea_type: ideaType ?? null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("[IDEAS_POST]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ idea });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    console.error("[IDEAS_POST]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
