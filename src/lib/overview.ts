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

export type OfficeHours = { days: string[]; start: number | null; end: number | null; raw: string; byAppointment: boolean };

function toMin(h: number, m: number, ap: string | undefined, fallbackAp?: string) {
  const a = (ap || fallbackAp || "").toLowerCase();
  if (a.startsWith("p") && h < 12) h += 12;
  if (a.startsWith("a") && h === 12) h = 0;
  return h * 60 + m;
}

/** Parse office-hours text. Never guesses: unreadable fields stay null. */
export function parseOfficeHours(text: string | null | undefined): OfficeHours | null {
  if (!text || !text.trim()) return null;
  const byAppointment = /appointment|by request|email to schedule|arrange/i.test(text);
  const days = meetingDays(text);
  const m = text.match(/(\d{1,2})(?::(\d{2}))?\s*([ap]\.?m\.?)?\s*(?:-|–|—|to)\s*(\d{1,2})(?::(\d{2}))?\s*([ap]\.?m\.?)?/i);
  let start: number | null = null, end: number | null = null;
  if (m) {
    const ap2 = m[6];
    const has24 = !m[3] && !ap2 && (Number(m[1]) > 12 || Number(m[4]) > 12);
    if (m[3] || ap2 || has24) {
      start = toMin(Number(m[1]), Number(m[2] ?? 0), m[3], has24 ? undefined : ap2);
      end = toMin(Number(m[4]), Number(m[5] ?? 0), ap2, has24 ? undefined : m[3]);
      if (start > end && !m[3] && ap2) start -= 12 * 60; // e.g. "11-1pm"
      if (start < 0 || end <= start) { start = null; end = null; }
    }
  }
  return { days, start, end, raw: text, byAppointment };
}

export function fmtMin(m: number) {
  const h = Math.floor(m / 60), mm = m % 60;
  return `${((h + 11) % 12) + 1}${mm ? `:${String(mm).padStart(2, "0")}` : ""}${h >= 12 ? "pm" : "am"}`;
}
