"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { buildTwitterIntentUrl } from "@/lib/twitterIntent";

export default function ComposePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'twitter' | 'linkedin'>('twitter');
  const [rawIdea, setRawIdea] = useState('');
  const [tone, setTone] = useState('Friendly');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [formattedContent, setFormattedContent] = useState<any>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);

  // Load idea if passed via query param
  useEffect(() => {
    const idea = searchParams?.get('idea');
    if (idea) {
      fetch(`/api/ideas`).then(r => r.json()).then(data => {
        const items = data.ideas || [];
        const found = items.find((i: any) => i.id === idea);
        if (found) {
          setRawIdea(found.raw_text);
        }
      });
    }
  }, [searchParams]);

  // Typewriter effect
  function Typewriter({ text }: { text: string }) {
    const [display, setDisplay] = useState('');
    useEffect(() => {
      let i = 0;
      const interval = setInterval(() => {
        setDisplay(text.slice(0, i + 1));
        i++;
        if (i >= text.length) clearInterval(interval);
      }, 30);
      return () => clearInterval(interval);
    }, [text]);
    return <p>{display}</p>;
  }

  const handleGenerate = async () => {
    if (!rawIdea.trim()) return;
    setIsGenerating(true);

    try {
      const res = await fetch("/api/ai/format", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawIdea, tone }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      setFormattedContent(data);
      showToast("Content generated successfully", "success");
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : "Error generating post. Try again.";
      showToast(message, "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!rawIdea.trim()) return;
    setIsSaving(true);

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawIdea: rawIdea.trim(),
          formattedContent,
          postType: null,
          tone,
          status: "draft",
          source: "compose",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      showToast("Saved to drafts", "success");
    } catch (error: any) {
      showToast(error.message || "Failed to save draft", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSchedule = async () => {
    if (!scheduleDate || !scheduleTime) {
      showToast("Please select a date and time", "error");
      return;
    }

    setIsScheduling(true);

    try {
      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();

      const res = await fetch("/api/posts/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawIdea: rawIdea.trim(),
          formattedContent,
          postType: null,
          tone,
          scheduledAt,
          sendEmail,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to schedule");
      }

      showToast("Post scheduled successfully", "success");
      setShowSchedulePicker(false);
      setRawIdea("");
      setFormattedContent(null);
    } catch (error: any) {
      showToast(error.message || "Failed to schedule post", "error");
    } finally {
      setIsScheduling(false);
    }
  };

  const postTypes = ["Friendly", "Professional", "Witty", "Inspirational", "Authoritative", "Empathetic", "Humorous", "Concise"];

  return (
    <div className="text-white font-sans animate-fade-up">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Compose</h1>
          <p className="text-white/50 text-sm">Turn your raw thoughts into platform-perfect posts.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Editor Column */}
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
              <label className="block text-sm font-medium text-white/70 mb-2">Your Idea</label>
              <textarea
                value={rawIdea}
                onChange={(e) => setRawIdea(e.target.value)}
                placeholder="What's on your mind? Don't worry about formatting, AI will handle that."
                className="w-full h-48 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[hsl(210,50%,65%)] focus:ring-1 focus:ring-[hsl(210,50%,65%)] transition-all resize-none"
              />

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/50">Tone:</span>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="bg-transparent text-sm font-medium text-[hsl(210,50%,65%)] outline-none cursor-pointer"
                  >
                    {postTypes.map((t) => (
                      <option key={t} value={t} className="bg-gray-800 text-white">
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !rawIdea.trim()}
                  className="px-6 py-2.5 rounded-full text-sm font-semibold bg-[hsl(210,50%,55%)] hover:bg-[hsl(210,50%,60%)] disabled:opacity-50 transition-all shadow-lg shadow-[hsl(210,50%,30%)/30] flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <span className="text-xl leading-none">✨</span>
                      Format with AI
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Actions */}
            {rawIdea.trim() && (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-full text-sm font-semibold bg-white/10 text-white hover:bg-white/20 transition-all border border-white/10 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                  )}
                  Save as draft
                </button>
                <button
                  onClick={() => setShowSchedulePicker(!showSchedulePicker)}
                  disabled={!rawIdea.trim()}
                  className="px-5 py-2.5 rounded-full text-sm font-semibold bg-white/10 text-white hover:bg-white/20 transition-all border border-white/10 disabled:opacity-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Schedule
                </button>
              </div>
            )}

            {/* Schedule picker inline */}
            {showSchedulePicker && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 animate-fade-up">
                <h3 className="text-sm font-medium text-white/70 mb-3">Schedule post</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[hsl(210,50%,65%)]"
                  />
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[hsl(210,50%,65%)]"
                  />
                  <button
                    onClick={handleSchedule}
                    disabled={isScheduling}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[hsl(210,50%,55%)] hover:bg-[hsl(210,50%,60%)] transition-all disabled:opacity-50"
                  >
                    {isScheduling ? "Scheduling..." : "Confirm"}
                  </button>
                </div>

                {/* Email reminder toggle */}
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-white/70">Email me a reminder</label>
                    <p className="text-xs text-white/40 mt-0.5">We'll send a link so you can publish with one click.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSendEmail(!sendEmail)}
                    className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${
                      sendEmail ? "bg-[hsl(210,50%,55%)]" : "bg-white/10"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                        sendEmail ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Preview Column */}
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl min-h-[400px] flex flex-col">
              <h2 className="text-sm font-medium text-white/70 mb-4">Generated Previews</h2>

              {!formattedContent ? (
                <div className="flex-1 flex flex-col items-center justify-center text-white/20">
                  <span className="text-4xl mb-3">📝</span>
                  <p className="text-sm">Write an idea and hit generate to see previews here.</p>
                </div>
              ) : (
                <div className="flex flex-col flex-1">
                  <div className="flex gap-4 border-b border-white/10 mb-4">
                    {formattedContent.twitter && (
                      <button onClick={() => setActiveTab("twitter")} className={`pb-2 text-sm font-medium transition-colors ${activeTab === "twitter" ? "text-white border-b-2 border-[hsl(210,50%,65%)]" : "text-white/40"}`}>Twitter</button>
                    )}
                    {formattedContent.linkedin && (
                      <button
                        onClick={() => setActiveTab("linkedin")}
                        className={`pb-2 text-sm font-medium transition-colors ${activeTab === "linkedin" ? "text-white border-b-2 border-[#0a66c2]" : "text-white/40"}`}
                      >
                        LinkedIn
                      </button>
                    )}
                    {/* Post now! button */}
                    {formattedContent?.twitter && (
                      <button
                        onClick={() => {
                          const url = buildTwitterIntentUrl(formattedContent.twitter);
                          window.open(url, "_blank", "noopener,noreferrer");
                        }}
                        className="ml-auto pb-2 text-sm font-semibold text-[hsl(210,50%,65%)] hover:text-white transition-colors"
                      >
                        Post now!
                      </button>
                    )}
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl text-sm leading-relaxed text-white/90">
                    <Typewriter text={formattedContent[activeTab] || ""} />
                  </div>

                </div>
              )}
            </div>

            {formattedContent && (
              <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2 gap-3">
                <button
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                  className="px-6 py-3 rounded-full text-sm font-semibold bg-white/10 text-white hover:bg-white/20 transition-all border border-white/10 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save as Draft"}
                </button>
                <button
                  onClick={() => setShowSchedulePicker(true)}
                  className="px-6 py-3 rounded-full text-sm font-semibold bg-white text-[#0d1117] hover:bg-white/90 transition-all shadow-xl hover:-translate-y-0.5"
                >
                  Schedule Post
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
