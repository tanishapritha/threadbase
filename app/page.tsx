import QuickCompose from "@/components/compose/QuickCompose";

export const metadata = {
  title: "Threadbase — Turn ideas into posts.",
  description:
    "Write for Twitter and LinkedIn. AI that sounds like you. Review before it posts.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 font-sans">
      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-40 bg-white border-b border-[#E5E7EB]">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between h-[52px] px-6 md:px-12">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded bg-[#111]" />
            <span className="text-[15px] font-[500] tracking-tight text-gray-900">
              Threadbase
            </span>
          </div>

          {/* Desktop nav items */}
          <div className="flex items-center gap-3">
            <a
              href="/sign-in"
              className="hidden sm:inline text-[13px] text-gray-400 hover:text-gray-700 transition-colors font-[400]"
            >
              Sign in
            </a>
            <a
              href="/sign-up"
              className="h-[30px] px-4 inline-flex items-center text-[13px] rounded-[6px] bg-[#111] text-white hover:bg-[#222] transition-colors font-[500]"
            >
              Get started &rarr;
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <main className="pt-[52px]">
        <section className="w-full max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-20">
          {/* Asymmetric 2-column layout on desktop */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:gap-16">
            {/* Left column: headline text */}
            <div className="lg:w-[38%] lg:sticky lg:top-[100px] shrink-0 mb-8 lg:mb-0">
              <h1 className="font-serif text-[32px] sm:text-[38px] md:text-[42px] font-[500] tracking-[-0.01em] leading-[1.2] text-gray-900">
                Turn ideas into posts.
                <br />
                Automatically.
              </h1>

              <p className="mt-4 text-[14px] text-gray-400 leading-relaxed max-w-sm font-[400]">
                Write for Twitter and LinkedIn. AI that sounds like you. Review before it posts.
              </p>
            </div>

            {/* Right column: compose card */}
            <div className="lg:w-[56%] min-w-0">
              <QuickCompose />
            </div>
          </div>
        </section>

        {/* ── FOOTER ────────────────────────────────────────────── */}
        <footer className="w-full max-w-7xl mx-auto px-6 md:px-12 pb-10 text-center">
          <p className="text-[11px] text-gray-300 font-[400]">
            &copy; {new Date().getFullYear()} Threadbase.
          </p>
        </footer>
      </main>
    </div>
  );
}
