"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";

const IDEA_TYPES = ["All", "Thread", "Tip", "Opinion", "Story", "Question"] as const;

interface Idea {
  id: string;
  raw_text: string;
  idea_type: string | null;
  created_at: string;
}

export default function IdeasPage() {
  const { showToast } = useToast();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [rawText, setRawText] = useState("");
  const [ideaType, setIdeaType] = useState<string>("Tip");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchIdeas = useCallback(async () => {
    try {
      const res = await fetch("/api/ideas");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setIdeas(data.ideas || []);
    } catch (err) {
      console.error("[Ideas]", err);
      showToast("Failed to load ideas", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  const handleSave = async () => {
    if (!rawText.trim()) return;
    setIsSaving(true);

    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: rawText.trim(), ideaType }),
      });

      if (!res.ok) throw new Error("Failed to save");
      showToast("Idea saved", "success");
      setRawText("");
      setIdeaType("Tip");
      fetchIdeas();
    } catch {
      showToast("Failed to save idea", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/ideas/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      showToast("Idea deleted", "info");
      setIdeas((prev) => prev.filter((i) => i.id !== id));
    } catch {
      showToast("Failed to delete idea", "error");
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

  const filteredIdeas =
    activeFilter === "All"
      ? ideas
      : ideas.filter((i) => i.idea_type === activeFilter);

  const typeColors: Record<string, string> = {
    Thread: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    Tip: "bg-green-500/10 text-green-400 border-green-500/20",
    Opinion: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    Story: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    Question: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  };

  return (
    <div className="text-white font-sans animate-fade-up">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-1">Ideas</h1>
        <p className="text-sm text-white/50">Capture and organize your content ideas.</p>
      </div>

      {/* Quick-add form */}
      <div className="bg-[#111] border border-white/10 rounded-xl p-5 mb-8">
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Got an idea? Write it down..."
          className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[hsl(210,50%,65%)] resize-none min-h-[80px]"
        />
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
          <div className="flex flex-wrap gap-2">
            {IDEA_TYPES.filter((t) => t !== "All").map((t) => (
              <button
                key={t}
                onClick={() => setIdeaType(t)}
                className={`text-xs px-3 py-1 rounded-full border font-medium ${
                  ideaType === t
                    ? typeColors[t] || "bg-white/10 text-white border-white/20"
                    : "text-white/40 border-white/10 hover:bg-white/5"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving || !rawText.trim()}
            className="px-5 h-9 text-sm rounded-lg bg-white text-black hover:bg-white/90 font-medium disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save idea"}
          </button>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {IDEA_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setActiveFilter(t)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
              activeFilter === t
                ? "bg-white/20 text-white border-white/30"
                : "text-white/40 border-white/10 hover:bg-white/5"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Ideas list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-[#111] border border-white/5 rounded-xl animate-shimmer-pulse" />
          ))}
        </div>
      ) : filteredIdeas.length === 0 ? (
        <div className="text-center py-16 bg-[#111] border border-white/10 rounded-xl">
          <p className="text-sm text-white/50 font-medium">
            {activeFilter === "All"
              ? "No ideas yet. Save your first idea above."
              : `No ${activeFilter.toLowerCase()} ideas yet.`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredIdeas.map((idea) => (
            <div
              key={idea.id}
              className="bg-[#111] border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {idea.idea_type && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded uppercase font-semibold tracking-wider border ${
                          typeColors[idea.idea_type] || "text-white/40 bg-white/5 border-white/10"
                        }`}
                      >
                        {idea.idea_type}
                      </span>
                    )}
                    <span className="text-xs text-white/30">{relativeTime(idea.created_at)}</span>
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                    {idea.raw_text}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/dashboard/compose?idea=${idea.id}`}
                    className="px-3 h-7 text-xs rounded-md bg-white/5 text-white/60 hover:bg-white/10 font-medium inline-flex items-center"
                  >
                    Compose →
                  </Link>
                  <button
                    onClick={() => {
                      if (window.confirm("Delete this idea?")) handleDelete(idea.id);
                    }}
                    disabled={deletingId === idea.id}
                    className="px-3 h-7 text-xs rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 font-medium disabled:opacity-50"
                  >
                    {deletingId === idea.id ? "..." : "Delete"}
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
