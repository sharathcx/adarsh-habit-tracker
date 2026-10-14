"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Repeat, Check } from "lucide-react";
import { studyDayKey, daysBetweenKeys } from "@/lib/day";
import { DayBoundaryRefresh } from "./day-boundary-refresh";
import type { AppState, ClientTopic } from "@/lib/state-service";

type Props = { state: AppState };

function formatRelative(iso: string, todayKey: string): string {
  const days = daysBetweenKeys(studyDayKey(iso), todayKey);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function RevisionView({ state }: Props) {
  const router = useRouter();
  const [pendingRevisionId, setPendingRevisionId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const logRevision = (topicId: string) => {
    setPendingRevisionId(topicId);
    startTransition(async () => {
      try {
        await fetch("/api/revisions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topicId }),
        });
        router.refresh();
      } finally {
        setPendingRevisionId(null);
      }
    });
  };

  const removeRevision = (topicId: string) => {
    setPendingRevisionId(topicId);
    startTransition(async () => {
      try {
        await fetch(`/api/revisions?topicId=${topicId}`, { method: "DELETE" });
        router.refresh();
      } finally {
        setPendingRevisionId(null);
      }
    });
  };

  const groups = state.subjects
    .map((s) => ({ subject: s, topics: s.topics.filter((t) => t.isComplete) }))
    .filter((g) => g.topics.length > 0);

  const completedCount = groups.reduce((sum, g) => sum + g.topics.length, 0);
  const totalRevisions = groups.reduce(
    (sum, g) => sum + g.topics.reduce((s, t) => s + t.revisionCount, 0),
    0,
  );
  const notRevised = groups.reduce(
    (sum, g) => sum + g.topics.filter((t) => t.revisionCount === 0).length,
    0,
  );

  return (
    <div className="scrollbar-hide mx-auto h-full max-w-4xl overflow-y-auto px-4 pb-24 pt-4 sm:px-6">
      <DayBoundaryRefresh todayKey={state.todayKey} />
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border/60">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-300/20 blur-3xl"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm"
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #818cf8 55%, #c7d2fe 100%)",
              }}
            >
              <Repeat size={22} className="text-white drop-shadow-sm" strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Revision</h1>
              <p className="text-sm text-muted-foreground">
                Track how many times you&apos;ve revised each completed topic.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatChip value={completedCount} label="completed" />
            <StatChip value={totalRevisions} label="revisions" />
            <StatChip value={notRevised} label="not yet revised" />
          </div>
        </div>
      </section>

      {/* Subject groups */}
      {completedCount === 0 ? (
        <div className="mx-auto mt-16 flex max-w-md flex-col items-center px-6 text-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm"
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #818cf8 55%, #c7d2fe 100%)",
            }}
          >
            <Repeat size={26} className="text-white" strokeWidth={2.2} />
          </div>
          <h2 className="mt-4 text-lg font-semibold tracking-tight">Nothing to revise yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Complete a topic on the Home page and it&apos;ll show up here, ready to revise.
          </p>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-4">
          {groups.map((g) => {
            const subjectRevisions = g.topics.reduce((s, t) => s + t.revisionCount, 0);
            return (
              <motion.section
                key={g.subject._id}
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 26 }}
                className="relative rounded-3xl p-5 shadow-sm ring-1 ring-border/60 transition-shadow hover:shadow-md"
                style={{
                  backgroundColor: "var(--card)",
                  backgroundImage: `radial-gradient(circle at top right, ${g.subject.color}22, transparent 60%)`,
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-9 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: g.subject.color }}
                  />
                  <div className="min-w-0">
                    <h2 className="truncate text-[15px] font-semibold tracking-tight">
                      {g.subject.name}
                    </h2>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      {g.topics.length} {g.topics.length === 1 ? "topic" : "topics"} ·{" "}
                      {subjectRevisions} {subjectRevisions === 1 ? "revision" : "revisions"}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  {g.topics.map((t) => (
                    <RevisionTopicRow
                      key={t._id}
                      topic={t}
                      subjectColor={g.subject.color}
                      pending={pendingRevisionId === t._id}
                      todayKey={state.todayKey}
                      onAdd={() => logRevision(t._id)}
                      onRemove={() => removeRevision(t._id)}
                    />
                  ))}
                </div>
              </motion.section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatChip({ value, label }: { value: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium shadow-sm ring-1 ring-border/60">
      <span className="tabular-nums">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}

type RevisionTopicRowProps = {
  topic: ClientTopic;
  subjectColor: string;
  pending: boolean;
  todayKey: string;
  onAdd: () => void;
  onRemove: () => void;
};

function RevisionTopicRow({
  topic,
  subjectColor,
  pending,
  todayKey,
  onAdd,
  onRemove,
}: RevisionTopicRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-secondary/60 px-4 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium">{topic.name}</div>
        <div className="mt-0.5 text-[10px] tabular-nums text-muted-foreground">
          {topic.revisionCount > 0 && topic.lastRevisedAt
            ? `${topic.revisionCount}× · last ${formatRelative(topic.lastRevisedAt, todayKey)}`
            : "Not revised yet"}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
        {Array.from({ length: topic.revisionCount }).map((_, i) => {
          const isLast = i === topic.revisionCount - 1;
          return (
            <RevisionBox
              key={`rev-${i}`}
              checked
              color={subjectColor}
              pending={pending}
              onClick={isLast ? onRemove : undefined}
              title={isLast ? "Uncheck to undo last revision" : `Revision ${i + 1}`}
            />
          );
        })}
        <RevisionBox
          key="rev-new"
          checked={false}
          color={subjectColor}
          pending={pending}
          onClick={onAdd}
          title="Mark a revision"
        />
      </div>
    </div>
  );
}

function RevisionBox({
  checked,
  color,
  pending,
  onClick,
  title,
}: {
  checked: boolean;
  color: string;
  pending: boolean;
  onClick?: () => void;
  title: string;
}) {
  const base =
    "flex size-5 items-center justify-center rounded-md shadow-sm ring-1 transition-colors";
  const look = checked ? "text-white ring-transparent" : "bg-card ring-border/70";
  const style = checked ? { backgroundColor: color } : undefined;
  const icon = (
    <Check size={12} strokeWidth={3} className={checked ? "" : "opacity-0"} />
  );

  // Static (display-only) box for earlier, already-logged revisions.
  if (!onClick) {
    return (
      <span className={`${base} ${look}`} style={style} title={title} aria-hidden>
        {icon}
      </span>
    );
  }

  return (
    <motion.button
      type="button"
      disabled={pending}
      onClick={onClick}
      whileHover={{ scale: 1.12, y: -1 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 500, damping: 16 }}
      title={title}
      aria-pressed={checked}
      className={`${base} ${look} cursor-pointer hover:ring-primary disabled:cursor-not-allowed disabled:opacity-50`}
      style={style}
    >
      {icon}
    </motion.button>
  );
}
