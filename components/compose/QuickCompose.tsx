"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { buildTwitterIntentUrl } from "@/lib/twitterIntent";

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

// ── Helpers for parsing partial JSON during stream ─────────────────────────────

function extractPartialString(str: string, key: string): string {
  const keyIndex = str.indexOf(`"${key}"`);
  if (keyIndex === -1) return "";
  
  const colonIndex = str.indexOf(":", keyIndex + key.length + 2);
  if (colonIndex === -1) return "";
  
  const startQuoteIndex = str.indexOf('"', colonIndex + 1);
  if (startQuoteIndex === -1) return "";
  
  let result = "";
  let escaped = false;
  for (let i = startQuoteIndex + 1; i < str.length; i++) {
    const char = str[i];
    if (escaped) {
      if (char === "n") {
        result += "\n";
      } else if (char === "t") {
        result += "\t";
      } else {
        result += char;
      }
      escaped = false;
    } else if (char === "\\") {
      escaped = true;
    } else if (char === '"') {
      break;
    } else {
      result += char;
    }
  }
  return result;
}

function extractPartialNumber(str: string, key: string): number {
  const keyIndex = str.indexOf(`"${key}"`);
  if (keyIndex === -1) return 0;
  
  const colonIndex = str.indexOf(":", keyIndex + key.length + 2);
  if (colonIndex === -1) return 0;
  
  let numStr = "";
  for (let i = colonIndex + 1; i < str.length; i++) {
    const char = str[i];
    if (/\d/.test(char)) {
      numStr += char;
    } else if (numStr.length > 0) {
      break;
    }
  }
  return numStr ? parseInt(numStr, 10) : 0;
}

// ── Component ─────────────────────────────────────────────────────────────────


