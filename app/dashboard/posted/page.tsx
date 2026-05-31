"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";

interface Post {
  id: string;
  raw_idea: string;
  formatted_content: { twitter?: string; linkedin?: string } | null;
  post_type: string | null;
  status: string;
  posted_at: string;
  created_at: string;
}

export default function PostedPage() {
  const { showToast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosted = useCallback(async () => {
    try {
      const res = await fetch("/api/posts?status=posted");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (err) {
      console.error("[Posted]", err);
      showToast("Failed to load posted items", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosted();
  }, [fetchPosted]);

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      showToast("Content copied to clipboard", "success");
    });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const truncate = (str: string, len: number) =>
    str.length > len ? str.slice(0, len) + "..." : str;

  return (
    <div className="text-white font-sans animate-fade-up">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-1">Posted</h1>
        <p className="text-sm text-white/50">
          {posts.length} posted item{posts.length !== 1 ? "s" : ""}
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-[#111] border border-white/5 rounded-xl animate-shimmer-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 bg-[#111] border border-white/10 rounded-xl">
          <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <span className="text-2xl">✅</span>
          </div>
          <p className="text-sm text-white/50 font-medium">
            No posted items yet. Posts that go live will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-[#111] border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all shadow-sm"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="inline-flex items-center px-2 py-0.5 text-[10px] rounded uppercase font-semibold tracking-wider text-green-400 bg-green-500/10 border border-green-500/20">
                      Posted
                    </span>
                    {post.formatted_content?.twitter && (
                      <span className="text-[11px] text-white/70 bg-white/10 px-2 py-0.5 rounded font-medium">X</span>
                    )}
                    {post.formatted_content?.linkedin && (
                      <span className="text-[11px] text-[#0a66c2] bg-[#0a66c2]/10 px-2 py-0.5 rounded font-medium">in</span>
                    )}
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed font-light whitespace-pre-wrap">
                    {truncate(
                      post.formatted_content?.twitter || post.raw_idea,
                      250
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <span className="text-xs text-white/40">
                  {post.posted_at ? formatDate(post.posted_at) : formatDate(post.created_at)}
                </span>
                <div className="flex items-center gap-2">
                  {post.formatted_content?.twitter && (
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.formatted_content.twitter)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 h-7 text-xs rounded-md bg-white/5 text-white/60 hover:bg-white/10 font-medium inline-flex items-center"
                    >
                      View on X →
                    </a>
                  )}
                  <button
                    onClick={() =>
                      handleCopyContent(
                        post.formatted_content?.twitter || post.raw_idea
                      )
                    }
                    className="px-3 h-7 text-xs rounded-md bg-white/5 text-white/60 hover:bg-white/10 font-medium"
                  >
                    Reuse →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
