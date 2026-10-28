import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavTabs } from "@/components/nav-tabs";
import { AptitudeFilterProvider } from "@/components/aptitude-filter-context";
import { AptitudeToggle } from "@/components/aptitude-toggle";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

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
  description: "7 hours a day. One syllabus.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("adarsh_theme");if(t==="light"){document.documentElement.classList.remove("dark")}else{document.documentElement.classList.add("dark")}}catch(e){document.documentElement.classList.add("dark")}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground lg:h-screen lg:overflow-hidden">
        <ThemeProvider>
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
                  <ThemeToggle />
                </div>
                <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground ring-1 ring-border/60 hidden md:inline-flex">
                  7h a day
                </span>
              </nav>
            </header>
            <main className="flex-1 lg:min-h-0">{children}</main>
          </AptitudeFilterProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