export default function QuickCompose() {
  const { openSignUp } = useClerk();
  const { isSignedIn } = useUser();

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
    setErrorMessage(null);
    setPreview({ twitter: "", linkedin: "", twitterCharCount: 0 });
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
        const errText = await res.text();
        setErrorMessage(`Generation failed (${res.status}): ${errText}`);
        // Fallback: clear preview to avoid stale UI
        setPreview({ twitter: "", linkedin: "", twitterCharCount: 0 });
        setIsGenerating(false);
        return;
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
              
              const twitterVal = extractPartialString(fullContent, "twitter");
              const linkedinVal = extractPartialString(fullContent, "linkedin");
              const twCharCount = extractPartialNumber(fullContent, "twitterCharCount") || twitterVal.length;

              setPreview({
                twitter: twitterVal,
                linkedin: linkedinVal,
                twitterCharCount: twCharCount,
              });
            } else if (event.type === "done") {
              // Parse final full accumulated JSON
              try {
                const parsed: PreviewContent = JSON.parse(fullContent);
                setPreview(parsed);
              } catch {
                // Keep extracted preview
              }
              setGenerationCount((c) => c + 1);

              // Show sign-in prompt after first generation
              if (generationCount === 0) {
                setShowSignInPrompt(true);
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
  const handleSave = async () => {
    if (!preview) return;

    if (isSignedIn) {
      setIsSaving(true);
      try {
        const res = await fetch("/api/posts/save-pending", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rawIdea: rawIdea.trim(),
            postType,
            twitterContent: preview.twitter,
            linkedinContent: preview.linkedin,
            platforms,
          }),
        });

        if (res.ok) {
          setSaveSuccess(true);
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 1000);
        } else {
          const errText = await res.text();
          setErrorMessage(`Save failed: ${errText}`);
        }
      } catch (err: any) {
        setErrorMessage(`Save failed: ${err.message || err}`);
      } finally {
        setIsSaving(false);
      }
    } else {
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
    }
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
      <div className="w-full bg-white border border-[#E5E7EB] rounded-xl animate-fade-up">
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
            className="w-full resize-none bg-white text-[14px] leading-[1.7] text-[#111] placeholder:text-gray-300 outline-none min-h-[88px] max-h-[240px] font-sans font-[400] inset-shadow-input rounded-md px-3 py-2.5 border border-[#E5E7EB]/60 focus:border-[#d1d5db] transition-colors"
            disabled={isGenerating}
          />
        </div>
        {errorMessage && (
          <div className="px-4 text-sm text-red-600">
            {errorMessage}
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-[#E5E7EB]" />

        {/* Format row */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[11px] uppercase tracking-[0.08em] text-gray-400 font-[500] shrink-0">
              Format
            </span>
            <div className="flex flex-wrap gap-2">
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
                  className={`text-[12px] min-h-[44px] sm:h-[28px] px-3 rounded-[4px] border transition-all duration-150 font-[500] ${
                    postType === t
                      ? "bg-[#111] text-white border-[#111]"
                      : "bg-white text-gray-400 border-[#E5E7EB] hover:border-gray-300 hover:text-gray-700"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Format tooltip (inline text) */}
          {showFmtTooltip && (
            <p className="mt-2.5 text-[11px] text-gray-400 leading-relaxed animate-fade-up">
              {FORMAT_TOOLTIP_TEXT}
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-[#E5E7EB]" />

        {/* Platform toggles + Generate */}
        <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Platform toggles */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => togglePlatform("twitter")}
              className={`min-h-[44px] sm:h-[28px] px-3 text-[12px] rounded-[4px] border transition-all duration-150 font-[500] ${
                platforms.includes("twitter")
                  ? "bg-[#111] text-white border-[#111]"
                  : "bg-white text-gray-400 border-[#E5E7EB] hover:text-gray-600 hover:border-gray-300"
              }`}
            >
              Twitter
            </button>
            <button
              onClick={() => togglePlatform("linkedin")}
              className={`min-h-[44px] sm:h-[28px] px-3 text-[12px] rounded-[4px] border transition-all duration-150 font-[500] ${
                platforms.includes("linkedin")
                  ? "bg-[#111] text-white border-[#111]"
                  : "bg-white text-gray-400 border-[#E5E7EB] hover:text-gray-600 hover:border-gray-300"
              }`}
            >
              LinkedIn
            </button>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !rawIdea.trim() || isRateLimited}
            className={`w-full sm:w-auto min-h-[44px] sm:h-[36px] px-4 sm:px-5 text-[13px] rounded-[6px] font-[500] transition-all duration-150 flex items-center justify-center gap-2 ${
              isGenerating
                ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-[#E5E7EB]"
                : generationCount >= 1
                ? "bg-white text-gray-500 cursor-pointer hover:bg-gray-50 border border-[#E5E7EB]"
                : isRateLimited
                ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-[#E5E7EB]"
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
        <div className="w-full mx-auto mt-4 text-center">
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
      {preview && (
        <div ref={previewRef} className="w-full mt-8 animate-fade-up">
          {/* PREVIEW CARD */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl relative overflow-hidden">
            {/* Top progress line when generating */}
            {isGenerating && (
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gray-100 overflow-hidden">
                <div className="h-full bg-black animate-pulse w-full" />
              </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-[#E5E7EB]">
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
                  className="text-[14px] leading-[1.75] text-gray-900 outline-none ring-1 ring-[#E5E7EB] rounded-md p-3 -mx-1 focus:ring-gray-400 transition-shadow"
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
                  {currentTabContent || (isGenerating ? "" : "No content generated")}
                  {isGenerating && (
                    <span className="inline-block w-1.5 h-4 ml-0.5 bg-gray-800 animate-pulse align-middle" />
                  )}
                </p>
              )}

              {/* Twitter char count */}
              {activeTab === "twitter" && (
                <p className={`mt-2 text-right text-[12px] ${charCountColor(twitterCount)}`}>
                  {twitterCount}
                  <span className="text-gray-300">/280</span>
                </p>
              )}

              {errorMessage && (
                <div className="mt-4 text-sm text-red-600">{errorMessage}</div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5E7EB]">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                  className="text-[12px] text-gray-400 hover:text-gray-700 transition-colors font-[500] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Regenerate
                </button>
                <button
                  onClick={handleEdit}
                  disabled={isGenerating}
                  className="text-[12px] text-gray-400 hover:text-gray-700 transition-colors font-[500] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isEditing ? "Done" : "Edit"}
                </button>
              </div>
              <button
                onClick={handleSave}
                disabled={isSaving || isGenerating}
                className="min-h-[44px] sm:h-[30px] px-4 text-[12px] rounded-[6px] bg-[#111] text-white hover:bg-[#222] transition-colors font-[500] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
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
                      <button
            onClick={() => {
              if (preview?.twitter) {
                const url = buildTwitterIntentUrl(preview.twitter);
                window.open(url, "_blank", "noopener,noreferrer");
              }
            }}
            className="ml-2 min-h-[44px] sm:h-[30px] px-4 text-[12px] rounded-[6px] bg-[#1da1f2] text-white hover:bg-[#1a91da] transition-colors font-[500] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            Post now!
          </button>
        </div>
          </div>

          {/* ── POST-GENERATION NUDGE (Bubble C) ────────────────────────── */}
          {preview && !isGenerating && (() => {
            const seen = localStorage.getItem("tb_gen_seen");
            if (!seen) {
              setTimeout(() => localStorage.setItem("tb_gen_seen", "1"), 100);
              return (
                <p className="mt-4 text-[12px] text-gray-400 leading-relaxed animate-fade-up">
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
          <div className="relative bg-white border border-[#E5E7EB] rounded-xl p-6 w-full max-w-sm animate-fade-up">
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
