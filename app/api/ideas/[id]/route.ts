import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getWorkspaceId } from "@/lib/getWorkspaceId";

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

    const ideaId = params.id;

    // Soft delete: set deleted_at
    const { error } = await supabaseAdmin
      .from("ideas")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", ideaId)
      .eq("workspace_id", workspaceId);

    if (error) {
      console.error("[IDEAS_DELETE]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    console.error("[IDEAS_DELETE]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
