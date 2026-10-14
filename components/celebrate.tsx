"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";

type Props = {
  show: boolean;
  dayNumber: number;
  onDismiss: () => void;
};

export function Celebrate({ show, dayNumber, onDismiss }: Props) {
  useEffect(() => {
    if (!show) return;
    const end = Date.now() + 900;
    const colors = ["#a78bfa", "#34d399", "#fbbf24", "#fb7185", "#22d3ee", "#60a5fa"];
    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 70,
        startVelocity: 55,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 70,
        startVelocity: 55,
        origin: { x: 1, y: 0.7 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm"
          onClick={onDismiss}
        >
          <motion.div
            initial={{ scale: 0.92, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            className="mx-6 max-w-md rounded-3xl bg-card px-8 py-10 text-center shadow-2xl ring-1 ring-border"
          >
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Day {dayNumber}
            </div>
            <div className="mt-3 text-4xl font-semibold tracking-tight">Day complete.</div>
            <p className="mt-4 text-sm text-muted-foreground">
              Four hours down. The streak grows. See you tomorrow.
            </p>
            <button
              onClick={onDismiss}
              className="mt-7 inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
