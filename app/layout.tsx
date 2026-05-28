import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import './globals.css';



export const metadata = {
  title: "ThreadBase",
  description: "AI-powered social content management platform for creators, builders, and writers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <ClerkProvider
        publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
        afterSignOutUrl="/"
        appearance={{
          baseTheme: dark,
        }}
      >
        <body className="min-h-full font-sans">
          {children}
        </body>
      </ClerkProvider>
    </html>
  );
}
