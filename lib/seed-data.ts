export type SeedSubject = {
  name: string;
  order: number;
  color: string;
  topics: { name: string; durationMin: number; section?: string }[];
};

const h = (hours: number, minutes = 0) => hours * 60 + minutes;

export const SEED_SUBJECTS: SeedSubject[] = [
  {
    name: "CAL",
    order: 1,
    color: "#f59e0b",
    topics: [{ name: "CAL", durationMin: h(28, 0) }],
  },
  {
    name: "LA + POST",
    order: 2,
    color: "#8b5cf6",
    topics: [{ name: "LA + POST", durationMin: h(61, 34) }],
  },
  {
    name: "DSA",
    order: 3,
    color: "#3b82f6",
    topics: [{ name: "DSA", durationMin: h(106, 0) }],
  },
  {
    name: "DBMS",
    order: 4,
    color: "#10b981",
    topics: [{ name: "DBMS", durationMin: h(34, 0) }],
  },
  {
    name: "ML",
    order: 5,
    color: "#ec4899",
    topics: [{ name: "ML", durationMin: h(83, 52) }],
  },
  {
    name: "AI",
    order: 6,
    color: "#06b6d4",
    topics: [{ name: "AI", durationMin: h(39, 30) }],
  },
  {
    name: "APT",
    order: 7,
    color: "#f97316",
    topics: [{ name: "APT", durationMin: h(132, 2) }],
  },
];
