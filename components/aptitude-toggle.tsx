"use client";

import { motion } from "framer-motion";
import { Brain, Check } from "lucide-react";
import { useAptitudeFilter } from "./aptitude-filter-context";

type Props = {
  compact?: boolean;
  className?: string;
};

export function AptitudeToggle({ compact = false, className = "" }: Props) {
  const { showAptitude, toggleAptitude } = useAptitudeFilter();

  return (
    <button
      type="button"
      onClick={toggleAptitude}
      role="switch"
      aria-checked={showAptitude}
      className={`group relative inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-2.5 py-1 text-xs font-medium shadow-sm transition-all hover:border-foreground/40 hover:bg-secondary/70 ${
        showAptitude ? "ring-1 ring-border" : ""
      } ${className}`}
      title={
        showAptitude
          ? "General Aptitude (GA) is included in total hours. Click to exclude and focus on Technicals."
          : "General Aptitude (GA) is excluded from total hours (starts after Technicals from Dec 16). Click to include GA."
      }
    >
      <div className="flex items-center gap-1.5">
        <span
          className={`flex h-4 w-4 items-center justify-center rounded-full transition-colors ${
            showAptitude
              ? "bg-black text-white dark:bg-white dark:text-black"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {showAptitude ? <Check size={10} strokeWidth={3} /> : <Brain size={10} />}
        </span>
        <span className="text-[12px] font-medium leading-none text-foreground">
          {compact ? (
            <span>GA</span>
          ) : (
            <>
              <span className="hidden sm:inline">General Aptitude (GA)</span>
              <span className="sm:hidden">GA</span>
            </>
          )}
        </span>
      </div>

      {/* Pill toggle switch */}
      <div
        className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
          showAptitude ? "bg-black dark:bg-white" : "bg-muted-foreground/30"
        }`}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={`pointer-events-none inline-block h-3 w-3 rounded-full shadow-sm ${
            showAptitude
              ? "translate-x-4 bg-white dark:bg-black"
              : "translate-x-0 bg-white"
          }`}
        />
      </div>
    </button>
  );
}
