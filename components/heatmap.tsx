"use client";

import { motion } from "framer-motion";
import { formatDuration } from "@/lib/planner";
import { weekdayOfKey } from "@/lib/day";
import type { HeatmapDay } from "@/lib/state-service";

type Props = {
  days: HeatmapDay[];
  dailyTarget: number;
};

function intensityClass(minutes: number, target: number, isFuture: boolean): string {
  if (isFuture) return "bg-zinc-100/50 dark:bg-zinc-900/40";
  if (minutes === 0) return "bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50";
  const ratio = minutes / target;
  if (ratio >= 1) return "bg-black dark:bg-white";
  if (ratio >= 0.66) return "bg-zinc-700 dark:bg-zinc-300";
  if (ratio >= 0.33) return "bg-zinc-500 dark:bg-zinc-500";
  return "bg-zinc-300 dark:bg-zinc-700";
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatDateKey(key: string): string {
  const [, m, d] = key.split("-").map(Number);
  return `${WEEKDAYS[weekdayOfKey(key)]}, ${MONTHS[m - 1]} ${d}`;
}

function formatTooltip(day: HeatmapDay) {
  const dateStr = formatDateKey(day.date);
  const dayLabel = `Day ${day.dayNumber}${day.isToday ? " · today" : ""}`;
  if (day.isFuture) return `${dayLabel} · ${dateStr} · upcoming`;
  if (day.minutes === 0) return `${dayLabel} · ${dateStr} · nothing logged`;
  return `${dayLabel} · ${dateStr} · ${formatDuration(day.minutes)}`;
}

export function Heatmap({ days, dailyTarget }: Props) {
  const completedCount = days.filter((d) => !d.isFuture && d.minutes >= dailyTarget).length;
  const lastDay = days[days.length - 1];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Journey · {days.length} days
        </h2>
        <span className="text-xs tabular-nums text-muted-foreground">
          {completedCount} {completedCount === 1 ? "day" : "days"} on target
        </span>
      </div>

      <div className="grid grid-cols-[repeat(13,minmax(0,1fr))] gap-1.5 sm:grid-cols-[repeat(20,minmax(0,1fr))]">
        {days.map((day) => (
          <motion.div
            key={day.date}
            title={formatTooltip(day)}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: Math.min(day.dayNumber, 40) * 0.005 }}
            className={`aspect-square w-full rounded-[3px] ${intensityClass(
              day.minutes,
              dailyTarget,
              day.isFuture,
            )} ${day.isToday ? "ring-2 ring-black dark:ring-white ring-offset-2 ring-offset-card" : ""}`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>
          Day 1 → Day {lastDay?.dayNumber ?? 0}
        </span>
        <div className="flex items-center gap-2">
          <span>less</span>
          <span className="h-2.5 w-2.5 rounded-[2px] bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50" />
          <span className="h-2.5 w-2.5 rounded-[2px] bg-zinc-300 dark:bg-zinc-700" />
          <span className="h-2.5 w-2.5 rounded-[2px] bg-zinc-500 dark:bg-zinc-500" />
          <span className="h-2.5 w-2.5 rounded-[2px] bg-zinc-700 dark:bg-zinc-300" />
          <span className="h-2.5 w-2.5 rounded-[2px] bg-black dark:bg-white" />
          <span>7h+</span>
        </div>
      </div>
    </div>
  );
}
