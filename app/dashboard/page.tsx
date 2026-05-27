import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Dashboard – ThreadBase",
};

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0d1117] text-white p-6">
      <section className="relative w-full max-w-2xl rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-10 shadow-2xl text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 text-xs text-white/40 bg-white/5">
          <span className="w-1.5 h-1.5 rounded-full bg-[hsl(210,50%,65%)] animate-pulse" />
          Dashboard
        </div>

        <h1 className="text-4xl font-bold text-white tracking-tight">
          Welcome to <span className="text-[hsl(210,50%,65%)]">ThreadBase</span>
        </h1>

        <p className="text-white/50 text-lg max-w-md mx-auto leading-relaxed">
          Your AI-powered content platform is ready. Create, schedule, and publish across platforms effortlessly.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <a
            href="/onboarding"
            className="px-7 py-3 rounded-full font-semibold text-sm bg-[hsl(210,50%,55%)] hover:bg-[hsl(210,50%,60%)] transition-all shadow-lg shadow-[hsl(210,50%,30%)]/30 hover:-translate-y-0.5"
          >
            Start Onboarding →
          </a>
          <a
            href="/compose"
            className="px-7 py-3 rounded-full font-medium text-sm border border-white/10 hover:border-white/25 hover:bg-white/5 transition-all text-white/70 hover:text-white"
          >
            Compose a Post
          </a>
        </div>
      </section>
    </main>
  );
}
