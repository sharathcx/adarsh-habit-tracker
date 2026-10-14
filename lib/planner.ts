export type PlannerTopic = {
  topicId: string;
  name: string;
  subjectName: string;
  subjectColor: string;
  subjectOrder: number;
  topicOrder: number;
  durationMin: number;
};

export type PlannedSegment = {
  topicId: string;
  name: string;
  subjectName: string;
  subjectColor: string;
  minutes: number;
  isSplit: boolean;
  partLabel: string | null;
};

export type PlannedDay = {
  dayNumber: number;
  segments: PlannedSegment[];
  totalMinutes: number;
};

export const DAILY_TARGET_MIN = 360;
const OVERFLOW_TOLERANCE = 15;

export function generatePlan(
  topics: PlannerTopic[],
  dailyTargetMin: number = DAILY_TARGET_MIN,
): PlannedDay[] {
  const ordered = [...topics].sort((a, b) => {
    if (a.subjectOrder !== b.subjectOrder) return a.subjectOrder - b.subjectOrder;
    return a.topicOrder - b.topicOrder;
  });

  const days: PlannedDay[] = [];
  let currentDay: PlannedDay = { dayNumber: 1, segments: [], totalMinutes: 0 };

  const pushDay = () => {
    if (currentDay.segments.length > 0) {
      days.push(currentDay);
      currentDay = { dayNumber: currentDay.dayNumber + 1, segments: [], totalMinutes: 0 };
    }
  };

  for (const topic of ordered) {
    const totalParts = Math.ceil(topic.durationMin / dailyTargetMin);
    let remaining = topic.durationMin;
    let partNumber = 0;

    while (remaining > 0) {
      const budget = dailyTargetMin - currentDay.totalMinutes;

      if (budget <= 0) {
        pushDay();
        continue;
      }

      if (remaining <= budget + OVERFLOW_TOLERANCE) {
        const isSplit = totalParts > 1;
        partNumber++;
        currentDay.segments.push({
          topicId: topic.topicId,
          name: topic.name,
          subjectName: topic.subjectName,
          subjectColor: topic.subjectColor,
          minutes: remaining,
          isSplit,
          partLabel: isSplit ? `${partNumber}/${totalParts}` : null,
        });
        currentDay.totalMinutes += remaining;
        remaining = 0;

        if (currentDay.totalMinutes >= dailyTargetMin - OVERFLOW_TOLERANCE) {
          pushDay();
        }
      } else {
        partNumber++;
        currentDay.segments.push({
          topicId: topic.topicId,
          name: topic.name,
          subjectName: topic.subjectName,
          subjectColor: topic.subjectColor,
          minutes: budget,
          isSplit: true,
          partLabel: `${partNumber}/${totalParts}`,
        });
        currentDay.totalMinutes += budget;
        remaining -= budget;
        pushDay();
      }
    }
  }

  pushDay();
  return days;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
