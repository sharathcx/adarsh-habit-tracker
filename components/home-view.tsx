"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  X,
  Check,
  CalendarClock,
  TriangleAlert,
  ChevronRight,
  Paperclip,
  Eye,
  Trash2,
  Upload,
  Download,
  Sigma,
  Calculator,
  Brain,
  BookOpen,
  Database,
  Network,
  Cpu,
  Code,
  LineChart,
  Workflow,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { ProgressRing } from "./progress-ring";
import { Celebrate } from "./celebrate";
import { Heatmap } from "./heatmap";
import { DayBoundaryRefresh } from "./day-boundary-refresh";
import { formatDuration } from "@/lib/planner";
import { compressImage } from "@/lib/compress-image";
import type {
  AppState,
  ClientSubject,
  ClientTopic,
  ClientSession,
  ClientNote,
} from "@/lib/state-service";

const SUBJECT_ICONS: Record<string, LucideIcon> = {
  CAL: Calculator,
  "LA + POST": Sigma,
  DSA: Network,
  DBMS: Database,
  ML: LineChart,
  AI: Cpu,
  APT: Brain,
};

function getSubjectIcon(name: string): LucideIcon {
  return SUBJECT_ICONS[name] ?? Sparkles;
}

type Props = { state: AppState };

const QUICK_LOG = [5, 15, 30, 60, 120];
const NOTE_REQUIRED_MIN = 20;

type TopicGroup = { section: string | null; topics: ClientTopic[] };

