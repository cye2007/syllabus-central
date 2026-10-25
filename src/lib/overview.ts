export type PolicyStatus = "allowed" | "limited" | "not_allowed" | "unclear";

/** Classify a policy's text by keywords only. Anything ambiguous stays "unclear". */
export function policyStatus(text: string | null | undefined): PolicyStatus {
  if (!text) return "unclear";
  const t = text.toLowerCase();
  const no = /\b(not (be )?(accepted|allowed|permitted)|no late|prohibited|forbidden|will receive a zero|not tolerated|banned)\b/.test(t);
  const limited = /\b(penalty|deduct|deducted|per day|reduced|with permission|only (if|for|with)|limited|up to|cite|disclose|grace|excused|maximum of|\d+%)/.test(t);
  const yes = /\b(allowed|permitted|accepted|encouraged|may use|welcome)\b/.test(t);
  if (no && !limited) return "not_allowed";
  if (limited) return "limited";
  if (yes) return "allowed";
  return "unclear";
}

const DAY_PATTERNS: [string, RegExp][] = [
  ["Mo", /\b(mon(day)?s?|m)\b/i],
  ["Tu", /\b(tue(s(day)?)?s?|tu|t)\b/i],
  ["We", /\b(wed(nesday)?s?|w)\b/i],
  ["Th", /\b(thu(r(s(day)?)?)?s?|th|r)\b/i],
  ["Fr", /\b(fri(day)?s?|f)\b/i],
];

/** Detect weekday tokens like "MWF", "TTh", "Tue/Thu" in a meeting-time string. */
export function meetingDays(text: string | null | undefined): string[] {
  if (!text) return [];
  // Expand compact forms like MWF / TTh / TR
  const expanded = text.replace(/\b([MTWRF]|Th|Tu)+\b/g, (m) => m.replace(/(Th|Tu|[MTWRF])/g, " $1 "));
  return DAY_PATTERNS.filter(([, re]) => re.test(expanded)).map(([d]) => d);
}

export const ALL_DAYS = ["Mo", "Tu", "We", "Th", "Fr"];
