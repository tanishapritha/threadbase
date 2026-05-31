import { supabaseAdmin } from "@/lib/supabaseAdmin";
import Link from "next/link";
import PostPreviewClient from "./PostPreviewClient";

interface PostPageProps {
  params: Promise<{ id: string }>;
}

/** Shared helper: fetch post + workspace + user via multi-step Supabase queries. */
async function fetchPostWithUser(postId: string) {
  const { data: post } = await supabaseAdmin
    .from("posts")
    .select(`
      id,
      raw_idea,
      formatted_content,
      post_type,
      tone,
      status,
      scheduled_at,
      posted_at,
      created_at,
      updated_at,
      workspaces!inner(owner_id)
    `)
    .eq("id", postId)
    .single();

  if (!post) return null;

  const p = post as unknown as {
    id: string;
    raw_idea: string;
    formatted_content: { twitter?: string; linkedin?: string } | null;
    post_type: string | null;
    tone: string | null;
    status: string;
    scheduled_at: string | null;
    posted_at: string | null;
    created_at: string;
    updated_at: string;
    workspaces: { owner_id: string };
  };

  // Fetch user via workspace owner_id (no direct FK from posts to users)
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("name")
    .eq("id", p.workspaces.owner_id)
    .single();

  return { post: p, userName: user?.name || "A creator" };
}

// ── Metadata / OpenGraph ────────────────────────────────────────────────────
export async function generateMetadata({ params }: PostPageProps) {
  const { id } = await params;
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  const result = await fetchPostWithUser(id);

  if (!result) {
    return {
      title: "Post not found — Threadbase",
      description: "This post link may have expired.",
    };
  }

  const content =
    result.post.formatted_content?.twitter ||
    result.post.formatted_content?.linkedin ||
    result.post.raw_idea ||
    "";
  const description = content.slice(0, 100);

  return {
    title: `Post by ${result.userName} on Threadbase`,
    description,
    openGraph: {
      title: `Post by ${result.userName} on Threadbase`,
      description,
      url: `${appUrl}/post/${id}`,
      type: "article",
    },
    twitter: {
      card: "summary" as const,
      title: `Post by ${result.userName} on Threadbase`,
      description,
    },
  };
}

// ── 404 View ─────────────────────────────────────────────────────────────
function PostNotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed] font-sans flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-white/40">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Post not found</h1>
        <p className="text-sm text-white/50 mb-8">
          This post link has expired or doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-white text-black hover:bg-white/90 transition-all"
        >
          Go to Threadbase →
        </Link>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  const result = await fetchPostWithUser(id);

  if (!result) {
    return <PostNotFound />;
  }

  const { post: postData, userName } = result;

  const twitterContent = postData.formatted_content?.twitter ?? "";
  const linkedinContent = postData.formatted_content?.linkedin ?? "";
  const isThread = postData.post_type === "thread";

  return (
    <PostPreviewClient
      postId={postData.id}
      twitterContent={twitterContent}
      linkedinContent={linkedinContent}
      rawIdea={postData.raw_idea}
      isThread={isThread}
      status={postData.status}
      scheduledAt={postData.scheduled_at}
      userName={userName}
      appUrl={appUrl}
    />
  );
}
