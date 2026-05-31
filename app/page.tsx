import QuickCompose from "@/components/compose/QuickCompose";
import Link from "next/link";
import { TwitterShareButton } from "./components/TwitterShareButton";
export const metadata = {
  title: "ThreadBase — Turn ideas into posts.",
  description: "Write for Twitter and LinkedIn. AI that sounds like you. Review before it posts.",
};

// Reusable inline SVGs
const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const SparklesIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
  </svg>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed] font-sans selection:bg-[hsl(210,50%,65%)] selection:text-white">
      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/10">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between h-16 px-6 md:px-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white/20 to-white/5 border border-white/10 flex items-center justify-center shadow-inner">
              <span className="w-3 h-3 rounded-sm bg-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              ThreadBase
            </span>
          </div>

          {/* Desktop nav items */}
          <div className="flex items-center gap-6">
            <Link
              href="/sign-in"
              className="hidden sm:inline text-sm font-medium text-white/60 hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/sign-up"
              className="h-9 px-5 inline-flex items-center justify-center text-sm font-medium rounded-md bg-white text-black hover:bg-white/90 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-16">
        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section className="relative w-full max-w-7xl mx-auto px-6 md:px-12 py-20 md:py-32 overflow-hidden">
          {/* Background subtle glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[hsl(210,50%,30%)]/20 rounded-full blur-[120px] -z-10 pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center lg:gap-20">
            {/* Left column: headline text */}
            <div className="lg:w-[45%] shrink-0 mb-12 lg:mb-0 animate-fade-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/80 mb-6">
                <SparklesIcon />
                <span>AI-Powered Publishing</span>
              </div>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tighter leading-[1.1] text-white">
                Turn thoughts <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40">into threads.</span>
              </h1>
              
              <p className="mt-6 text-lg md:text-xl text-white/50 leading-relaxed font-light max-w-lg">
                The premium workspace for creators. Draft ideas, let AI refine them in your voice, and schedule across X and LinkedIn seamlessly.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
                <Link
                  href="/sign-up"
                  className="w-full sm:w-auto h-12 px-8 inline-flex items-center justify-center text-base font-medium rounded-lg bg-white text-black hover:bg-white/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                >
                  Start writing for free
                </Link>
                
                <div className="flex items-center gap-4 text-white/40 text-sm font-medium">
                  <span className="flex items-center gap-2">
                    <TwitterIcon /> Twitter
                  </span>
                  <span className="flex items-center gap-2">
                    <LinkedInIcon /> LinkedIn
                  </span>
                </div>
              </div>
            </div>

            {/* Right column: compose card */}
            <div className="lg:w-[55%] min-w-0 relative">
              <div className="absolute -inset-0.5 bg-gradient-to-br from-white/20 to-white/0 rounded-[24px] blur opacity-50" />
              <div className="relative bg-[#111] border border-white/10 rounded-[24px] shadow-2xl overflow-hidden animate-fade-up" style={{ animationDelay: "100ms" }}>
                <div className="h-10 bg-white/5 border-b border-white/10 flex items-center px-4 gap-2">
                  <div className="w-3 h-3 rounded-full bg-white/20" />
                  <div className="w-3 h-3 rounded-full bg-white/20" />
                  <div className="w-3 h-3 rounded-full bg-white/20" />
                </div>
                <div className="p-4 sm:p-6 bg-[#0a0a0a]">
                  <QuickCompose />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ─────────────────────────────────────────────────── */}
        <section className="w-full max-w-7xl mx-auto px-6 md:px-12 py-24 border-t border-white/5">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
              A workspace built for focus.
            </h2>
            <p className="mt-4 text-white/50 max-w-2xl mx-auto">
              Everything you need to grow your audience, packed into a grounded, Notion-like interface that stays out of your way.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white mb-6">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Distraction-free Editor</h3>
              <p className="text-white/50 leading-relaxed">
                Just you and your ideas. Our editor feels native, fast, and stays perfectly synced in the cloud.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white mb-6">
                <SparklesIcon />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Your Personal AI</h3>
              <p className="text-white/50 leading-relaxed">
                We learn your tone and style. Drop a 5-word idea, and ThreadBase will expand it into a high-converting thread.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white mb-6">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Smart Scheduling</h3>
              <p className="text-white/50 leading-relaxed">
                Build your queue and let us handle the rest. We remind you to post when your audience is most active.
              </p>
            </div>
          </div>
        </section>

        {/* ── INTEGRATIONS ─────────────────────────────────────────────── */}
        <section className="w-full max-w-7xl mx-auto px-6 md:px-12 py-24">
          <div className="rounded-[32px] bg-gradient-to-b from-white/5 to-transparent border border-white/10 p-10 md:p-20 text-center">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-8">
              Post everywhere. <br/> Manage from one place.
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-[#111] border border-white/10 shadow-xl">
                <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center">
                  <TwitterIcon />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white">X (Twitter)</p>
                  <p className="text-xs text-white/50">Full thread support</p>
                </div>
              </div>
              <div className="w-8 h-px bg-white/20 hidden sm:block" />
              <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-[#111] border border-white/10 shadow-xl">
                <div className="w-10 h-10 rounded-full bg-[#0a66c2] text-white flex items-center justify-center">
                  <LinkedInIcon />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white">LinkedIn</p>
                  <p className="text-xs text-white/50">Rich formatting</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ────────────────────────────────────────────── */}
        <footer className="w-full border-t border-white/10 bg-[#0a0a0a]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-white" />
              <span className="text-sm font-bold tracking-tight text-white">
                ThreadBase
              </span>
            </div>
            <p className="text-sm text-white/40 font-medium">
              &copy; {new Date().getFullYear()} ThreadBase Inc. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-white/40 hover:text-white transition-colors"><TwitterIcon /></a>
              <a href="#" className="text-white/40 hover:text-white transition-colors"><LinkedInIcon /></a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
