import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavTabs } from "@/components/nav-tabs";
import { AptitudeFilterProvider } from "@/components/aptitude-filter-context";
import { AptitudeToggle } from "@/components/aptitude-toggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GATE DA — Daily Plan",
  description: "6 hours a day. One syllabus.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground lg:h-screen lg:overflow-hidden">
        <AptitudeFilterProvider>
          <header className="shrink-0">
            <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5 text-sm gap-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 font-semibold tracking-tight shrink-0"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-black text-white dark:bg-white dark:text-black text-[11px] font-bold">
                  GD
                </span>
                <span className="hidden sm:inline">GATE DA</span>
              </Link>
              <div className="flex items-center gap-2 sm:gap-3">
                <NavTabs />
                <AptitudeToggle />
              </div>
              <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground ring-1 ring-border/60 hidden md:inline-flex">
                6h a day
              </span>
            </nav>
          </header>
          <main className="flex-1 lg:min-h-0">{children}</main>
        </AptitudeFilterProvider>
      </body>
    </html>
  );
}
