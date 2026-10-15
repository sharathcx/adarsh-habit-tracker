export const GENERAL_APTITUDE_SUBJECT_NAMES = new Set([
  "APT",
  "GA",
  "General Aptitude",
  "Quantitative Aptitude",
  "Reasoning",
  "Verbal Aptitude",
]);

/**
 * Returns true if the given subject name corresponds to General Aptitude (GA / APT).
 */
export function isGeneralAptitudeSubject(name: string): boolean {
  if (!name) return false;
  const trimmed = name.trim();
  if (GENERAL_APTITUDE_SUBJECT_NAMES.has(trimmed)) return true;
  const upper = trimmed.toUpperCase();
  if (upper === "APT" || upper === "GA" || upper === "GEN APT") return true;
  const lower = trimmed.toLowerCase();
  return lower.includes("aptitude") || lower.includes("general aptitude");
}