function groupTopicsBySection(topics: ClientTopic[]): TopicGroup[] {
  const groups: TopicGroup[] = [];
  for (const t of topics) {
    const last = groups[groups.length - 1];
    if (last && last.section === t.section) {
      last.topics.push(t);
    } else {
      groups.push({ section: t.section, topics: [t] });
    }
  }
  return groups;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function HomeView({ state }: Props) {
  const router = useRouter();
  const [pendingTopicId, setPendingTopicId] = useState<string | null>(null);
  const [uploadingTopicId, setUploadingTopicId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [celebrating, setCelebrating] = useState(false);
  const [celebratedDay, setCelebratedDay] = useState<string | null>(
    state.todayMinutes >= state.dailyTarget ? state.todayKey : null,
  );

  const todayPercent = useMemo(
    () => Math.min(100, (state.todayMinutes / state.dailyTarget) * 100),
    [state.todayMinutes, state.dailyTarget],
  );

  const logSession = (topicId: string, minutes: number) => {
    setPendingTopicId(topicId);
    startTransition(async () => {
      try {
        await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topicId, minutes }),
        });
        const nextTotal = state.todayMinutes + minutes;
        if (celebratedDay !== state.todayKey && nextTotal >= state.dailyTarget) {
          setCelebrating(true);
          setCelebratedDay(state.todayKey);
        }
        router.refresh();
      } finally {
        setPendingTopicId(null);
      }
    });
  };

  const deleteSession = (sessionId: string) => {
    startTransition(async () => {
      await fetch(`/api/sessions?id=${sessionId}`, { method: "DELETE" });
      router.refresh();
    });
  };

  const uploadNote = async (topicId: string, file: File): Promise<string | null> => {
    setUploadingTopicId(topicId);
    try {
      const fd = new FormData();
      fd.append("topicId", topicId);
      fd.append("file", file);
      const res = await fetch("/api/notes", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return data.error || `Upload failed (${res.status})`;
      }
      router.refresh();
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "Upload failed";
    } finally {
      setUploadingTopicId(null);
    }
  };

  const deleteNote = async (noteId: string): Promise<string | null> => {
    try {
      const res = await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return data.error || `Delete failed (${res.status})`;
      }
      router.refresh();
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "Delete failed";
    }
  };

  if (state.subjects.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">No syllabus yet</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Seed the syllabus to start tracking your study time.
        </p>
        <form action="/api/seed" method="POST" className="mt-6">
          <button className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90">
            Seed syllabus
          </button>
        </form>
      </div>
    );
  }

  const hitTarget = state.todayMinutes >= state.dailyTarget;

  return (
    <div className="mx-auto h-full max-w-6xl px-4 sm:px-6 lg:h-full lg:overflow-hidden">
      <DayBoundaryRefresh todayKey={state.todayKey} />
      <div className="flex flex-col gap-6 pb-24 pt-4 lg:h-full lg:flex-row lg:gap-6 lg:overflow-hidden lg:pb-4">
        {/* Left column — status */}
        <aside className="scrollbar-hide flex shrink-0 flex-col gap-5 lg:basis-[44%] lg:overflow-y-auto lg:pb-2 lg:pr-2">
          {/* Hero card */}
          <section className="relative shrink-0 overflow-hidden rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border/60">
            {/* Decorative blobs */}
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/15 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-amber-300/20 blur-3xl"
            />

            {/* Floating gradient orb */}
            <motion.div
              aria-hidden
              initial={{ opacity: 0, scale: 0.5, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 220, damping: 18 }}
              className="absolute right-5 top-5 z-10"
            >
              <motion.div
                animate={{
                  y: [0, -8, 0],
                  rotate: [-6, 6, -6],
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="relative flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg ring-4 ring-card"
                style={{
                  background:
                    "linear-gradient(135deg, #f97316 0%, #fb923c 35%, #fbbf24 70%, #fde68a 100%)",
                }}
              >
                <Sparkles size={18} className="text-white drop-shadow-sm" strokeWidth={2.5} />
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.6, 1], opacity: [0.7, 0, 0.7] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
                className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-amber-400"
              />
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: 1.2, ease: "easeOut" }}
                className="absolute -bottom-1 -left-1 h-2 w-2 rounded-full bg-primary"
              />
            </motion.div>

            <div className="relative flex flex-col items-center gap-5">
              <ProgressRing
                percent={todayPercent}
                label="today"
                size={180}
                sublabel={
                  hitTarget
                    ? "Target hit"
                    : `${formatDuration(state.dailyTarget - state.todayMinutes)} left today`
                }
              />
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-semibold leading-tight tracking-tight">
                  Today&apos;s the day{" "}
                  <motion.span
                    animate={{ rotate: [0, 18, -8, 18, 0] }}
                    transition={{
                      duration: 1.4,
                      repeat: Infinity,
                      repeatDelay: 4,
                      ease: "easeInOut",
                    }}
                    style={{ display: "inline-block", transformOrigin: "70% 70%" }}
                  >
                    👋
                  </motion.span>
                </h1>
                <p className="text-sm text-muted-foreground">
                  {hitTarget
                    ? "Daily target hit. Carry the streak into tomorrow."
                    : "Eat your 6 hours of lectures."}
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <StatChip icon={<Flame size={13} className="text-primary" />}>
                  <span className="tabular-nums">{state.streak}</span>
                  <span className="text-muted-foreground">day streak</span>
                </StatChip>
                <StatChip>
                  <span className="tabular-nums">{state.estDaysRemaining}</span>
                  <span className="text-muted-foreground">days needed</span>
                </StatChip>
                <StatChip>
                  <span className="tabular-nums">{state.overallPercent.toFixed(1)}%</span>
                  <span className="text-muted-foreground">syllabus</span>
                </StatChip>
              </div>
            </div>
          </section>

          <DeadlineCard state={state} />

          {state.todaySessions.length > 0 && (
            <section className="shrink-0 rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border/60">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Today
                </h2>
                <span className="text-xs text-muted-foreground">
                  {state.todaySessions.length}{" "}
                  {state.todaySessions.length === 1 ? "session" : "sessions"}
                </span>
              </div>
              <AnimatePresence initial={false}>
                <ul className="flex flex-col gap-2">
                  {state.todaySessions.map((s) => (
                    <SessionItem key={s._id} session={s} onDelete={() => deleteSession(s._id)} />
                  ))}
                </ul>
              </AnimatePresence>
            </section>
          )}

          <section className="shrink-0 rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border/60">
            <Heatmap days={state.heatmapDays} dailyTarget={state.dailyTarget} />
          </section>
        </aside>

        {/* Right column — subjects (scrollable) */}
        <section className="scrollbar-hide flex flex-1 flex-col gap-3 lg:basis-[56%] lg:overflow-y-auto lg:pb-2">
          <div className="sticky top-0 z-10 flex items-baseline justify-between bg-background/95 px-1 py-2 backdrop-blur">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Subjects
            </h2>
            <span className="tabular-nums text-xs text-muted-foreground">
              {formatDuration(state.doneMin)} of {formatDuration(state.totalMin)}
            </span>
          </div>

          {state.subjects.map((subject) => (
            <SubjectSection
              key={subject._id}
              subject={subject}
              pendingTopicId={pendingTopicId}
              uploadingTopicId={uploadingTopicId}
              onLog={logSession}
              onUploadNote={uploadNote}
              onDeleteNote={deleteNote}
            />
          ))}
        </section>
      </div>

      <Celebrate
        show={celebrating}
        dayNumber={state.streak + (state.todayMinutes >= state.dailyTarget ? 0 : 1)}
        onDismiss={() => setCelebrating(false)}
      />
    </div>
  );
}

