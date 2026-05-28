export default function GlobalLoading() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0a]">
      <div className="flex flex-col items-center gap-4 animate-fade-up">
        <div className="w-10 h-10 border-2 border-[hsl(210,50%,65%)]/20 border-t-[hsl(210,50%,65%)] rounded-full animate-spin shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
      </div>
    </div>
  );
}
