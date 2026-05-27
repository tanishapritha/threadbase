import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export const metadata = {
  title: "ThreadBase – AI-Powered Social Content Platform",
  description: "Create, schedule, and publish content across Twitter, LinkedIn and more with AI assistance.",
};

const features = [
  {
    icon: "✦",
    title: "AI Composer",
    desc: "Transform your ideas into polished posts optimised for each platform in seconds.",
  },
  {
    icon: "◷",
    title: "Smart Scheduling",
    desc: "Queue your content and let ThreadBase publish at the perfect moment automatically.",
  },
  {
    icon: "⬡",
    title: "Multi-Platform",
    desc: "Reach your audience on Twitter/X and LinkedIn from one beautiful interface.",
  },
  {
    icon: "◈",
    title: "Tone Control",
    desc: "Choose from 8 professional tones — friendly, witty, authoritative and more.",
  },
];

export default async function LandingPage() {
  const { userId } = await auth();
  const isSignedIn = !!userId;

  return (
    <div className="min-h-screen bg-[#0d1117] text-white font-sans overflow-x-hidden">
      {/* ── NAVBAR ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md bg-[#0d1117]/80 border-b border-white/5">
        <span className="text-xl font-semibold tracking-tight text-white">
          Thread<span className="text-[hsl(210,50%,65%)]">Base</span>
        </span>
        <div className="flex items-center gap-3">
          {!isSignedIn ? (
            <>
              <SignInButton mode="modal">
                <button className="px-4 py-2 rounded-full text-sm font-medium text-white/70 hover:text-white transition-colors">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="px-5 py-2 rounded-full text-sm font-semibold bg-[hsl(210,50%,55%)] hover:bg-[hsl(210,50%,60%)] transition-colors shadow-lg shadow-[hsl(210,50%,30%)]/30">
                  Get started free
                </button>
              </SignUpButton>
            </>
          ) : (
            <>
              <Link
                href="/dashboard"
                className="px-5 py-2 rounded-full text-sm font-semibold bg-[hsl(210,50%,55%)] hover:bg-[hsl(210,50%,60%)] transition-colors"
              >
                Dashboard
              </Link>
              <UserButton afterSignOutUrl="/" />
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center text-center min-h-screen px-6 pt-24 pb-16">
        {/* background glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[hsl(210,50%,55%)]/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto space-y-7">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 text-xs text-white/50 bg-white/5 backdrop-blur">
            <span className="w-1.5 h-1.5 rounded-full bg-[hsl(210,50%,65%)] animate-pulse" />
            Now in beta — free for early users
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold leading-[1.1] tracking-tight">
            The content platform<br />
            <span className="text-[hsl(210,50%,65%)]">built for creators.</span>
          </h1>

          <p className="text-lg text-white/50 max-w-xl mx-auto leading-relaxed">
            Write once. Publish everywhere. ThreadBase uses AI to craft and schedule
            platform-perfect posts for Twitter/X and LinkedIn — so you can focus on ideas.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            {!isSignedIn ? (
              <>
                <SignUpButton mode="modal">
                  <button className="w-full sm:w-auto px-8 py-3.5 rounded-full font-semibold text-base bg-[hsl(210,50%,55%)] hover:bg-[hsl(210,50%,60%)] transition-all shadow-xl shadow-[hsl(210,50%,30%)]/30 hover:shadow-[hsl(210,50%,30%)]/50 hover:-translate-y-0.5 active:translate-y-0">
                    Start for free →
                  </button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <button className="w-full sm:w-auto px-8 py-3.5 rounded-full font-medium text-base border border-white/10 hover:border-white/25 hover:bg-white/5 transition-all text-white/70 hover:text-white">
                    Sign in
                  </button>
                </SignInButton>
              </>
            ) : (
              <Link
                href="/dashboard"
                className="px-8 py-3.5 rounded-full font-semibold text-base bg-[hsl(210,50%,55%)] hover:bg-[hsl(210,50%,60%)] transition-all shadow-xl shadow-[hsl(210,50%,30%)]/30 hover:-translate-y-0.5"
              >
                Go to Dashboard →
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ──────────────────────────────────────── */}
      <section className="px-6 pb-24 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-2xl border border-white/8 bg-white/3 hover:bg-white/6 hover:border-white/15 transition-all group"
            >
              <span className="text-2xl text-[hsl(210,50%,65%)] mb-4 block">{f.icon}</span>
              <h3 className="font-semibold text-white mb-1.5">{f.title}</h3>
              <p className="text-sm text-white/45 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 px-6 py-8 text-center text-xs text-white/25">
        © {new Date().getFullYear()} ThreadBase. Built for creators, writers, and builders.
      </footer>
    </div>
  );
}
