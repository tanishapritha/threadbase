"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useClerk } from "@clerk/nextjs";

// ── Types ────────────────────────────────────────────────────────────────────

type PostType = "Tip" | "Thread" | "Story" | "Opinion" | "Question";
type Platform = "twitter" | "linkedin";
type PreviewTab = "twitter" | "linkedin";

interface PreviewContent {
  twitter: string;
  linkedin: string;
  twitterCharCount: number;
}

interface StreamEvent {
  type: "delta" | "done" | "error";
  content?: string;
  message?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const POST_TYPES: PostType[] = ["Tip", "Thread", "Story", "Opinion", "Question"];

const FORMAT_TOOLTIP_TEXT =
  "Tip is punchy and short. Thread splits into tweets. Story is first-person. Opinion is bold. Question sparks replies.";

// ── Component ─────────────────────────────────────────────────────────────────

export default function QuickCompose() {
  const { openSignUp } = useClerk();

  // Compose state
  const [rawIdea, setRawIdea] = useState("");
  const [postType, setPostType] = useState<PostType>("Tip");
  const [platforms, setPlatforms] = useState<Platform[]>(["twitter", "linkedin"]);

  // UX state
  const [hasTyped, setHasTyped] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [accumulated, setAccumulated] = useState("");
  const [preview, setPreview] = useState<PreviewContent | null>(null);
  const [activeTab, setActiveTab] = useState<PreviewTab>("twitter");
  const [showFmtTooltip, setShowFmtTooltip] = useState(false);
  const [generationCount, setGenerationCount] = useState(0);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const editRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<AbortController | null>(null);

  // ── Auto-resize textarea ─────────────────────────────────────────────────
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 240) + "px";
  }, []);

  // ── Handle input ─────────────────────────────────────────────────────────
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRawIdea(e.target.value);
    if (!hasTyped && e.target.value.length > 0) {
      setHasTyped(true);
    }
    autoResize();
  };

  // ── Toggle platform ──────────────────────────────────────────────────────
  const togglePlatform = (p: Platform) => {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  // ── Abort generation ────────────────────────────────────────────────────
  const abortGeneration = () => {
    controllerRef.current?.abort();
    setIsGenerating(false);
    setAccumulated("");
  };

  // ── Generate post ────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!rawIdea.trim() || isGenerating) return;
    if (generationCount >= 1) {
      setShowSignInPrompt(true);
      return;
    }

    setIsGenerating(true);
    setPreview(null);
    setAccumulated("");
    setIsEditing(false);
    setSaveSuccess(false);
    setIsRateLimited(false);
    setActiveTab(platforms[0] || "twitter");

    const controller = new AbortController();
    controllerRef.current = controller;

    let fullContent = "";

    try {
      const res = await fetch("/api/ai/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawIdea: rawIdea.trim(),
          postType,
          platforms,
        }),
        signal: controller.signal,
      });

      if (res.status === 429) {
        setIsRateLimited(true);
        setIsGenerating(false);
        return;
      }

      if (!res.ok) {
        throw new Error(`Generation failed (${res.status})`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event: StreamEvent = JSON.parse(line);
            if (event.type === "delta" && event.content) {
              fullContent += event.content;
              setAccumulated(fullContent);
            } else if (event.type === "done") {
              // Parse the accumulated JSON
              try {
                const parsed: PreviewContent = JSON.parse(fullContent);
                setPreview(parsed);
                setGenerationCount((c) => c + 1);

                // Show sign-in prompt after first generation
                if (generationCount === 0) {
                  setShowSignInPrompt(true);
                }
              } catch {
                // JSON parse failed — try to extract from raw text
                // Fallback: treat accumulated as-is
                setPreview({
                  twitter: fullContent.includes("twitter") ? fullContent : "",
                  linkedin: fullContent.includes("linkedin") ? fullContent : "",
                  twitterCharCount: 0,
                });
                setGenerationCount((c) => c + 1);
              }
            } else if (event.type === "error") {
              console.error("[Stream error]", event.message);
            }
          } catch {
            // Skip unparseable lines
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("[Generate]", err);
      }
    } finally {
      setIsGenerating(false);
      controllerRef.current = null;
    }
  };

  // ── Regenerate ──────────────────────────────────────────────────────────
  const handleRegenerate = () => {
    setShowSignInPrompt(false);
    handleGenerate();
  };

  // ── Edit toggle ──────────────────────────────────────────────────────────
  const handleEdit = () => {
    setIsEditing(!isEditing);
    // Focus the editable content after render
    setTimeout(() => {
      if (editRef.current) {
        editRef.current.focus();
      }
    }, 50);
  };

  // ── Save to workspace ───────────────────────────────────────────────────
  const handleSave = () => {
    if (!preview) return;

    const pending = JSON.stringify({
      rawIdea: rawIdea.trim(),
      postType,
      twitterContent: preview.twitter,
      linkedinContent: preview.linkedin,
      twitterCharCount: preview.twitterCharCount,
      platforms,
    });

    sessionStorage.setItem("tb_pending_post", pending);
    openSignUp({ forceRedirectUrl: "/dashboard?welcome=1" });
  };

  // ── Char count colour ─────────────────────────────────────────────────────
  const charCountColor = (count: number) => {
    if (count >= 280) return "text-red-500";
    if (count >= 240) return "text-amber-500";
    return "text-gray-400";
  };

  // ── Format tooltip ───────────────────────────────────────────────────────
  const showFormatTooltip = () => {
    const seen = localStorage.getItem("tb_fmt_tooltip_seen");
    if (!seen) {
      setShowFmtTooltip(true);
      localStorage.setItem("tb_fmt_tooltip_seen", "1");
      setTimeout(() => setShowFmtTooltip(false), 5000);
    }
  };

  const dismissTooltip = () => {
    setShowFmtTooltip(false);
  };

  // ── Carriage return handler ──────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.metaKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  // ── Scroll into view when preview appears ────────────────────────────────
  useEffect(() => {
    if (preview && previewRef.current) {
      previewRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [preview]);

  // ── Autofocus on mount ───────────────────────────────────────────────────
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // ── Twitter char count ───────────────────────────────────────────────────
  const currentTabContent = activeTab === "twitter" ? preview?.twitter : preview?.linkedin;
  const twitterCount = preview?.twitterCharCount ?? 0;

  return (
    <>
      {/* ── COMPOSE CARD ──────────────────────────────────────────────── */}
      <div className="w-full max-w-[560px] bg-white border border-gray-200/80 rounded-xl animate-fade-up sm:mx-auto">
        {/* Hint text */}
        <div className="px-4 pt-3 pb-0">
          <p
            className={`text-[11px] text-gray-400 transition-opacity duration-200 ${
              hasTyped || preview ? "opacity-0" : "opacity-100"
            }`}
          >
            No account needed &mdash; try it now.
          </p>
        </div>

        {/* Textarea */}
        <div className="p-4">
          <textarea
            ref={textareaRef}
            value={isGenerating ? rawIdea : rawIdea}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="What&rsquo;s on your mind? A thought, a link, bullet points&hellip;"
            rows={3}
            className="w-full resize-none bg-transparent text-[14px] leading-[1.7] text-[#111] placeholder:text-gray-300 outline-none min-h-[88px] max-h-[240px] font-sans font-[400]"
            disabled={isGenerating}
          />
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100" />

        {/* Format row */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[11px] uppercase tracking-[0.08em] text-gray-400 font-[500]">
              Format
            </span>
            {POST_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setPostType(t);
                  dismissTooltip();
                }}
                onMouseEnter={(e) => {
                  // Show tooltip on first hover
                  const seen = localStorage.getItem("tb_fmt_tooltip_seen");
                  if (!seen) showFormatTooltip();
                }}
                className={`text-[12px] min-h-[44px] sm:h-[26px] px-3 rounded-[4px] border transition-colors font-[400] ${
                  postType === t
                    ? "bg-[#111] text-white border-[#111]"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Format tooltip (inline text) */}
          {showFmtTooltip && (
            <p className="mt-2 text-[11px] text-gray-400 leading-relaxed animate-fade-up">
              {FORMAT_TOOLTIP_TEXT}
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100" />

        {/* Platform toggles + Generate */}
        <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Platform toggles */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => togglePlatform("twitter")}
              className={`min-h-[44px] sm:h-[28px] px-3 text-[12px] rounded-[4px] border transition-colors font-[500] ${
                platforms.includes("twitter")
                  ? "bg-blue-50 border-blue-200 text-[#1d9bf0]"
                  : "bg-white border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300"
              }`}
            >
              Twitter
            </button>
            <button
              onClick={() => togglePlatform("linkedin")}
              className={`min-h-[44px] sm:h-[28px] px-3 text-[12px] rounded-[4px] border transition-colors font-[500] ${
                platforms.includes("linkedin")
                  ? "bg-slate-50 border-slate-200 text-[#0a66c2]"
                  : "bg-white border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300"
              }`}
            >
              LinkedIn
            </button>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !rawIdea.trim() || isRateLimited}
            className={`w-full sm:w-auto min-h-[44px] sm:h-[36px] px-4 sm:px-5 text-[13px] rounded-[6px] font-[500] transition-all flex items-center justify-center gap-2 ${
              isGenerating
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : generationCount >= 1
                ? "bg-gray-100 text-gray-600 cursor-pointer hover:bg-gray-200"
                : isRateLimited
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-[#111] text-white hover:bg-[#222] active:bg-[#111]"
            }`}
          >
            {isGenerating ? (
              <span className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin" />
            ) : isRateLimited ? (
              "Sign up to generate"
            ) : generationCount >= 1 ? (
              "Sign up to continue"
            ) : (
              "Generate post \u2192"
            )}
          </button>
        </div>
      </div>

      {/* ── RATE LIMITED MESSAGE ──────────────────────────────────────── */}
      {isRateLimited && (
        <div className="w-full max-w-[560px] mx-auto mt-4 text-center">
          <p className="text-[12px] text-gray-400">
            You&rsquo;ve tried 3 posts &mdash;{" "}
            <button
              onClick={handleSave}
              className="text-gray-600 underline hover:text-gray-900 transition-colors"
            >
              sign up free to generate more.
            </button>
          </p>
        </div>
      )}

      {/* ── PREVIEW SECTION ───────────────────────────────────────────── */}
      {(isGenerating || preview) && (
        <div ref={previewRef} className="w-full max-w-[560px] mx-auto mt-6 animate-fade-up">
          {/* LOADING SHIMMER */}
          {isGenerating && (
            <div className="bg-white border border-gray-200/80 rounded-xl p-4 space-y-3">
              <div className="flex gap-6 mb-4">
                <div className="w-16 h-5 bg-gray-100 rounded animate-shimmer-pulse" />
                <div className="w-20 h-5 bg-gray-100 rounded animate-shimmer-pulse" />
              </div>
              <div className="h-4 bg-gray-100 rounded animate-shimmer-pulse w-full" />
              <div className="h-4 bg-gray-100 rounded animate-shimmer-pulse w-3/4" />
              <div className="h-4 bg-gray-100 rounded animate-shimmer-pulse w-5/6" />
            </div>
          )}

          {/* PREVIEW CARD */}
          {preview && !isGenerating && (
            <div className="bg-white border border-gray-200/80 rounded-xl">
              {/* Tabs */}
              <div className="flex border-b border-gray-100">
                <button
                  onClick={() => setActiveTab("twitter")}
                  className={`px-4 py-2.5 text-[13px] font-[500] border-b-2 transition-colors ${
                    activeTab === "twitter"
                      ? "border-[#111] text-gray-900"
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}
                >
                  Twitter
                </button>
                <button
                  onClick={() => setActiveTab("linkedin")}
                  className={`px-4 py-2.5 text-[13px] font-[500] border-b-2 transition-colors ${
                    activeTab === "linkedin"
                      ? "border-[#111] text-gray-900"
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}
                >
                  LinkedIn
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                {isEditing ? (
                  <div
                    ref={editRef}
                    contentEditable
                    suppressContentEditableWarning
                    className="text-[14px] leading-[1.75] text-gray-900 outline-none ring-1 ring-gray-200 rounded-md p-3 -mx-1 focus:ring-gray-400 transition-shadow"
                    onBlur={(e) => {
                      const text = e.currentTarget.textContent || "";
                      if (activeTab === "twitter") {
                        setPreview({ ...preview, twitter: text, twitterCharCount: text.length });
                      } else {
                        setPreview({ ...preview, linkedin: text });
                      }
                    }}
                  >
                    {currentTabContent}
                  </div>
                ) : (
                  <p className="text-[14px] leading-[1.75] text-gray-900 whitespace-pre-wrap">
                    {currentTabContent}
                  </p>
                )}

                {/* Twitter char count */}
                {activeTab === "twitter" && (
                  <p className={`mt-2 text-right text-[12px] ${charCountColor(twitterCount)}`}>
                    {twitterCount}
                    <span className="text-gray-300">/280</span>
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleRegenerate}
                    className="text-[12px] text-gray-400 hover:text-gray-700 transition-colors font-[500]"
                  >
                    Regenerate
                  </button>
                  <button
                    onClick={handleEdit}
                    className="text-[12px] text-gray-400 hover:text-gray-700 transition-colors font-[500]"
                  >
                    {isEditing ? "Done" : "Edit"}
                  </button>
                </div>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="min-h-[44px] sm:h-[30px] px-4 text-[12px] rounded-[6px] bg-[#111] text-white hover:bg-[#222] transition-colors font-[500] disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSaving ? (
                    <>
                      <span className="w-3 h-3 rounded-full border border-white border-t-transparent animate-spin" />
                      Saving&hellip;
                    </>
                  ) : saveSuccess ? (
                    "\u2713 Saved"
                  ) : (
                    "Save to workspace \u2192"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── POST-GENERATION NUDGE (Bubble C) ────────────────────────── */}
          {preview && !isGenerating && (() => {
            const seen = localStorage.getItem("tb_gen_seen");
            if (!seen) {
              setTimeout(() => localStorage.setItem("tb_gen_seen", "1"), 100);
              return (
                <p className="mt-3 text-[12px] text-gray-400 leading-relaxed animate-fade-up">
                  Like it? Save it to your workspace and schedule it.{" "}
                  <button
                    onClick={handleSave}
                    className="text-gray-600 hover:text-gray-900 underline transition-colors"
                  >
                    \u2192
                  </button>
                </p>
              );
            }
            return null;
          })()}
        </div>
      )}

      {/* ── SIGN-IN PROMPT OVERLAY ────────────────────────────────────── */}
      {showSignInPrompt && !isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => setShowSignInPrompt(false)}
          />

          {/* Modal */}
          <div className="relative bg-white border border-gray-200 rounded-xl p-6 w-full max-w-sm shadow-xl animate-fade-up">
            <h3 className="text-[15px] font-[500] text-gray-900 mb-4">
              Sign in to continue
            </h3>

            <ul className="space-y-2 mb-5">
              {[
                "Compose more posts",
                "Save and schedule content",
                "Access your workspace across devices",
                "Edit and manage past drafts",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-[13px] text-gray-500">
                  <svg
                    className="w-3.5 h-3.5 text-gray-300 mt-0.5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleSave}
                className="w-full h-[38px] rounded-[6px] bg-[#111] text-white text-[13px] font-[500] hover:bg-[#222] transition-colors"
              >
                Sign in free \u2192
              </button>
              <button
                onClick={() => setShowSignInPrompt(false)}
                className="w-full h-[38px] rounded-[6px] text-gray-400 text-[13px] font-[400] hover:text-gray-600 transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
