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
