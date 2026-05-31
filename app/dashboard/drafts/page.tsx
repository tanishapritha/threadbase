"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";

interface Post {
  id: string;
  raw_idea: string;
  formatted_content: { twitter?: string; linkedin?: string } | null;
  post_type: string | null;
  tone: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function DraftsPage() {
  const { showToast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [schedulingPostId, setSchedulingPostId] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [sendEmailReminder, setSendEmailReminder] = useState(true);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDrafts = useCallback(async () => {
    try {
      const res = await fetch("/api/posts?status=draft");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (err) {
      console.error("[Drafts]", err);
      showToast("Failed to load drafts", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const handleSchedule = async (postId: string) => {
    if (!scheduleDate || !scheduleTime) {
      showToast("Please select a date and time", "error");
      return;
    }

    try {
      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
      const res = await fetch("/api/posts/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          scheduledAt,
          sendEmail: sendEmailReminder,
        }),
      });

      if (!res.ok) throw new Error("Failed to schedule");
      showToast("Post scheduled successfully", "success");
      setSchedulingPostId(null);
      fetchDrafts();
    } catch {
      showToast("Failed to schedule post", "error");
    }
  };

  const handleSaveEdit = async (postId: string) => {
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawIdea: editContent }),
      });

      if (!res.ok) throw new Error("Failed to update");
      showToast("Draft updated", "success");
      setEditingPostId(null);
      fetchDrafts();
    } catch {
      showToast("Failed to update draft", "error");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (postId: string) => {
    setDeletingId(postId);
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      showToast("Draft deleted", "info");
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch {
      showToast("Failed to delete draft", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const relativeTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const truncate = (str: string, len: number) =>
    str.length > len ? str.slice(0, len) + "..." : str;

  return (
    <div className="text-white font-sans animate-fade-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Drafts</h1>
          <p className="text-sm text-white/50">
            {posts.length} draft{posts.length !== 1 ? "s" : ""} in your workspace
          </p>
        </div>
        <Link
          href="/dashboard/compose"
          className="px-4 h-9 inline-flex items-center justify-center text-sm rounded-lg bg-white text-black hover:bg-white/90 font-medium gap-2"
        >
          <span>✨</span> New post
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-[#111] border border-white/5 rounded-xl animate-shimmer-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 bg-[#111] border border-white/10 rounded-xl">
          <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <span className="text-2xl">✍️</span>
          </div>
          <p className="text-sm text-white/50 font-medium mb-4">
            No drafts yet. Compose a post to get started.
          </p>
          <Link
            href="/dashboard/compose"
            className="inline-flex h-9 px-5 items-center justify-center text-sm rounded-md bg-white/10 text-white hover:bg-white/20 font-medium border border-white/10"
          >
            Start writing
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-[#111] border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all shadow-sm"
            >
              {/* Content */}
              {editingPostId === post.id ? (
                <div className="mb-4">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[hsl(210,50%,65%)] resize-none min-h-[100px]"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleSaveEdit(post.id)}
                      disabled={savingEdit}
                      className="px-4 h-8 text-xs rounded-md bg-white/10 text-white hover:bg-white/20 font-medium disabled:opacity-50"
                    >
                      {savingEdit ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => setEditingPostId(null)}
                      className="px-4 h-8 text-xs rounded-md bg-white/5 text-white/60 hover:bg-white/10 font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {post.post_type && (
                      <span className="text-[11px] text-white/40 font-medium uppercase tracking-[0.06em] bg-white/5 px-2 py-0.5 rounded">
                        {post.post_type}
                      </span>
                    )}
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
                      200
                    )}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <span className="text-xs text-white/30 font-medium">
                  {relativeTime(post.created_at)}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingPostId(post.id);
                      setEditContent(post.raw_idea);
                    }}
                    className="px-3 h-7 text-xs rounded-md bg-white/5 text-white/60 hover:bg-white/10 font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setSchedulingPostId(schedulingPostId === post.id ? null : post.id);
                      setScheduleDate("");
                      setScheduleTime("");
                    }}
                    className="px-3 h-7 text-xs rounded-md bg-[hsl(210,50%,30%)]/30 text-[hsl(210,50%,70%)] hover:bg-[hsl(210,50%,30%)]/50 font-medium"
                  >
                    Schedule →
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm("Delete this draft?")) handleDelete(post.id);
                    }}
                    disabled={deletingId === post.id}
                    className="px-3 h-7 text-xs rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 font-medium disabled:opacity-50"
                  >
                    {deletingId === post.id ? "..." : "Delete"}
                  </button>
                </div>
              </div>

              {/* Inline schedule picker */}
              {schedulingPostId === post.id && (
                <div className="mt-3 pt-3 border-t border-white/5 animate-fade-up">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                    />
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                    />
                    <button
                      onClick={() => handleSchedule(post.id)}
                      className="px-4 h-8 text-xs rounded-lg bg-[hsl(210,50%,55%)] text-white font-medium hover:bg-[hsl(210,50%,60%)]"
                    >
                      Confirm
                    </button>
                  </div>

                  {/* Email reminder toggle */}
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <label className="text-xs font-medium text-white/60">Email me a reminder</label>
                      <p className="text-[10px] text-white/30 mt-0.5">We'll send a link so you can publish with one click.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSendEmailReminder(!sendEmailReminder)}
                      className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${
                        sendEmailReminder ? "bg-[hsl(210,50%,55%)]" : "bg-white/10"
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-transform ${
                          sendEmailReminder ? "translate-x-5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
