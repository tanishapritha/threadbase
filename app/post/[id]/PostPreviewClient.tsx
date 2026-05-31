"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { buildTwitterIntentUrl } from "@/lib/twitterIntent";

interface PostPreviewClientProps {
  postId: string;
  twitterContent: string;
  linkedinContent: string;
  rawIdea: string;
  isThread: boolean;
  status: string;
  scheduledAt: string | null;
  userName: string;
  appUrl: string;
}

// ── Inline SVG Icons ──────────────────────────────────────────────────────
const TwitterIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedInIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// ── Main Component ───────────────────────────────────────────────────────
export default function PostPreviewClient({
  postId,
  twitterContent,
  linkedinContent,
  rawIdea,
  isThread,
  status,
  scheduledAt,
  userName,
  appUrl,
}: PostPreviewClientProps) {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<"twitter" | "linkedin">(
    twitterContent ? "twitter" : linkedinContent ? "linkedin" : "twitter"
  );
  const [markingAsPosted, setMarkingAsPosted] = useState(false);
  const [markedAsPosted, setMarkedAsPosted] = useState(false);
  const [postedError, setPostedError] = useState<string | null>(null);
  const [showPostedPrompt, setShowPostedPrompt] = useState(false);

  const hasTwitterContent = !!twitterContent;
  const hasLinkedinContent = !!linkedinContent;
  const displayContent =
    activeTab === "twitter" ? twitterContent : linkedinContent;

  // ── Mark as Posted ─────────────────────────────────────────────────────
  const handleMarkAsPosted = useCallback(async () => {
    setMarkingAsPosted(true);
    setPostedError(null);

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "posted",
          postedAt: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to mark as posted");
      }

      setMarkedAsPosted(true);
      setShowPostedPrompt(false);

      // Show success feedback
      setTimeout(() => {
        if (confirm("Marked as posted! Go to your dashboard to see it?")) {
          router.push("/dashboard/posted");
        }
      }, 500);
    } catch (err: any) {
      setPostedError(err.message || "Something went wrong");
    } finally {
      setMarkingAsPosted(false);
    }
  }, [postId, router]);

  // ── Platform tab visibility ────────────────────────────────────────────
  const showPlatformTabs = hasTwitterContent && hasLinkedinContent;
  const charCount = displayContent.length;

  // ── Content to show (prefer formatted, fallback to raw idea) ───────────
  const twitterText =
    twitterContent || (activeTab === "twitter" ? rawIdea : "");
  const linkedinText =
    linkedinContent || (activeTab === "linkedin" ? rawIdea : "");

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed] font-sans selection:bg-[hsl(210,50%,65%)] selection:text-white">
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-white" />
          <span className="font-semibold tracking-tight text-white">Threadbase</span>
        </Link>
        <div className="flex items-center gap-4">
          {isSignedIn ? (
            <Link
              href="/dashboard"
              className="text-sm font-medium text-white/60 hover:text-white transition-colors"
            >
              Dashboard →
            </Link>
          ) : (
            <Link
              href="/sign-in"
              className="text-sm font-medium text-white/60 hover:text-white transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>

      {/* ── MAIN CONTENT ────────────────────────────────────────────────── */}
      <main className="w-full max-w-[560px] mx-auto px-4 py-12">
        {/* Status badge (if already posted or email sent) */}
        {status === "posted" && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium mb-6 w-fit">
            <CheckIcon />
            Posted
          </div>
        )}
        {status === "email_sent" && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium mb-6 w-fit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <path d="M22 2L11 13" /><path d="M22 2L15 22l-4-9-9-4z" />
            </svg>
            Email sent — check your inbox
          </div>
        )}

        {/* Post Card */}
        <div className="bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-up">
          {/* Platform Tabs */}
          {showPlatformTabs && (
            <div className="flex border-b border-white/10">
              <button
                onClick={() => setActiveTab("twitter")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === "twitter"
                    ? "text-white border-b-2 border-white"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                <TwitterIcon className="w-4 h-4" />
                Twitter
              </button>
              <button
                onClick={() => setActiveTab("linkedin")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === "linkedin"
                    ? "text-white border-b-2 border-white"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                <LinkedInIcon className="w-4 h-4" />
                LinkedIn
              </button>
            </div>
          )}

          {/* Single-platform header */}
          {!showPlatformTabs && hasTwitterContent && (
            <div className="flex items-center gap-2 px-6 pt-5 pb-0 text-sm font-medium text-white/60">
              <TwitterIcon className="w-4 h-4" />
              Twitter
            </div>
          )}
          {!showPlatformTabs && !hasTwitterContent && hasLinkedinContent && (
            <div className="flex items-center gap-2 px-6 pt-5 pb-0 text-sm font-medium text-white/60">
              <LinkedInIcon className="w-4 h-4" />
              LinkedIn
            </div>
          )}

          {/* Post Content */}
          <div className="p-6">
            <div className="text-[15px] leading-relaxed text-white/90 whitespace-pre-wrap font-[system-ui,-apple-system,sans-serif]">
              {(activeTab === "twitter" ? twitterText : linkedinText) || rawIdea}
            </div>

            {/* Character count (Twitter only) */}
            {activeTab === "twitter" && (
              <div className="mt-4 flex items-center justify-between">
                <div
                  className={`text-xs font-medium ${
                    charCount > 280
                      ? "text-red-400"
                      : charCount > 250
                      ? "text-amber-400"
                      : "text-white/40"
                  }`}
                >
                  {charCount} / 280 characters
                </div>
                {isThread && (
                  <div className="text-xs text-white/40 italic">
                    This is a thread — first tweet shown
                  </div>
                )}
              </div>
            )}

            {/* Thread note */}
            {isThread && activeTab === "twitter" && (
              <div className="mt-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                This is a thread — Twitter will open with your first tweet.
                You can add the rest manually.
              </div>
            )}
          </div>

          {/* Schedule / Status Info */}
          <div className="px-6 pb-2">
            {scheduledAt && status !== "posted" && status !== "email_sent" ? (
              <p className="text-xs text-white/40">
                Scheduled for{" "}
                {new Date(scheduledAt).toLocaleString("en-US", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  hour: "numeric",
                  minute: "2-digit",
                  timeZoneName: "short",
                })}
              </p>
            ) : status === "draft" ? (
              <p className="text-xs text-white/40">Ready to post</p>
            ) : null}
          </div>

          {/* ── ACTION BUTTONS ──────────────────────────────────────────── */}
          <div className="p-6 pt-4 space-y-3">
            {/* Post to Twitter */}
            {hasTwitterContent && status !== "posted" && (
              <a
                href={buildTwitterIntentUrl(twitterText || twitterContent)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowPostedPrompt(true)}
                className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl text-sm font-semibold bg-white text-black hover:bg-white/90 transition-all shadow-lg hover:-translate-y-0.5"
              >
                <TwitterIcon className="w-5 h-5" />
                Post to Twitter →
              </a>
            )}

            {/* Post to LinkedIn */}
            {hasLinkedinContent && status !== "posted" && (
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                  `${appUrl}/post/${postId}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowPostedPrompt(true)}
                className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl text-sm font-semibold bg-[#0a66c2] hover:bg-[#0a66c2]/90 text-white transition-all shadow-lg hover:-translate-y-0.5"
              >
                <LinkedInIcon className="w-5 h-5" />
                Post to LinkedIn →
              </a>
            )}

            {/* Already posted label */}
            {status === "posted" && (
              <div className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium bg-white/5 text-white/50 border border-white/10">
                <CheckIcon />
                Posted
              </div>
            )}

            {/* Edit in Threadbase */}
            <Link
              href={`/dashboard/compose?post=${postId}`}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-all border border-white/10"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              Edit in Threadbase →
            </Link>
          </div>
        </div>

        {/* ── MARK AS POSTED ──────────────────────────────────────────────── */}
        {showPostedPrompt && !markedAsPosted && status !== "posted" && (
          <div className="mt-6 p-5 rounded-xl bg-white/5 border border-white/10 animate-fade-up">
            <p className="text-sm text-white/70 mb-3">
              Did it post? Mark it as posted so it appears in your dashboard.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleMarkAsPosted}
                disabled={markingAsPosted}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-green-500 hover:bg-green-600 text-white transition-all disabled:opacity-50"
              >
                {markingAsPosted ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckIcon />
                )}
                {markingAsPosted ? "Marking..." : "Mark as posted"}
              </button>
              <button
                onClick={() => setShowPostedPrompt(false)}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:text-white transition-colors"
              >
                Dismiss
              </button>
            </div>
            {postedError && (
              <p className="mt-2 text-xs text-red-400">{postedError}</p>
            )}
          </div>
        )}

        {/* Already marked as posted feedback */}
        {markedAsPosted && (
          <div className="mt-6 p-5 rounded-xl bg-green-500/10 border border-green-500/20 animate-fade-up">
            <div className="flex items-center gap-2 text-green-400 text-sm font-medium mb-2">
              <CheckIcon />
              Marked as posted!
            </div>
            <p className="text-xs text-white/50">
              This post now appears in your{" "}
              <Link href="/dashboard/posted" className="text-white/70 underline hover:text-white">
                Posted dashboard
              </Link>
              .
            </p>
          </div>
        )}

        {/* ── FOOTER ──────────────────────────────────────────────────────── */}
        <p className="mt-8 text-center text-xs text-white/30">
          Powered by{" "}
          <Link href="/" className="text-white/50 hover:text-white underline underline-offset-2">
            Threadbase
          </Link>
        </p>
      </main>
    </div>
  );
}
