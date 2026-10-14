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
    color: "#18181b",
    topics: [{ name: "CAL", durationMin: h(28, 0) }],
  },
  {
    name: "LA + POST",
    order: 2,
    color: "#27272a",
    topics: [{ name: "LA + POST", durationMin: h(61, 34) }],
  },
  {
    name: "DSA",
    order: 3,
    color: "#09090b",
    topics: [{ name: "DSA", durationMin: h(106, 0) }],
  },
  {
    name: "DBMS",
    order: 4,
    color: "#3f3f46",
    topics: [{ name: "DBMS", durationMin: h(34, 0) }],
  },
  {
    name: "ML",
    order: 5,
    color: "#18181b",
    topics: [{ name: "ML", durationMin: h(83, 52) }],
  },
  {
    name: "AI",
    order: 6,
    color: "#27272a",
    topics: [{ name: "AI", durationMin: h(39, 30) }],
  },
  {
    name: "APT",
    order: 7,
    color: "#09090b",
    topics: [{ name: "APT", durationMin: h(132, 2) }],
  },
];
