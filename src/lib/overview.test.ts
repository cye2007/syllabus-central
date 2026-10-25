import { describe, expect, it } from "vitest";
import { meetingDays, policyStatus } from "./overview";

describe("policyStatus", () => {
  it("not accepted is not_allowed", () => expect(policyStatus("Late work will not be accepted.")).toBe("not_allowed"));
  it("penalty is limited", () => expect(policyStatus("Late work loses 10% per day.")).toBe("limited"));
  it("plain allowance is allowed", () => expect(policyStatus("AI tools are allowed.")).toBe("allowed"));
  it("missing text is unclear", () => expect(policyStatus(null)).toBe("unclear"));
  it("vague text is unclear", () => expect(policyStatus("See the instructor.")).toBe("unclear"));
});

describe("meetingDays", () => {
  it("parses MWF", () => expect(meetingDays("MWF 10:00-10:50")).toEqual(["Mo", "We", "Fr"]));
  it("parses Tue/Thu", () => expect(meetingDays("Tuesday and Thursday 1pm")).toEqual(["Tu", "Th"]));
});

import { parseOfficeHours } from "./overview";
describe("parseOfficeHours", () => {
  it("reads MWF 2-3pm", () => {
    expect(parseOfficeHours("MWF 2-3pm, Room 101")).toMatchObject({ days: ["Mo", "We", "Fr"], start: 840, end: 900 });
  });
  it("reads Tue/Thu 24h range", () => {
    expect(parseOfficeHours("Tue/Thu 14:00-15:30")).toMatchObject({ days: ["Tu", "Th"], start: 840, end: 930 });
  });
  it("flags by appointment", () => {
    expect(parseOfficeHours("By appointment")?.byAppointment).toBe(true);
  });
  it("returns null for empty", () => { expect(parseOfficeHours("  ")).toBeNull(); });
  it("leaves time null when absent", () => {
    expect(parseOfficeHours("Mondays in my office")).toMatchObject({ days: ["Mo"], start: null, end: null });
  });
});
