"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";

type Props = {
  className?: string;
};

export function ThemeToggle({ className = "" }: Props) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? theme === "dark" : true;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`group relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-card text-foreground shadow-sm transition-all hover:border-foreground/40 hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${className}`}
    >
      <motion.div
        key={isDark ? "dark" : "light"}
        initial={{ rotate: -90, scale: 0.6, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        exit={{ rotate: 90, scale: 0.6, opacity: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 20 }}
        className="flex items-center justify-center"
      >
        {isDark ? (
          <Moon size={15} className="text-zinc-200 transition-colors group-hover:text-white" strokeWidth={2.2} />
        ) : (
          <Sun size={15} className="text-zinc-700 transition-colors group-hover:text-black" strokeWidth={2.2} />
        )}
      </motion.div>
    </button>
  );
}
