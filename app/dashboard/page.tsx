"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

interface Post {
  id: string;
  rawIdea: string;
  formattedContent: { twitter?: string; linkedin?: string } | null;
  postType: string | null;
  status: "draft" | "scheduled" | "posted" | "failed";
  createdAt: string;
}

function DashboardContent({ initialTab }: { initialTab?: "drafts" | "scheduled" | "posted" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const showWelcome = searchParams?.get("welcome") === "1";

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "drafts" | "scheduled">("all");

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/posts");
      if (!res.ok) return;
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (err) {
      console.error("[Dashboard] Failed to fetch posts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const dismissWelcome = () => {
    setWelcomeDismissed(true);
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.delete("welcome");
    router.replace(`/dashboard${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const filteredPosts = posts.filter((p) => {
    if (activeTab === "drafts") return p.status === "draft";
    if (activeTab === "scheduled") return p.status === "scheduled";
    return true;
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const truncate = (str: string, len: number) =>
    str.length > len ? str.slice(0, len) + "..." : str;

  const statusLabel = (status: string) => {
    switch (status) {
      case "draft": return "Draft";
      case "scheduled": return "Scheduled";
      case "posted": return "Posted";
      case "failed": return "Failed";
      default: return status;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "draft": return "text-white/40 bg-white/5 border border-white/10";
      case "scheduled": return "text-blue-400 bg-blue-500/10 border border-blue-500/20";
      case "posted": return "text-green-400 bg-green-500/10 border border-green-500/20";
      case "failed": return "text-red-400 bg-red-500/10 border border-red-500/20";
      default: return "text-white/40 bg-white/5 border border-white/10";
    }
  };

  return (
    <div className="text-white font-sans animate-fade-up">
      {/* ── WELCOME BANNER ───────────────────────────────────── */}
      {showWelcome && !welcomeDismissed && (
        <div className="mb-8 bg-white/5 border border-[hsl(210,50%,30%)] rounded-xl p-4 flex items-start justify-between gap-4 shadow-lg shadow-[hsl(210,50%,30%)]/10">
          <div>
            <p className="text-sm font-medium text-white flex items-center gap-2">
              <span className="text-[hsl(210,50%,65%)]">✨</span> Your post has been saved!
            </p>
            <p className="text-sm text-white/50 mt-1">
              You can edit, schedule, or publish it from your drafts below.
            </p>
          </div>
          <button
            onClick={dismissWelcome}
            className="text-white/40 hover:text-white transition-colors shrink-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* ── 2-COLUMN LAYOUT ──────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:gap-12">
        {/* ── LEFT SIDEBAR: HEADER + STATS ──────────────────── */}
        <div className="lg:w-[280px] shrink-0 mb-8 lg:mb-0">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
              Dashboard
            </h1>
            <p className="text-sm text-white/50">
              {user ? `Welcome back, ${user.firstName || "Creator"}.` : "Loading..."} <br />
              {posts.length} post{posts.length !== 1 ? "s" : ""} in your workspace.
            </p>
          </div>

          {/* Stats */}
          <div className="space-y-3">
            {([{ label: "Drafts", count: posts.filter((p) => p.status === "draft").length, color: "text-white" }, { label: "Scheduled", count: posts.filter((p) => p.status === "scheduled").length, color: "text-[hsl(210,50%,65%)]" }, { label: "Posted", count: posts.filter((p) => p.status === "posted").length, color: "text-green-400" }] as const).map((stat) => (
              <div
                key={stat.label}
                className="bg-[#111] border border-white/10 rounded-xl px-5 py-4 flex items-center justify-between shadow-sm"
              >
                <p className="text-sm text-white/50 font-medium">{stat.label}</p>
                <p className={`text-xl font-bold tracking-tight ${stat.color}`}>
                  {stat.count}
                </p>
              </div>
            ))}
          </div>

          {/* New post button */}
          <Link
            href="/dashboard/compose"
            className="mt-6 w-full h-11 flex items-center justify-center text-sm rounded-lg bg-white text-black hover:bg-white/90 shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all font-medium gap-2"
          >
            <span>✨</span> New post
          </Link>
        </div>

        {/* ── RIGHT MAIN CONTENT: TABS + POSTS ─────────────── */}
        <div className="flex-1 min-w-0">
          {/* Tabs */}
          <div className="flex items-center gap-6 mb-6 border-b border-white/10 px-1">
            {([{ key: "all" as const, label: "All posts" }, { key: "drafts" as const, label: "Drafts" }, { key: "scheduled" as const, label: "Scheduled" }]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`pb-3 text-sm font-medium border-b-2 transition-all ${
                  activeTab === tab.key
                    ? "border-white text-white"
                    : "border-transparent text-white/40 hover:text-white/80"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Posts list */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-[#111] border border-white/5 rounded-xl animate-shimmer-pulse"
                />
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-20 bg-[#111] border border-white/10 rounded-xl shadow-inner">
              <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <span className="text-2xl">✍️</span>
              </div>
              <p className="text-sm text-white/50 font-medium mb-4">
                {activeTab === "all"
                  ? "No posts yet. Start drafting your first thread!"
                  : activeTab === "drafts"
                  ? "Your drafts folder is empty."
                  : "No scheduled posts in the queue."}
              </p>
              <Link
                href="/dashboard/compose"
                className="inline-flex h-9 px-5 items-center justify-center text-sm rounded-md bg-white/10 text-white hover:bg-white/20 transition-colors font-medium border border-white/10"
              >
                Start writing
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-[#111] border border-white/10 rounded-xl p-5 hover:bg-white/5 hover:border-white/20 transition-all cursor-default shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 text-[10px] rounded uppercase font-semibold tracking-wider ${statusColor(post.status)}`}
                        >
                          {statusLabel(post.status)}
                        </span>
                        {post.postType && (
                          <span className="text-[11px] text-white/40 font-medium uppercase tracking-[0.06em]">
                            {post.postType}
                          </span>
                        )}
                        {post.formattedContent?.twitter && (
                          <span className="text-[11px] text-white/70 bg-white/10 px-2 py-0.5 rounded font-medium border border-white/10">X</span>
                        )}
                        {post.formattedContent?.linkedin && (
                          <span className="text-[11px] text-[#0a66c2] bg-[#0a66c2]/10 px-2 py-0.5 rounded font-medium border border-[#0a66c2]/20">in</span>
                        )}
                      </div>
                      <p className="text-sm text-white/80 leading-relaxed font-light">
                        {truncate(post.rawIdea, 150)}
                      </p>
                    </div>
                    <div className="flex items-center sm:flex-col sm:items-end gap-3 shrink-0">
                      <span className="text-xs text-white/30 font-medium">
                        {formatDate(post.createdAt)}
                      </span>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/compose?id=${post.id}`}
                          className="px-4 h-8 inline-flex items-center justify-center text-xs rounded-md bg-white/10 text-white hover:bg-white/20 transition-colors font-medium border border-white/10"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
