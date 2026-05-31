// app/dashboard/layout.tsx
// Server component — runs bootstrap guard to ensure user + workspace records exist in Supabase.

import { currentUser } from "@clerk/nextjs/server";
import { ensureUserExists } from "@/lib/ensureUserExists";
import { DashboardShell } from "./DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Bootstrap guard: ensures the Clerk user has corresponding records in Supabase.
  // This acts as a safety net for users who signed up before the webhook was working,
  // or if the webhook ever fails. Runs once per session.
  const user = await currentUser();
  if (user) {
    await ensureUserExists(
      user.id,
      user.emailAddresses[0]?.emailAddress ?? "",
      [user.firstName, user.lastName].filter(Boolean).join(" ") || "User"
    );
  }

  return <DashboardShell>{children}</DashboardShell>;
}
