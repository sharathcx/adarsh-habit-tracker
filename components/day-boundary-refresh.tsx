"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { studyDayKey, nextDayBoundary } from "@/lib/day";

/**
 * Server components capture "today" at render time, so a tab left open across
 * 07:00 IST would keep showing the previous day's totals. This re-renders on
 * the boundary — and also on tab focus, since a sleeping laptop or a throttled
 * background tab can fire the timer late (or not at all).
 */
export function DayBoundaryRefresh({ todayKey }: { todayKey: string }) {
  const router = useRouter();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const check = () => {
      clearTimeout(timer);
      if (studyDayKey(new Date()) !== todayKey) {
        // The refreshed render mounts this effect again with the new key.
        router.refresh();
        return;
      }
      // A second of slack so the server is unambiguously past the boundary.
      const delay = nextDayBoundary(new Date()).getTime() - Date.now() + 1000;
      timer = setTimeout(check, Math.max(1000, delay));
    };

    check();
    document.addEventListener("visibilitychange", check);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, [todayKey, router]);

  return null;
}
