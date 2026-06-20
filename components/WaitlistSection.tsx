"use client";
import { SignInButton, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Handles user sign‑in (Google or email) and automatically adds the user's email
 * to the waitlist DB via `/api/join-waitlist`. After a successful join it shows a
 * thank‑you message.
 */
export default function LoginAndJoinWaitlist() {
  const { isSignedIn, user } = useUser();
  const [joined, setJoined] = useState(false);

  const router = useRouter();
  useEffect(() => {
    if (isSignedIn && user && !joined) {
      const email = user.emailAddresses?.[0]?.emailAddress;
      if (!email) return;
      fetch("/api/join-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to join waitlist");
          return res.json();
        })
        .then(() => {
          setJoined(true);
          // navigate to dashboard after a short pause for UX
          setTimeout(() => router.push('/dashboard'), 800);
        })
        .catch((err) => console.error("[join‑waitlist]", err));
    }
  }, [isSignedIn, user, joined, router]);

  return (
    <section id="waitlist" className="w-full py-16 bg-[#0a0a0a] text-[#ededed] animate-fade-up">
      <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
          Join the ThreadBase Waitlist
        </h2>
        {joined ? (
          <p className="text-lg text-white/70">Thank you! You’re now on the waitlist.</p>
        ) : (
          <>
            <p className="text-lg text-white/70 mb-8">
              Unlock early access to premium features, exclusive discounts, and a chance to have your posts featured.
            </p>
            <SignInButton
              mode="modal"
              forceRedirectUrl="/dashboard"
              fallbackRedirectUrl="/dashboard"
            >
              Login / Join Waitlist →
            </SignInButton>
          </>
        )}
      </div>
    </section>
  );
}
