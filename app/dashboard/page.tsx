"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";

interface Post {
  id: string;
  rawIdea: string;
  formattedContent: { twitter?: string; linkedin?: string } | null;
  postType: string | null;
  status: "draft" | "scheduled" | "posted" | "failed";
  createdAt: string;
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const showWelcome = searchParams.get("welcome") === "1";

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "drafts" | "scheduled">("all");

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/posts/list");
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
    const params = new URLSearchParams(searchParams.toString());
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
      case "draft":
        return "Draft";
      case "scheduled":
        return "Scheduled";
      case "posted":
        return "Posted";
      case "failed":
        return "Failed";
      default:
        return status;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "text-gray-400 bg-gray-100";
      case "scheduled":
        return "text-blue-600 bg-blue-50";
      case "posted":
        return "text-green-600 bg-green-50";
      case "failed":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-400 bg-gray-100";
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 font-sans">
      {/* ── TOP NAV ──────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-40 bg-white border-b border-[#E5E7EB]">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between h-[52px] px-6 md:px-12">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-[#111]" />
              <span className="text-[15px] font-[500] tracking-tight text-gray-900">
                Threadbase
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1">
              <a
                href="/dashboard"
                className="px-3 py-1.5 text-[13px] text-gray-900 bg-gray-100 rounded-md font-[500]"
              >
                Dashboard
              </a>
              <a
                href="/compose"
                className="px-3 py-1.5 text-[13px] text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors font-[400]"
              >
                Compose
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/compose"
              className="sm:hidden text-[13px] text-gray-400 hover:text-gray-700 transition-colors font-[400]"
            >
              Compose
            </a>
            {user && (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-[13px] text-gray-400 font-[400]">
                  {user.firstName || user.emailAddresses?.[0]?.emailAddress?.split("@")[0]}
                </span>
                <UserButton />
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── MAIN ─────────────────────────────────────────────────── */}
      <main className="pt-[52px]">
        <div className="w-full max-w-7xl mx-auto px-6 md:px-12 py-10 md:py-14">
          {/* ── WELCOME BANNER ───────────────────────────────────── */}
          {showWelcome && !welcomeDismissed && (
            <div className="mb-8 bg-white border border-[#E5E7EB] rounded-lg p-4 flex items-start justify-between gap-4 animate-fade-up">
              <div>
                <p className="text-[14px] font-[500] text-gray-900">
                  Your post has been saved!
                </p>
                <p className="text-[13px] text-gray-400 mt-0.5">
                  You can edit, schedule, or publish it from your drafts below.
                </p>
              </div>
              <button
                onClick={dismissWelcome}
                className="text-gray-300 hover:text-gray-500 transition-colors shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* ── ASYMMETRIC 2-COLUMN LAYOUT ──────────────────────── */}
          <div className="flex flex-col lg:flex-row lg:gap-12">
            {/* ── LEFT SIDEBAR: HEADER + STATS ──────────────────── */}
            <div className="lg:w-[280px] shrink-0 mb-8 lg:mb-0">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-[26px] font-serif font-[500] tracking-[-0.01em] text-gray-900 leading-tight">
                  Dashboard
                </h1>
                <p className="text-[13px] text-gray-400 mt-1.5 font-[400]">
                  {posts.length} post{posts.length !== 1 ? "s" : ""} in your workspace
                </p>
              </div>

              {/* Stats */}
              <div className="space-y-3">
                {([{ label: "Drafts", count: posts.filter((p) => p.status === "draft").length, color: "text-gray-400" }, { label: "Scheduled", count: posts.filter((p) => p.status === "scheduled").length, color: "text-blue-500" }, { label: "Posted", count: posts.filter((p) => p.status === "posted").length, color: "text-green-500" }] as const).map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 flex items-center justify-between"
                  >
                    <p className="text-[13px] text-gray-400 font-[400]">{stat.label}</p>
                    <p className={`text-[20px] font-[500] tracking-tight ${stat.color}`}>
                      {stat.count}
                    </p>
                  </div>
                ))}
              </div>

              {/* New post button */}
              <a
                href="/compose"
                className="mt-6 w-full h-[38px] inline-flex items-center justify-center text-[13px] rounded-[6px] bg-[#111] text-white hover:bg-[#222] transition-colors font-[500]"
              >
                New post &rarr;
              </a>
            </div>

            {/* ── RIGHT MAIN CONTENT: TABS + POSTS ─────────────── */}
            <div className="flex-1 min-w-0">
              {/* Tabs */}
              <div className="flex items-center gap-1 mb-6 border-b border-[#E5E7EB]">
                {([{ key: "all" as const, label: "All posts" }, { key: "drafts" as const, label: "Drafts" }, { key: "scheduled" as const, label: "Scheduled" }]).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-3 pb-2.5 text-[13px] font-[500] border-b-2 transition-colors ${
                      activeTab === tab.key
                        ? "border-[#111] text-gray-900"
                        : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Posts list */}
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-[72px] bg-white border border-[#E5E7EB] rounded-lg animate-shimmer-pulse"
                    />
                  ))}
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </div>
                  <p className="text-[14px] text-gray-400 font-[400]">
                    {activeTab === "all"
                      ? "No posts yet. Create your first one!"
                      : activeTab === "drafts"
                      ? "No drafts."
                      : "No scheduled posts."}
                  </p>
                  <a
                    href="/compose"
                    className="inline-block mt-3 h-[32px] px-4 leading-[32px] text-[12px] rounded-[6px] bg-[#111] text-white hover:bg-[#222] transition-colors font-[500]"
                  >
                    Compose a post &rarr;
                  </a>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredPosts.map((post) => (
                    <div
                      key={post.id}
                      className="bg-white border border-[#E5E7EB] rounded-lg p-4 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {post.postType && (
                              <span className="text-[11px] text-gray-400 font-[500] uppercase tracking-[0.06em]">
                                {post.postType}
                              </span>
                            )}
                            <span
                              className={`inline-flex items-center px-2 h-[20px] text-[11px] rounded font-[500] ${statusColor(post.status)}`}
                            >
                              {statusLabel(post.status)}
                            </span>
                            {post.formattedContent?.twitter && (
                              <span className="text-[11px] text-[#1d9bf0] font-[500]">Twitter</span>
                            )}
                            {post.formattedContent?.linkedin && (
                              <span className="text-[11px] text-[#0a66c2] font-[500]">LinkedIn</span>
                            )}
                          </div>
                          <p className="text-[14px] text-gray-600 leading-relaxed font-[400]">
                            {truncate(post.rawIdea, 120)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[12px] text-gray-300 font-[400] whitespace-nowrap">
                            {formatDate(post.createdAt)}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => router.push(`/compose?id=${post.id}`)}
                              className="px-3 h-[28px] text-[12px] rounded-[4px] bg-white text-gray-400 border border-[#E5E7EB] hover:text-gray-700 hover:border-gray-300 transition-colors font-[500]"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => router.push(`/compose?id=${post.id}&schedule=1`)}
                              className="px-3 h-[28px] text-[12px] rounded-[4px] bg-[#111] text-white hover:bg-[#222] transition-colors font-[500]"
                            >
                              Schedule
                            </button>
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
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
