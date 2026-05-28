import QuickCompose from "@/components/compose/QuickCompose";

export const metadata = {
  title: "Threadbase — Turn ideas into posts.",
  description:
    "Write for Twitter and LinkedIn. AI that sounds like you. Review before it posts.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-[640px] mx-auto flex items-center justify-between h-[52px] px-4 sm:px-0">
          {/* Logo */}
          <div className="flex items-center gap-2">
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
        <section className="px-2 sm:px-4 pb-16 pt-[72px] flex flex-col items-center">
          {/* Headline */}
          <h1 className="text-[28px] sm:text-[32px] font-[500] tracking-[-0.02em] text-gray-900 text-center leading-tight">
            Turn ideas into posts.
            <br />
            Automatically.
          </h1>

          {/* Subheader */}
          <p className="mt-2 text-[14px] text-gray-400 text-center max-w-md leading-relaxed font-[400]">
            Write for Twitter and LinkedIn. AI that sounds like you.
            <br />
            Review before it posts.
          </p>

          {/* Spacer */}
          <div className="mt-[36px] w-full flex justify-center">
            <QuickCompose />
          </div>
        </section>

        {/* ── FOOTER ────────────────────────────────────────────── */}
        <footer className="px-2 sm:px-4 pb-8 text-center">
          <p className="text-[11px] text-gray-300 font-[400]">
            &copy; {new Date().getFullYear()} Threadbase.
          </p>
        </footer>
      </main>
    </div>
  );
}
