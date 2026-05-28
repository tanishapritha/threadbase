export default function DashboardLoading() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-[#0a0a0a]">
      <div className="flex flex-col items-center gap-4 animate-fade-up">
        <div className="w-10 h-10 border-2 border-white/10 border-t-white rounded-full animate-spin shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
        <p className="text-sm font-medium text-white/50 tracking-wider uppercase text-[10px]">Loading Workspace</p>
      </div>
    </div>
  );
}
