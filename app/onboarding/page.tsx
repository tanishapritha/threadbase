"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    purpose: "",
    tone: "",
    platforms: [] as string[],
  });

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else handleComplete();
  };

  const handleComplete = async () => {
    // Normally we would save to the DB here
    // For now, redirect to dashboard
    router.push("/dashboard");
  };

  const togglePlatform = (platform: string) => {
    setData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117] p-6 text-white font-sans">
      <div className="w-full max-w-lg bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
        <div className="mb-8">
          <div className="flex justify-between text-xs text-white/50 mb-2 font-medium tracking-wide">
            <span>Step {step} of 3</span>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[hsl(210,50%,65%)] transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-2">What's your primary goal?</h2>
              <p className="text-white/50 text-sm">Help us tailor your ThreadBase experience.</p>
            </div>
            <div className="grid gap-3">
              {["Building an audience", "Sharing updates", "Promoting a product"].map((goal) => (
                <button
                  key={goal}
                  onClick={() => setData({ ...data, purpose: goal })}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    data.purpose === goal
                      ? "border-[hsl(210,50%,65%)] bg-[hsl(210,50%,65%)]/10 text-white"
                      : "border-white/10 hover:bg-white/5 text-white/70"
                  }`}
                >
                  <span className="font-medium">{goal}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-2">Choose your default tone</h2>
              <p className="text-white/50 text-sm">How do you want your AI-generated posts to sound?</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {["Friendly", "Professional", "Witty", "Inspirational", "Authoritative", "Empathetic", "Humorous", "Concise"].map(
                (tone) => (
                  <button
                    key={tone}
                    onClick={() => setData({ ...data, tone })}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      data.tone === tone
                        ? "border-[hsl(210,50%,65%)] bg-[hsl(210,50%,65%)]/10 text-white"
                        : "border-white/10 hover:bg-white/5 text-white/70"
                    }`}
                  >
                    <span className="text-sm font-medium">{tone}</span>
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-2">Where do you post?</h2>
              <p className="text-white/50 text-sm">Select the platforms you want to schedule to.</p>
            </div>
            <div className="grid gap-3">
              {["Twitter / X", "LinkedIn"].map((platform) => (
                <button
                  key={platform}
                  onClick={() => togglePlatform(platform)}
                  className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                    data.platforms.includes(platform)
                      ? "border-[hsl(210,50%,65%)] bg-[hsl(210,50%,65%)]/10 text-white"
                      : "border-white/10 hover:bg-white/5 text-white/70"
                  }`}
                >
                  <span className="font-medium">{platform}</span>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      data.platforms.includes(platform)
                        ? "border-[hsl(210,50%,65%)] bg-[hsl(210,50%,65%)]"
                        : "border-white/20"
                    }`}
                  >
                    {data.platforms.includes(platform) && (
                      <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3 text-white">
                        <path
                          d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-2.5 rounded-full text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              Back
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={handleNext}
            disabled={
              (step === 1 && !data.purpose) ||
              (step === 2 && !data.tone) ||
              (step === 3 && data.platforms.length === 0)
            }
            className="px-8 py-2.5 rounded-full text-sm font-semibold bg-[hsl(210,50%,55%)] hover:bg-[hsl(210,50%,60%)] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[hsl(210,50%,30%)]/30"
          >
            {step === 3 ? "Complete Setup" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
