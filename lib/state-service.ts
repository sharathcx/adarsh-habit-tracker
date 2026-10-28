import { connectDB } from "@/lib/db";
import { Subject } from "@/lib/models/Subject";
import { Topic } from "@/lib/models/Topic";
import { StudySession } from "@/lib/models/StudySession";
import { studyDayKey, addDaysToKey, daysBetweenKeys } from "@/lib/day";
import { seedDatabase } from "@/lib/seed";


export const DAILY_TARGET_MIN = 420;
export const NOTE_REQUIRED_MIN = 20;

/**
 * The journey start date (Day 1). Technicals alone are studied from this date.
 */
export const START_KEY = "2026-10-27";

/**
 * The date technicals are meant to be finished by, as a study-day key.
 * General Aptitude starts after this date.
 */
export const DEADLINE_KEY = "2026-12-15";

export type ClientNote = {
  _id: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;
};

export type ClientTopic = {
  _id: string;
  name: string;
  durationMin: number;
  doneMin: number;
  percent: number;
  isComplete: boolean;
  order: number;
  section: string | null;
  notes: ClientNote[];
  revisionCount: number;
  lastRevisedAt: string | null;
};

export type ClientSubject = {
  _id: string;
  name: string;
  color: string;
  order: number;
  totalMin: number;
  doneMin: number;
  percent: number;
  topics: ClientTopic[];
};

export type ClientSession = {
  _id: string;
  topicId: string;
  topicName: string;
  subjectName: string;
  subjectColor: string;
  minutes: number;
  completedAt: string;
};

export type HeatmapDay = {
  date: string;
  dayNumber: number;
  minutes: number;
  isToday: boolean;
  isFuture: boolean;
};

export type AppState = {
  subjects: ClientSubject[];
  todaySessions: ClientSession[];
  todayMinutes: number;
  totalMin: number;
  doneMin: number;
  overallPercent: number;
  streak: number;
  dailyTarget: number;
  /** `YYYY-MM-DD` of the study day this state was built for (rolls at 7am IST). */
  todayKey: string;
  estDaysRemaining: number;
  /** `YYYY-MM-DD` the journey started (Day 1). */
  startKey: string;
  /** `YYYY-MM-DD` the syllabus is meant to be finished by. */
  deadlineKey: string;
  /** Study days from today through the deadline, inclusive. 0 once it passes. */
  daysToDeadline: number;
  /** Minutes/day needed to finish by the deadline, or null when that is moot. */
  requiredDailyMin: number | null;
  heatmapDays: HeatmapDay[];
};

type LeanNote = {
  _id: unknown;
  filename: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: Date;
};

type LeanRevision = {
  _id: unknown;
  revisedAt: Date;
};

type LeanTopic = {
  _id: unknown;
  subjectId: unknown;
  name: string;
  durationMin: number;
  order: number;
  section: string | null;
  notes: LeanNote[];
  revisions?: LeanRevision[];
};

type LeanSubject = {
  _id: unknown;
  name: string;
  color: string;
  order: number;
};

type LeanSession = {
  _id: unknown;
  topicId: unknown;
  minutes: number;
  completedAt: Date;
};

