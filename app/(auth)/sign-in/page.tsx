import { SignIn } from "@clerk/nextjs";

export const metadata = {
  title: "Sign In – ThreadBase",
};

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d1117] p-6">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">
            Thread<span className="text-[hsl(210,50%,65%)]">Base</span>
          </h1>
          <p className="text-sm text-white/40">Sign in to your account</p>
        </div>
        <SignIn
          routing="hash"
          signUpUrl="/sign-up"
          afterSignInUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: "mx-auto w-full",
              card: "bg-white/5 border border-white/10 shadow-2xl backdrop-blur-xl rounded-2xl",
              headerTitle: "text-white",
              headerSubtitle: "text-white/50",
              socialButtonsBlockButton:
                "bg-white/10 border-white/10 text-white hover:bg-white/15 transition-colors",
              formButtonPrimary:
                "bg-[hsl(210,50%,55%)] hover:bg-[hsl(210,50%,60%)] text-white transition-colors",
              formFieldInput:
                "bg-white/5 border-white/10 text-white placeholder:text-white/30",
              formFieldLabel: "text-white/70",
              footerActionLink: "text-[hsl(210,50%,65%)] hover:text-[hsl(210,50%,75%)]",
              identityPreviewEditButton: "text-[hsl(210,50%,65%)]",
            },
          }}
        />
      </div>
    </div>
  );
}