/** "2026-11-10" -> "Nov 10". Fixed locale + UTC so server and client agree. */
function formatDeadline(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * The two numbers that decide whether the plan holds: days of work still in the
 * syllabus at the daily target, against days actually left on the calendar.
 */
function DeadlineCard({ state }: { state: AppState }) {
  const remainingMin = Math.max(0, state.totalMin - state.doneMin);
  const buffer = state.daysToDeadline - state.estDaysRemaining;
  const label = formatDeadline(state.deadlineKey);

  let tone: string;
  let icon: React.ReactNode;
  let verdict: string;

  if (remainingMin === 0) {
    tone = "bg-emerald-50 text-emerald-800 ring-emerald-500/30";
    icon = <Check size={13} className="mt-px shrink-0" strokeWidth={3} />;
    verdict = `Syllabus finished, ${state.daysToDeadline} days ahead of ${label}.`;
  } else if (state.daysToDeadline === 0) {
    tone = "bg-rose-50 text-rose-800 ring-rose-500/30";
    icon = <TriangleAlert size={13} className="mt-px shrink-0" />;
    verdict = `${label} has passed — ${state.estDaysRemaining} more days at ${formatDuration(state.dailyTarget)}/day to finish.`;
  } else if (buffer > 0) {
    tone = "bg-emerald-50 text-emerald-800 ring-emerald-500/30";
    icon = <Check size={13} className="mt-px shrink-0" strokeWidth={3} />;
    verdict = `On track — ${buffer} ${buffer === 1 ? "day" : "days"} of buffer at ${formatDuration(state.dailyTarget)}/day.`;
  } else if (buffer === 0) {
    tone = "bg-amber-50 text-amber-800 ring-amber-500/30";
    icon = <CalendarClock size={13} className="mt-px shrink-0" />;
    verdict = `Exactly on pace — every day up to ${label} has to hit ${formatDuration(state.dailyTarget)}.`;
  } else {
    tone = "bg-rose-50 text-rose-800 ring-rose-500/30";
    icon = <TriangleAlert size={13} className="mt-px shrink-0" />;
    verdict = `${-buffer} ${buffer === -1 ? "day" : "days"} short — needs ${formatDuration(
      state.requiredDailyMin ?? state.dailyTarget,
    )}/day to make ${label}.`;
  }

  return (
    <section className="shrink-0 rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border/60">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Finish by {label}
        </h2>
        <span className="tabular-nums text-xs text-muted-foreground">
          {formatDuration(remainingMin)} left
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-secondary/60 px-3 py-2.5">
          <div className="text-xl font-semibold tabular-nums">{state.estDaysRemaining}</div>
          <div className="text-[11px] leading-tight text-muted-foreground">
            days needed at {formatDuration(state.dailyTarget)}/day
          </div>
        </div>
        <div className="rounded-2xl bg-secondary/60 px-3 py-2.5">
          <div className="text-xl font-semibold tabular-nums">{state.daysToDeadline}</div>
          <div className="text-[11px] leading-tight text-muted-foreground">
            days left until {label}
          </div>
        </div>
      </div>

      <div className={`mt-3 flex items-start gap-1.5 rounded-2xl px-3 py-2 text-[11px] font-medium ring-1 ${tone}`}>
        {icon}
        <span>{verdict}</span>
      </div>
    </section>
  );
}

function StatChip({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <motion.span
      whileHover={{ scale: 1.05, y: -1 }}
      transition={{ type: "spring", stiffness: 400, damping: 18 }}
      className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium shadow-sm ring-1 ring-amber-200/40"
    >
      {icon}
      {children}
    </motion.span>
  );
}

function SessionItem({ session, onDelete }: { session: ClientSession; onDelete: () => void }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8, height: 0, marginTop: 0 }}
      transition={{ duration: 0.18 }}
      className="group flex items-center gap-3 rounded-2xl bg-secondary px-4 py-3 text-sm"
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: session.subjectColor }}
      />
      <span className="min-w-0 flex-1 truncate font-medium">{session.topicName}</span>
      <span className="shrink-0 tabular-nums text-muted-foreground">
        {formatDuration(session.minutes)}
      </span>
      <button
        onClick={onDelete}
        aria-label="Remove session"
        className="text-muted-foreground/50 opacity-0 transition group-hover:opacity-100 hover:text-foreground"
      >
        <X size={14} />
      </button>
    </motion.li>
  );
}

