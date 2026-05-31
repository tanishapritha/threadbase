"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";

const TONES = [
  "Friendly",
  "Professional",
  "Witty",
  "Inspirational",
  "Authoritative",
  "Empathetic",
  "Humorous",
  "Concise",
];

const FORMATS = [
  "Short & punchy",
  "Story-driven",
  "Data-backed",
  "Question-based",
  "How-to guide",
  "Listicle",
];

export default function PreferencesPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [bio, setBio] = useState("");
  const [niche, setNiche] = useState("");
  const [defaultTone, setDefaultTone] = useState("Professional");
  const [twitterFormat, setTwitterFormat] = useState("");
  const [linkedinFormat, setLinkedinFormat] = useState("");
  const [addHashtags, setAddHashtags] = useState(true);
  const [topics, setTopics] = useState<string[]>([]);
  const [avoidTopics, setAvoidTopics] = useState<string[]>([]);

  // Chip input state
  const [topicInput, setTopicInput] = useState("");
  const [avoidTopicInput, setAvoidTopicInput] = useState("");

  const fetchPreferences = useCallback(async () => {
    try {
      const res = await fetch("/api/preferences");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const prefs = data.preferences;
      if (prefs) {
        setBio(prefs.bio || "");
        setNiche(prefs.niche || "");
        setDefaultTone(prefs.default_tone || "Professional");
        setTwitterFormat(prefs.twitter_format || "");
        setLinkedinFormat(prefs.linkedin_format || "");
        setAddHashtags(prefs.add_hashtags ?? true);
        setTopics(prefs.topics || []);
        setAvoidTopics(prefs.avoid_topics || []);
      }
    } catch (err) {
      console.error("[Preferences]", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio,
          niche,
          defaultTone,
          twitterFormat,
          linkedinFormat,
          addHashtags,
          topics,
          avoidTopics,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");
      showToast("Preferences saved", "success");
    } catch {
      showToast("Failed to save preferences", "error");
    } finally {
      setSaving(false);
    }
  };

  const addChip = (value: string, list: string[], setter: (v: string[]) => void) => {
    const trimmed = value.trim();
    if (trimmed && !list.includes(trimmed)) {
      setter([...list, trimmed]);
    }
  };

  const removeChip = (value: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.filter((t) => t !== value));
  };

  if (loading) {
    return (
      <div className="text-white font-sans animate-fade-up">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Preferences</h1>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-[#111] border border-white/5 rounded-xl animate-shimmer-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="text-white font-sans animate-fade-up">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-1">Preferences</h1>
        <p className="text-sm text-white/50">
          Configure your default writing style and content preferences.
        </p>
      </div>

      <div className="bg-[#111] border border-white/10 rounded-xl p-6 space-y-6 max-w-2xl">
        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[hsl(210,50%,65%)] resize-none min-h-[80px]"
          />
        </div>

        {/* Niche */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">Niche</label>
          <input
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="e.g. SaaS, Marketing, Personal Growth"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[hsl(210,50%,65%)]"
          />
        </div>

        {/* Default tone */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">
            Default Tone
          </label>
          <div className="flex flex-wrap gap-2">
            {TONES.map((t) => (
              <button
                key={t}
                onClick={() => setDefaultTone(t)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                  defaultTone === t
                    ? "bg-[hsl(210,50%,30%)] text-white border-[hsl(210,50%,40%)]"
                    : "text-white/40 border-white/10 hover:bg-white/5"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Twitter format */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">
            Twitter Format
          </label>
          <select
            value={twitterFormat}
            onChange={(e) => setTwitterFormat(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[hsl(210,50%,65%)]"
          >
            <option value="" className="bg-gray-800">Default</option>
            {FORMATS.map((f) => (
              <option key={f} value={f} className="bg-gray-800">
                {f}
              </option>
            ))}
          </select>
        </div>

        {/* LinkedIn format */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">
            LinkedIn Format
          </label>
          <select
            value={linkedinFormat}
            onChange={(e) => setLinkedinFormat(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[hsl(210,50%,65%)]"
          >
            <option value="" className="bg-gray-800">Default</option>
            {FORMATS.map((f) => (
              <option key={f} value={f} className="bg-gray-800">
                {f}
              </option>
            ))}
          </select>
        </div>

        {/* Add hashtags toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-white/70">Add Hashtags</label>
            <p className="text-xs text-white/40">Automatically include relevant hashtags</p>
          </div>
          <button
            onClick={() => setAddHashtags(!addHashtags)}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              addHashtags ? "bg-[hsl(210,50%,55%)]" : "bg-white/10"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                addHashtags ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {/* Topics chip input */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">
            Topics
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {topics.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full bg-[hsl(210,50%,25%)]/50 text-[hsl(210,50%,75%)] border border-[hsl(210,50%,30%)]/50"
              >
                {t}
                <button
                  onClick={() => removeChip(t, topics, setTopics)}
                  className="hover:text-white"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addChip(topicInput, topics, setTopics);
                  setTopicInput("");
                }
              }}
              placeholder="Type and press Enter to add"
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[hsl(210,50%,65%)]"
            />
            <button
              onClick={() => {
                addChip(topicInput, topics, setTopics);
                setTopicInput("");
              }}
              className="px-4 text-xs rounded-lg bg-white/10 text-white hover:bg-white/20 font-medium"
            >
              Add
            </button>
          </div>
        </div>

        {/* Avoid topics chip input */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">
            Avoid Topics
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {avoidTopics.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full bg-red-500/10 text-red-400 border border-red-500/20"
              >
                {t}
                <button
                  onClick={() => removeChip(t, avoidTopics, setAvoidTopics)}
                  className="hover:text-white"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={avoidTopicInput}
              onChange={(e) => setAvoidTopicInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addChip(avoidTopicInput, avoidTopics, setAvoidTopics);
                  setAvoidTopicInput("");
                }
              }}
              placeholder="Type and press Enter to add"
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[hsl(210,50%,65%)]"
            />
            <button
              onClick={() => {
                addChip(avoidTopicInput, avoidTopics, setAvoidTopics);
                setAvoidTopicInput("");
              }}
              className="px-4 text-xs rounded-lg bg-white/10 text-white hover:bg-white/20 font-medium"
            >
              Add
            </button>
          </div>
        </div>

        {/* Save button */}
        <div className="pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 h-11 rounded-xl text-sm font-semibold bg-white text-black hover:bg-white/90 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              "Save Preferences"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
