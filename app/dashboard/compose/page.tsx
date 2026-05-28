"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ComposePage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'twitter' | 'linkedin'>('twitter');
  const [rawIdea, setRawIdea] = useState('');
  const [tone, setTone] = useState('Friendly');
  const [isGenerating, setIsGenerating] = useState(false);
  const [formattedContent, setFormattedContent] = useState<any>(null);
  // Simple typewriter effect component
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
                <div className="flex flex-col flex-1">
                  <div className="flex gap-4 border-b border-white/10 mb-4">
                    {formattedContent.twitter && (
                      <button onClick={() => setActiveTab("twitter")} className={`pb-2 text-sm font-medium transition-colors ${activeTab === "twitter" ? "text-white border-b-2 border-[hsl(210,50%,65%)]" : "text-white/40"}`}>Twitter</button>
                    )}
                    {formattedContent.linkedin && (
                      <button onClick={() => setActiveTab("linkedin")} className={`pb-2 text-sm font-medium transition-colors ${activeTab === "linkedin" ? "text-white border-b-2 border-[#0a66c2]" : "text-white/40"}`}>LinkedIn</button>
                    )}
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl text-sm leading-relaxed text-white/90">
                    <Typewriter text={formattedContent[activeTab] || ""} />
                  </div>
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
