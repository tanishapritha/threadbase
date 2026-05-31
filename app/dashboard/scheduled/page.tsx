"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";

interface Post {
  id: string;
  raw_idea: string;
  formatted_content: { twitter?: string; linkedin?: string } | null;
  post_type: string | null;
  status: string;
  scheduled_at: string;
  created_at: string;
}

export default function ScheduledPage() {
  const { showToast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [reschedulePostId, setReschedulePostId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  const fetchScheduled = useCallback(async () => {
    try {
      // Fetch both 'scheduled' and 'email_sent' statuses
      const [scheduledRes, emailSentRes] = await Promise.all([
        fetch("/api/posts?status=scheduled"),
        fetch("/api/posts?status=email_sent"),
      ]);

      if (!scheduledRes.ok || !emailSentRes.ok) throw new Error("Failed to fetch");

      const scheduledData = await scheduledRes.json();
      const emailSentData = await emailSentRes.json();

      const all = [
        ...(scheduledData.posts || []),
        ...(emailSentData.posts || []),
      ];

      // Sort by scheduled_at descending
      all.sort(
        (a: any, b: any) =>
          new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
      );

      setPosts(all);
    } catch (err) {
      console.error("[Scheduled]", err);
      showToast("Failed to load scheduled posts", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScheduled();
  }, [fetchScheduled]);

  const handleReschedule = async (postId: string) => {
    if (!newDate || !newTime) {
      showToast("Please select a date and time", "error");
      return;
    }
    try {
      const scheduledAt = new Date(`${newDate}T${newTime}`).toISOString();
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt }),
      });
      if (!res.ok) throw new Error("Failed to reschedule");
      showToast("Post rescheduled", "success");
      setReschedulePostId(null);
      fetchScheduled();
    } catch {
      showToast("Failed to reschedule", "error");
    }
  };

  const handleMoveToDraft = async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "draft" }),
      });
      if (!res.ok) throw new Error("Failed to move");
      showToast("Post moved to drafts", "success");
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch {
      showToast("Failed to move to drafts", "error");
    }
  };

  const handleDelete = async (postId: string) => {
    if (!window.confirm("Delete this scheduled post?")) return;
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      showToast("Scheduled post deleted", "info");
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch {
      showToast("Failed to delete", "error");
    }
  };

  const formatScheduledDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });
  };

  const truncate = (str: string, len: number) =>
    str.length > len ? str.slice(0, len) + "..." : str;

  return (
    <div className="text-white font-sans animate-fade-up">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-1">Scheduled</h1>
        <p className="text-sm text-white/50">
          {posts.length} post{posts.length !== 1 ? "s" : ""} in the queue
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-[#111] border border-white/5 rounded-xl animate-shimmer-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 bg-[#111] border border-white/10 rounded-xl">
          <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <span className="text-2xl">📅</span>
          </div>
          <p className="text-sm text-white/50 font-medium">
            No scheduled posts in the queue.
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
                    {post.status === "email_sent" ? (
                      <span
                        className="inline-flex items-center px-2 py-0.5 text-[10px] rounded uppercase font-semibold tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20"
                        title="Notification email was sent. Check your inbox."
                      >
                        Email sent
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 text-[10px] rounded uppercase font-semibold tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20">
                        Scheduled
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
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <div className="text-xs text-[hsl(210,50%,65%)] font-medium">
                  {post.scheduled_at ? formatScheduledDate(post.scheduled_at) : "No date set"}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setReschedulePostId(reschedulePostId === post.id ? null : post.id)
                    }
                    className="px-3 h-7 text-xs rounded-md bg-white/5 text-white/60 hover:bg-white/10 font-medium"
                  >
                    Reschedule
                  </button>
                  <button
                    onClick={() => handleMoveToDraft(post.id)}
                    className="px-3 h-7 text-xs rounded-md bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 font-medium"
                  >
                    Move to draft
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="px-3 h-7 text-xs rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {reschedulePostId === post.id && (
                <div className="mt-3 pt-3 border-t border-white/5 animate-fade-up">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                    />
                    <input
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                    />
                    <button
                      onClick={() => handleReschedule(post.id)}
                      className="px-4 h-8 text-xs rounded-lg bg-[hsl(210,50%,55%)] text-white font-medium hover:bg-[hsl(210,50%,60%)]"
                    >
                      Confirm
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
