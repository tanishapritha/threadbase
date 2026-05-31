// app/dashboard/DashboardShell.tsx
"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { ToastProvider } from "@/components/ui/Toast";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check for pending post from anonymous generation
    const pendingStr = sessionStorage.getItem("tb_pending_post");
    if (pendingStr) {
      const savePending = async () => {
        try {
          const pending = JSON.parse(pendingStr);
          // Use the unified POST /api/posts endpoint instead of the old save-pending route
          const res = await fetch("/api/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              rawIdea: pending.rawIdea || pending.raw_idea,
              formattedContent: pending.formattedContent || pending.formatted_content,
              postType: pending.postType || pending.post_type,
              tone: pending.tone,
              status: "draft",
            }),
          });

          if (res.ok) {
            sessionStorage.removeItem("tb_pending_post");
            if (pathname !== "/dashboard") {
              router.push("/dashboard?welcome=1");
            } else {
              router.replace("/dashboard?welcome=1");
            }
          }
        } catch (err) {
          console.error("[Pending post save]", err);
          sessionStorage.removeItem("tb_pending_post");
        }
      };
      savePending();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ToastProvider>
    <div className="flex h-screen bg-[#0a0a0a] text-[#ededed] font-sans overflow-hidden">
      {/* ── SIDEBAR ─────────────────────────────────────────────────── */}
      <aside className="w-64 border-r border-[#222] bg-[#111] flex flex-col justify-between hidden md:flex">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-[#222]">
            <Link href="/" className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-white" />
              <span className="font-semibold text-white tracking-tight">ThreadBase</span>
            </Link>
          </div>
          <nav className="p-4 space-y-4">
            <div className="space-y-1">
              <Link
                href="/dashboard"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === "/dashboard"
                    ? "bg-[hsl(210,50%,30%)] text-white shadow-[0_0_10px_rgba(255,255,255,0.05)] border border-[hsl(210,50%,40%)]"
                    : "bg-white/10 text-white hover:bg-white/15 border border-transparent"
                }`}
              >
                <span className="text-[16px]">✨</span> Quick Compose
              </Link>
            </div>

            <div className="space-y-1 pt-2 border-t border-[#222]">
              <Link
                href="/dashboard/drafts"
                className={`flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === "/dashboard/drafts" ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                Drafts
              </Link>
              <Link
                href="/dashboard/scheduled"
                className={`flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === "/dashboard/scheduled" ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Scheduled
              </Link>
              <Link
                href="/dashboard/posted"
                className={`flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === "/dashboard/posted" ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><polyline points="20 6 9 17 4 12"/></svg>
                Posted
              </Link>
            </div>

            <div className="space-y-1 pt-2 border-t border-[#222]">
              <Link
                href="/dashboard/ideas"
                className={`flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === "/dashboard/ideas" ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                Ideas
              </Link>
              <Link
                href="/dashboard/media"
                className={`flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === "/dashboard/media" ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                Media Upload
              </Link>
            </div>

            <div className="space-y-1 pt-2 border-t border-[#222]">
              <Link
                href="/dashboard/preferences"
                className={`flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === "/dashboard/preferences" ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
                Preferences
              </Link>
            </div>
          </nav>
        </div>
        <div className="p-4 border-t border-[#222] flex items-center gap-3">
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: "w-8 h-8",
              },
            }}
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">Account</span>
            <span className="text-xs text-white/50">Manage settings</span>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0a0a0a]">
        {/* Mobile Header */}
        <header className="md:hidden h-14 border-b border-[#222] flex items-center justify-between px-4">
          <Link href="/" className="font-semibold text-white">ThreadBase</Link>
          <UserButton />
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="max-w-4xl mx-auto w-full pb-20">
            {children}
          </div>
        </div>
      </main>
    </div>
    </ToastProvider>
  );
}
