"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ComposePage() {
  const router = useRouter();
  const [rawIdea, setRawIdea] = useState("");
  const [tone, setTone] = useState("Professional");
  const [isGenerating, setIsGenerating] = useState(false);
  const [formattedContent, setFormattedContent] = useState<{ twitter?: string; linkedin?: string } | null>(null);

  const handleGenerate = async () => {
    if (!rawIdea.trim()) return;
    setIsGenerating(true);
    
    try {
      const res = await fetch("/api/ai/format", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawIdea, tone }),
      });
      
      if (!res.ok) throw new Error("Failed to generate");
      const data = await res.json();
      setFormattedContent(data);
    } catch (error) {
      console.error(error);
      alert("Error generating post. Please check your API keys and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSchedule = () => {
    // Dummy schedule handler for now
    alert("Post scheduled successfully (Mock)");
    router.push("/dashboard");
  };

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
                    {["Friendly", "Professional", "Witty", "Inspirational", "Authoritative", "Empathetic", "Humorous", "Concise"].map((t) => (
                      <option key={t} value={t} className="bg-gray-800 text-white">
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !rawIdea.trim()}
                  className="px-6 py-2.5 rounded-full text-sm font-semibold bg-[hsl(210,50%,55%)] hover:bg-[hsl(210,50%,60%)] disabled:opacity-50 transition-all shadow-lg shadow-[hsl(210,50%,30%)]/30 flex items-center gap-2"
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
                <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {formattedContent.twitter && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[hsl(210,50%,65%)] font-medium text-sm">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        Twitter / X
                      </div>
                      <textarea 
                        value={formattedContent.twitter}
                        onChange={(e) => setFormattedContent({...formattedContent, twitter: e.target.value})}
                        className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-[hsl(210,50%,65%)] resize-none"
                      />
                    </div>
                  )}
                  
                  {formattedContent.linkedin && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[#0a66c2] font-medium text-sm">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                        LinkedIn
                      </div>
                      <textarea 
                        value={formattedContent.linkedin}
                        onChange={(e) => setFormattedContent({...formattedContent, linkedin: e.target.value})}
                        className="w-full h-48 bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-[#0a66c2] resize-none"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {formattedContent && (
              <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2">
                <button
                  onClick={handleSchedule}
                  className="px-8 py-3 rounded-full text-sm font-semibold bg-white text-[#0d1117] hover:bg-white/90 transition-all shadow-xl hover:-translate-y-0.5"
                >
                  Schedule Posts
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
