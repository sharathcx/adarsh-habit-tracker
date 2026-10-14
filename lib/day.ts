/**
 * The study day runs 07:00 IST → 06:59 IST the next morning. A session logged
 * at 2am still counts toward the previous evening's target, and everything —
 * today's minutes, the streak, the heatmap — rolls over at 7am IST.
 *
 * Timestamps stay stored as real UTC instants; this module only decides which
 * day-bucket an instant falls into. The 7am arithmetic is pure epoch-ms offset
 * math, so it gives identical answers on the server (UTC on Vercel) and in the
 * browser (whatever the user's machine is set to).
 *
 * HISTORY IS NOT REWRITTEN. Before the cutover below, the app bucketed by the
 * host's own calendar date, and instants before it keep that bucket exactly —
 * so past days, the streak and the heatmap are untouched by this change. The
 * two rules only ever disagree about the 05:30–07:00 IST window, and the
 * cutover is placed at 05:30 IST on the changeover day, which is precisely
 * where the old rule was about to end a day anyway. The buckets therefore join
 * end to end: no day is split, duplicated, or lost across the seam.
 */

// India is a fixed UTC+05:30 with no DST, so a plain offset is exact.
export const IST_OFFSET_MIN = 5 * 60 + 30;
export const DAY_START_HOUR = 7;

const MS_PER_MIN = 60_000;
const MS_PER_DAY = 86_400_000;

/**
 * 2026-09-03T00:00:00Z — 05:30 IST on the day the 7am reset was introduced,
 * i.e. the last day boundary the old rule would have produced. Instants before
 * this keep their original bucket; from here on days end at 07:00 IST.
 */
export const RESET_CUTOVER_MS = Date.UTC(2026, 8, 3, 0, 0, 0);

// Shift an instant so that 07:00 IST lands on 00:00 UTC — then the UTC
// calendar date of the shifted instant *is* the study-day key.
const SHIFT_MS = (IST_OFFSET_MIN - DAY_START_HOUR * 60) * MS_PER_MIN;

function utcMsToKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate(),
  ).padStart(2, "0")}`;
}

/**
 * The pre-cutover rule: the host's calendar date. The app is served from
 * Vercel, whose runtime is UTC, so every historical bucket the user has been
 * looking at is a UTC date — spelling that out here reproduces their history
 * exactly and keeps server and browser in agreement.
 */
function legacyKey(ms: number): string {
  return utcMsToKey(ms);
}

function keyToUtcMs(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** `YYYY-MM-DD` of the study day an instant belongs to. */
export function studyDayKey(date: Date | string | number): string {
  const ms = date instanceof Date ? date.getTime() : new Date(date).getTime();
  if (ms < RESET_CUTOVER_MS) return legacyKey(ms);
  return utcMsToKey(ms + SHIFT_MS);
}

export function addDaysToKey(key: string, days: number): string {
  return utcMsToKey(keyToUtcMs(key) + days * MS_PER_DAY);
}

export function daysBetweenKeys(from: string, to: string): number {
  return Math.round((keyToUtcMs(to) - keyToUtcMs(from)) / MS_PER_DAY);
}

/** Weekday index (0 = Sunday) for a `YYYY-MM-DD` key. */
export function weekdayOfKey(key: string): number {
  return new Date(keyToUtcMs(key)).getUTCDay();
}

/**
 * The instant the study day containing `now` ends — normally the next 07:00
 * IST. A day can only ever end on a UTC midnight (old rule) or a 07:00 IST
 * mark (new rule), so this walks those candidates in order and returns the
 * first one that actually changes the key. That keeps it correct across the
 * cutover, where the day in progress is stretched to 25½ hours and the old
 * rule's midnight passes without ending it.
 */
export function nextDayBoundary(now: Date): Date {
  const nowMs = now.getTime();
  const today = studyDayKey(nowMs);

  const utcMidnight = Math.floor(nowMs / MS_PER_DAY) * MS_PER_DAY;
  const istMorning = Math.floor((nowMs + SHIFT_MS) / MS_PER_DAY) * MS_PER_DAY - SHIFT_MS;

  const candidates: number[] = [];
  for (let i = 1; i <= 2; i++) {
    candidates.push(utcMidnight + i * MS_PER_DAY, istMorning + i * MS_PER_DAY);
  }
  candidates.sort((a, b) => a - b);

  for (const t of candidates) {
    if (t > nowMs && studyDayKey(t) !== today) return new Date(t);
  }
  return new Date(nowMs + MS_PER_DAY); // unreachable — every day ends
}