type SubjectSectionProps = {
  subject: ClientSubject;
  pendingTopicId: string | null;
  uploadingTopicId: string | null;
  onLog: (topicId: string, minutes: number) => void;
  onUploadNote: (topicId: string, file: File) => Promise<string | null>;
  onDeleteNote: (noteId: string) => Promise<string | null>;
};

function SubjectSection({
  subject,
  pendingTopicId,
  uploadingTopicId,
  onLog,
  onUploadNote,
  onDeleteNote,
}: SubjectSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const remainingTopics = subject.topics.filter((t) => !t.isComplete).length;
  const Icon = getSubjectIcon(subject.name);

  return (
    <motion.section
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 26 }}
      className="relative rounded-3xl p-5 shadow-sm ring-1 ring-border/60 transition-shadow hover:shadow-md"
      style={{
        backgroundColor: "var(--card)",
        backgroundImage: `radial-gradient(circle at top right, ${subject.color}22, transparent 60%)`,
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="group relative flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="flex min-w-0 items-center gap-3">
          <motion.span
            animate={{ rotate: expanded ? 90 : 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 26 }}
            className="shrink-0 text-muted-foreground/60 group-hover:text-foreground"
          >
            <ChevronRight size={14} />
          </motion.span>

          {/* Gradient icon block */}
          <motion.div
            whileHover={{ rotate: -4, scale: 1.06 }}
            transition={{ type: "spring", stiffness: 400, damping: 16 }}
            className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${subject.color} 0%, ${subject.color}cc 55%, ${subject.color}66 100%)`,
            }}
          >
            <Icon size={20} className="text-white drop-shadow-sm" strokeWidth={2.2} />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/40 via-transparent to-transparent"
            />
          </motion.div>

          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold tracking-tight">{subject.name}</h3>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              {remainingTopics} {remainingTopics === 1 ? "topic" : "topics"} ·{" "}
              {formatDuration(subject.totalMin)}
            </div>
          </div>
        </div>

        <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{subject.percent.toFixed(0)}%</span>
          <span className="ml-1 text-muted-foreground/70">
            · {formatDuration(subject.doneMin)}
          </span>
        </span>
      </button>

      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(100, subject.percent)}%`,
            backgroundColor: subject.color,
          }}
        />
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="topics"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="mt-4 flex flex-col gap-4 overflow-hidden"
          >
            {groupTopicsBySection(subject.topics).map((group, gi) => (
              <div key={`${group.section ?? "_"}-${gi}`} className="flex flex-col gap-2">
                {group.section && (
                  <div className="mt-1 flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
                    <span className="h-px w-3 bg-border" />
                    {group.section}
                  </div>
                )}
                {group.topics.map((t) => (
                  <TopicRow
                    key={t._id}
                    topic={t}
                    subjectColor={subject.color}
                    pending={pendingTopicId === t._id}
                    uploading={uploadingTopicId === t._id}
                    onLog={(min) => onLog(t._id, min)}
                    onUploadNote={(file) => onUploadNote(t._id, file)}
                    onDeleteNote={onDeleteNote}
                  />
                ))}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

type TopicRowProps = {
  topic: ClientTopic;
  subjectColor: string;
  pending: boolean;
  uploading: boolean;
  onLog: (minutes: number) => void;
  onUploadNote: (file: File) => Promise<string | null>;
  onDeleteNote: (noteId: string) => Promise<string | null>;
};

function TopicRow({
  topic,
  subjectColor,
  pending,
  uploading,
  onLog,
  onUploadNote,
  onDeleteNote,
}: TopicRowProps) {
  const remaining = Math.max(0, topic.durationMin - topic.doneMin);
  const timeMet = topic.doneMin >= topic.durationMin;
  const allButtons = QUICK_LOG.filter((m) => m <= Math.max(remaining, 15));

  const requiresNote = topic.durationMin > NOTE_REQUIRED_MIN;
  const hasNote = topic.notes.length > 0;
  const completeBlocked = requiresNote && !hasNote;
  const needsNote = timeMet && requiresNote && !hasNote; // "all time done but no note yet"

  const [notesOpen, setNotesOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const original = e.target.files?.[0];
    if (!original) return;
    setUploadError(null);

    const MAX_BYTES = 4 * 1024 * 1024; // ~4MB, safely under Vercel 4.5MB limit
    let toUpload = original;

    if (original.size > MAX_BYTES) {
      if (original.type.startsWith("image/")) {
        try {
          toUpload = await compressImage(original, MAX_BYTES);
        } catch {
          setUploadError("Could not compress this image. Try a different file.");
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }
        if (toUpload.size > MAX_BYTES) {
          setUploadError(
            `Image is still ${formatBytes(toUpload.size)} after compression. Try a smaller photo.`,
          );
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }
      } else {
        setUploadError(
          `File is ${formatBytes(original.size)}. Limit is 4 MB on this host. Compress the PDF (e.g. ilovepdf.com) and try again.`,
        );
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
    }

    const err = await onUploadNote(toUpload);
    if (err) setUploadError(err);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (noteId: string) => {
    const err = await onDeleteNote(noteId);
    if (err) setUploadError(err);
  };

  return (
    <motion.li
      layout
      className="rounded-2xl bg-secondary/60 px-4 py-3 transition-colors"
    >
      <div
        className="flex items-center gap-3"
        style={{ opacity: topic.isComplete ? 0.6 : 1 }}
      >
        <div className="min-w-0 flex-1">
          <div
            className="truncate text-[14px] font-medium"
            style={{ textDecoration: topic.isComplete ? "line-through" : undefined }}
          >
            {topic.name}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, topic.percent)}%`,
                  backgroundColor: subjectColor,
                }}
              />
            </div>
            <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
              {formatDuration(topic.doneMin)}/{formatDuration(topic.durationMin)}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {/* Quick-log buttons: only when time isn't already met */}
          {!timeMet &&
            allButtons.map((m) => (
              <motion.button
                key={m}
                disabled={pending}
                onClick={() => onLog(Math.min(m, remaining || m))}
                whileHover={{ scale: 1.08, y: -1 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: "spring", stiffness: 500, damping: 18 }}
                className="rounded-full bg-card px-2.5 py-1 text-[11px] font-medium tabular-nums text-muted-foreground shadow-sm ring-1 ring-border/60 transition-colors hover:bg-primary hover:text-primary-foreground hover:ring-primary disabled:opacity-50"
                title={`Log ${formatDuration(m)}`}
              >
                +{m < 60 ? `${m}m` : `${m / 60}h`}
              </motion.button>
            ))}

          {/* Notes button: always visible, amber-emphasized when a note is required */}
          <motion.button
            type="button"
            onClick={() => setNotesOpen((v) => !v)}
            whileHover={{ scale: 1.08, y: -1 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 500, damping: 18 }}
            className={`relative rounded-full px-2.5 py-1 text-[11px] shadow-sm ring-1 transition-colors ${
              notesOpen
                ? "bg-primary text-primary-foreground ring-primary"
                : needsNote
                  ? "bg-amber-100 text-amber-800 ring-amber-500/60 hover:bg-amber-200"
                  : "bg-card text-muted-foreground ring-border/60 hover:bg-secondary"
            }`}
            title={
              needsNote
                ? "Note required — upload to mark complete"
                : hasNote
                  ? `${topic.notes.length} note(s)`
                  : "Upload notes"
            }
          >
            <Paperclip size={12} />
            {hasNote && (
              <span className="ml-1 tabular-nums text-[10px] font-medium">
                {topic.notes.length}
              </span>
            )}
          </motion.button>

          {/* Right-side state: green check (truly complete) or ✓ button (still progressing) */}
          {topic.isComplete ? (
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: subjectColor }}
            >
              <Check size={12} strokeWidth={3} />
            </span>
          ) : !timeMet ? (
            <motion.button
              disabled={pending || completeBlocked}
              onClick={() => onLog(remaining || topic.durationMin)}
              whileHover={{ scale: 1.12, rotate: completeBlocked ? 0 : -8 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 500, damping: 14 }}
              className="rounded-full bg-primary px-2.5 py-1 text-[11px] text-primary-foreground shadow-sm transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-60"
              title={completeBlocked ? "Upload a note first" : "Mark complete"}
            >
              <Check size={12} />
            </motion.button>
          ) : null}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {notesOpen && (
          <motion.div
            key="notes"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="mt-3 overflow-hidden border-t border-border pt-3"
          >
            {requiresNote && !hasNote && (
              <p className="mb-2 rounded-xl bg-primary/10 px-3 py-2 text-[11px] text-primary">
                Topic is longer than {NOTE_REQUIRED_MIN}m — upload a note to enable completion.
              </p>
            )}

            {topic.notes.length > 0 && (
              <ul className="mb-3 flex flex-col gap-1.5">
                {topic.notes.map((n) => (
                  <NoteRow key={n._id} note={n} onDelete={() => handleDelete(n._id)} />
                ))}
              </ul>
            )}

            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-card px-4 py-2 text-[12px] font-medium text-muted-foreground shadow-sm ring-1 ring-border/60 transition hover:bg-primary hover:text-primary-foreground hover:ring-primary">
              <Upload size={12} />
              <span>{uploading ? "Uploading…" : "Upload note (PDF / image)"}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/*"
                disabled={uploading}
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {uploadError && (
              <p className="mt-2 text-[11px] text-destructive">{uploadError}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

function NoteRow({ note, onDelete }: { note: ClientNote; onDelete: () => void }) {
  return (
    <li className="group flex items-center gap-2 rounded-xl bg-card px-3 py-2 text-[12px] ring-1 ring-border/60">
      <Paperclip size={11} className="text-primary" />
      <a
        href={`/api/notes/${note._id}/file`}
        target="_blank"
        rel="noreferrer"
        className="min-w-0 flex-1 truncate font-medium hover:text-primary hover:underline"
      >
        {note.filename}
      </a>
      <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
        {formatBytes(note.sizeBytes)}
      </span>
      <a
        href={`/api/notes/${note._id}/file`}
        target="_blank"
        rel="noreferrer"
        className="text-muted-foreground/70 transition hover:text-foreground"
        title="View in browser"
      >
        <Eye size={12} />
      </a>
      <a
        href={`/api/notes/${note._id}/file?download=1`}
        download={note.filename}
        className="text-muted-foreground/70 transition hover:text-foreground"
        title="Download"
      >
        <Download size={12} />
      </a>
      <button
        onClick={onDelete}
        className="text-muted-foreground/40 opacity-0 transition group-hover:opacity-100 hover:text-destructive"
        title="Delete"
      >
        <Trash2 size={12} />
      </button>
    </li>
  );
}
