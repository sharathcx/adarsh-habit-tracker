"use client";

import { motion } from "framer-motion";
import { Check, Network } from "lucide-react";
import { useDsaFilter } from "./dsa-filter-context";

export function DsaToggle({ className = "" }: { className?: string }) {
  const { showDsa, toggleDsa } = useDsaFilter();

  return (
    <button
      type="button"
      onClick={toggleDsa}
      role="switch"
      aria-checked={showDsa}
      className={`group relative inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-2.5 py-1 text-xs font-medium shadow-sm transition-all hover:border-foreground/40 hover:bg-secondary/70 ${
        showDsa ? "ring-1 ring-border" : ""
      } ${className}`}
      title={
        showDsa
          ? "DSA is included in total hours. Click to exclude DSA."
          : "DSA is excluded from total hours. Click to include DSA."
      }
    >
      <div className="flex items-center gap-1.5">
        <span
          className={`flex h-4 w-4 items-center justify-center rounded-full transition-colors ${
            showDsa
              ? "bg-black text-white dark:bg-white dark:text-black"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {showDsa ? <Check size={10} strokeWidth={3} /> : <Network size={10} />}
        </span>
        <span className="text-[12px] font-medium leading-none text-foreground">DSA</span>
      </div>

      <div
        className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
          showDsa ? "bg-black dark:bg-white" : "bg-muted-foreground/30"
        }`}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={`pointer-events-none inline-block h-3 w-3 rounded-full shadow-sm ${
            showDsa
              ? "translate-x-4 bg-white dark:bg-black"
              : "translate-x-0 bg-white"
          }`}
        />
      </div>
    </button>
  );
}
