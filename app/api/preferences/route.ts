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

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { data: preferences, error } = await supabaseAdmin
      .from("preferences")
      .select("*")
      .eq("workspace_id", workspaceId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found
      console.error("[PREFERENCES_GET]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ preferences: preferences ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    console.error("[PREFERENCES_GET]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
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
    const now = new Date().toISOString();

    // Check if preferences exist
    const { data: existing } = await supabaseAdmin
      .from("preferences")
      .select("id")
      .eq("workspace_id", workspaceId)
      .single();

    const updates: Record<string, unknown> = {};
    if (body.bio !== undefined) updates.bio = body.bio;
    if (body.niche !== undefined) updates.niche = body.niche;
    if (body.defaultTone !== undefined) updates.default_tone = body.defaultTone;
    if (body.twitterFormat !== undefined) updates.twitter_format = body.twitterFormat;
    if (body.linkedinFormat !== undefined) updates.linkedin_format = body.linkedinFormat;
    if (body.addHashtags !== undefined) updates.add_hashtags = body.addHashtags;
    if (body.topics !== undefined) updates.topics = body.topics;
    if (body.avoidTopics !== undefined) updates.avoid_topics = body.avoidTopics;

    let result;

    if (existing) {
      // Update
      updates.updated_at = now;
      const { data, error } = await supabaseAdmin
        .from("preferences")
        .update(updates)
        .eq("workspace_id", workspaceId)
        .select()
        .single();

      if (error) {
        console.error("[PREFERENCES_PATCH]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      result = data;
    } else {
      // Insert
      const insertPayload: Record<string, unknown> = {
        workspace_id: workspaceId,
        created_at: now,
        updated_at: now,
      };
      // Copy over the fields from updates
      for (const [key, value] of Object.entries(updates)) {
        insertPayload[key] = value;
      }

      const { data, error } = await supabaseAdmin
        .from("preferences")
        .insert(insertPayload)
        .select()
        .single();

      if (error) {
        console.error("[PREFERENCES_PATCH]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      result = data;
    }

    return NextResponse.json({ preferences: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    console.error("[PREFERENCES_PATCH]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
