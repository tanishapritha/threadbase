"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check for pending post from anonymous generation
    const pendingStr = sessionStorage.getItem("tb_pending_post");
    if (pendingStr) {
      const savePending = async () => {
        try {
          const pending = JSON.parse(pendingStr);
          const res = await fetch("/api/posts/save-pending", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(pending),
          });

          if (res.ok) {
            sessionStorage.removeItem("tb_pending_post");
            // Redirect to dashboard with welcome flag
            if (pathname !== "/dashboard") {
              router.push("/dashboard?welcome=1");
            } else {
              // Already on dashboard, just add the search param
              router.replace("/dashboard?welcome=1");
            }
          }
        } catch (err) {
          console.error("[Pending post save]", err);
          sessionStorage.removeItem("tb_pending_post");
        }
      };

      savePending();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
