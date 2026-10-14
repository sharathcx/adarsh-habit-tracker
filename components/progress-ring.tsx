"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";

type Props = {
  percent: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
};

export function ProgressRing({
  percent,
  size = 240,
  stroke = 14,
  label,
  sublabel,
}: Props) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const target = Math.max(0, Math.min(100, percent));

  const motionPct = useMotionValue(0);
  const dash = useTransform(motionPct, (v) => circumference - (v / 100) * circumference);
  const displayPct = useTransform(motionPct, (v) => Math.round(v));

  useEffect(() => {
    const controls = animate(motionPct, target, {
      type: "spring",
      stiffness: 90,
      damping: 18,
      mass: 0.6,
    });
    return controls.stop;
  }, [target, motionPct]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          className="text-zinc-200 dark:text-zinc-800"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: dash }}
          className="text-primary"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="flex items-baseline">
          <motion.span className="text-5xl font-semibold tracking-tight tabular-nums">
            {displayPct}
          </motion.span>
          <span className="text-2xl font-semibold text-muted-foreground">%</span>
        </div>
        {label && <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</span>}
        {sublabel && <span className="mt-2 text-xs text-muted-foreground">{sublabel}</span>}
      </div>
    </div>
  );
}