export async function getAppState(): Promise<AppState> {
  await connectDB();
  let [subjects, topics, sessions] = await Promise.all([
    Subject.find().sort({ order: 1 }).lean<LeanSubject[]>(),
    Topic.find().sort({ order: 1 }).lean<LeanTopic[]>(),
    StudySession.find().lean<LeanSession[]>(),
  ]);

  if (subjects.length === 0) {
    await seedDatabase(false);
    [subjects, topics, sessions] = await Promise.all([
      Subject.find().sort({ order: 1 }).lean<LeanSubject[]>(),
      Topic.find().sort({ order: 1 }).lean<LeanTopic[]>(),
      StudySession.find().lean<LeanSession[]>(),
    ]);
  }


  const minutesByTopic = new Map<string, number>();
  const minutesByDate = new Map<string, number>();
  const todayKey = studyDayKey(new Date());

  // Only sessions from START_KEY onwards count toward this study journey
  const activeSessions = sessions.filter(
    (s) => studyDayKey(s.completedAt) >= START_KEY,
  );

  for (const s of activeSessions) {
    const tKey = String(s.topicId);
    minutesByTopic.set(tKey, (minutesByTopic.get(tKey) ?? 0) + s.minutes);
    const dKey = studyDayKey(s.completedAt);
    minutesByDate.set(dKey, (minutesByDate.get(dKey) ?? 0) + s.minutes);
  }

  const topicsBySubject = new Map<string, ClientTopic[]>();
  for (const t of topics) {
    const subjectKey = String(t.subjectId);
    const doneMin = Math.min(minutesByTopic.get(String(t._id)) ?? 0, t.durationMin);
    const noteCount = (t.notes ?? []).length;
    const requiresNote = t.durationMin > NOTE_REQUIRED_MIN;
    const timeMet = doneMin >= t.durationMin;
    const revisions = t.revisions ?? [];
    const lastRevisedAt =
      revisions.length > 0
        ? new Date(
            Math.max(...revisions.map((r) => new Date(r.revisedAt).getTime())),
          ).toISOString()
        : null;
    const list = topicsBySubject.get(subjectKey) ?? [];
    list.push({
      _id: String(t._id),
      name: t.name,
      durationMin: t.durationMin,
      doneMin,
      percent: t.durationMin === 0 ? 0 : (doneMin / t.durationMin) * 100,
      isComplete: timeMet && (!requiresNote || noteCount > 0),
      order: t.order,
      section: t.section ?? null,
      notes: (t.notes ?? []).map((n) => ({
        _id: String(n._id),
        filename: n.filename,
        contentType: n.contentType,
        sizeBytes: n.sizeBytes,
        uploadedAt: new Date(n.uploadedAt).toISOString(),
      })),
      revisionCount: revisions.length,
      lastRevisedAt,
    });
    topicsBySubject.set(subjectKey, list);
  }

  const clientSubjects: ClientSubject[] = subjects.map((s) => {
    const subjectTopics = topicsBySubject.get(String(s._id)) ?? [];
    subjectTopics.sort((a, b) => a.order - b.order);
    const totalMin = subjectTopics.reduce((sum, t) => sum + t.durationMin, 0);
    const doneMin = subjectTopics.reduce((sum, t) => sum + t.doneMin, 0);
    return {
      _id: String(s._id),
      name: s.name,
      color: s.color,
      order: s.order,
      totalMin,
      doneMin,
      percent: totalMin === 0 ? 0 : (doneMin / totalMin) * 100,
      topics: subjectTopics,
    };
  });

  const topicLookup = new Map<string, { name: string; subjectName: string; subjectColor: string }>();
  for (const s of clientSubjects) {
    for (const t of s.topics) {
      topicLookup.set(t._id, { name: t.name, subjectName: s.name, subjectColor: s.color });
    }
  }

  const todaySessions: ClientSession[] = activeSessions
    .filter((s) => studyDayKey(s.completedAt) === todayKey)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .map((s) => {
      const meta = topicLookup.get(String(s.topicId));
      return {
        _id: String(s._id),
        topicId: String(s.topicId),
        topicName: meta?.name ?? "Unknown",
        subjectName: meta?.subjectName ?? "",
        subjectColor: meta?.subjectColor ?? "#999",
        minutes: s.minutes,
        completedAt: new Date(s.completedAt).toISOString(),
      };
    });

  const todayMinutes = minutesByDate.get(todayKey) ?? 0;

  let streak = 0;
  let cursorKey = todayKey;
  let isFirstIter = true;
  while (true) {
    if (cursorKey < START_KEY) break;
    const targetForDate = DAILY_TARGET_MIN;
    const mins = minutesByDate.get(cursorKey) ?? 0;
    if (mins >= targetForDate) {
      streak++;
      cursorKey = addDaysToKey(cursorKey, -1);
    } else if (isFirstIter) {
      cursorKey = addDaysToKey(cursorKey, -1);
      isFirstIter = false;
    } else {
      break;
    }
    if (streak > 365) break;
  }

  const totalMin = clientSubjects.reduce((s, sub) => s + sub.totalMin, 0);
  const doneMin = clientSubjects.reduce((s, sub) => s + sub.doneMin, 0);

  const remainingMin = Math.max(0, totalMin - doneMin);
  const estDaysRemaining = Math.ceil(remainingMin / DAILY_TARGET_MIN);

  // Days still available, counting today: today's target is still live, and
  // estDaysRemaining counts today too, so the two numbers compare like for
  // like. Both shrink as minutes land, which is what makes the gap meaningful.
  const daysToDeadline = Math.max(0, daysBetweenKeys(todayKey, DEADLINE_KEY) + 1);
  const requiredDailyMin =
    remainingMin > 0 && daysToDeadline > 0 ? Math.ceil(remainingMin / daysToDeadline) : null;

  // Day 1 starts on START_KEY ("2026-10-27") for technicals
  const journeyStartKey = START_KEY;
  const daysPassedBeforeToday = Math.max(0, daysBetweenKeys(journeyStartKey, todayKey));

  // Dynamic total journey days: past days elapsed + remaining days needed.
  // If a day is missed, daysPassedBeforeToday increases without doneMin advancing,
  // causing totalJourneyDays (and heatmap boxes) to automatically increase by +1!
  const totalJourneyDays = Math.max(1, daysPassedBeforeToday + Math.max(0, estDaysRemaining));

  const heatmapDays: HeatmapDay[] = [];
  for (let i = 0; i < totalJourneyDays; i++) {
    const key = addDaysToKey(journeyStartKey, i);
    heatmapDays.push({
      date: key,
      dayNumber: i + 1,
      minutes: minutesByDate.get(key) ?? 0,
      isToday: key === todayKey,
      isFuture: key > todayKey,
    });
  }

  return {
    subjects: clientSubjects,
    todaySessions,
    todayMinutes,
    totalMin,
    doneMin,
    overallPercent: totalMin === 0 ? 0 : (doneMin / totalMin) * 100,
    streak,
    dailyTarget: DAILY_TARGET_MIN,
    todayKey,
    estDaysRemaining,
    startKey: START_KEY,
    deadlineKey: DEADLINE_KEY,
    daysToDeadline,
    requiredDailyMin,
    heatmapDays,
  };
}
