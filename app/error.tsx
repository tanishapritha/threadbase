"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0d1117] p-6 text-white">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-3xl">
          !
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
          <p className="text-white/50 text-sm leading-relaxed">
            An unexpected error occurred. Please try again or contact support if the problem persists.
          </p>
          {error.digest && (
            <p className="text-xs text-white/20 font-mono">Error ID: {error.digest}</p>
          )}
        </div>

        <button
          onClick={reset}
          className="px-8 py-3 rounded-full text-sm font-semibold bg-[hsl(210,50%,55%)] hover:bg-[hsl(210,50%,60%)] transition-all shadow-lg shadow-[hsl(210,50%,30%)]/30 hover:-translate-y-0.5 active:translate-y-0"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
