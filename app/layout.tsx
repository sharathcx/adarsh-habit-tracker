import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavTabs } from "@/components/nav-tabs";

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
  description: "4 hours a day. One syllabus.",
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
        <header className="shrink-0">
          <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5 text-sm">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-semibold tracking-tight"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-primary text-primary-foreground text-[11px] font-bold">
                GD
              </span>
              <span>GATE DA</span>
            </Link>
            <NavTabs />
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-primary">
              4h a day
            </span>
          </nav>
        </header>
        <main className="flex-1 lg:min-h-0">{children}</main>
      </body>
    </html>
  );
}
