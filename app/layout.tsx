import { ClerkProvider } from "@clerk/nextjs";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-serif",
});

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
    <html lang="en" className={`${inter.variable} ${sourceSerif.variable} h-full`}>
      <ClerkProvider
        publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
        afterSignOutUrl="/"
      >
        <body className="min-h-full font-sans">
          {children}
        </body>
      </ClerkProvider>
    </html>
  );
}
