# Semester overview: aligned course columns

## Goal
Keep the visual feel of course cards, but line up the same type of information across every class, so comparing classes is as easy as reading across one row.

## Layout
```text
              | CS 101 (blue)   | MATH 220 (green) | HIST 105 (amber)
--------------+-----------------+------------------+-----------------
 Professor    | avatar + name   | avatar + name    | avatar + name
 Meets        | M W F pills     | T Th pills       | M W pills
              | 10:00-10:50     | 1:00-2:15        | 3:00-4:15
 Location     | pin + room      | pin + room       | -- not listed
 Office hours | small chip      | small chip       | small chip
 Grading      | stacked bar     | stacked bar      | stacked bar
 Late work    | green/amber/red | ...              | ...
 Attendance   | status dot      | ...              | ...
 AI use       | status dot      | ...              | ...
 Next due     | date badge      | date badge       | date badge
```

- Each class is a soft column card with its course color on top; the row labels sit in a narrow left rail with icons.
- Every row has the same height across all cards, so professor, time, location, etc. line up exactly.
- Visual cues instead of sentences: weekday pills for meeting days, a colored grading bar, traffic-light dots for policies (allowed / limited / not allowed / unclear). Clicking a cue opens the full syllabus text with its page link.
- Missing info shows a muted "Not in syllabus" dash, never a made-up value.
- Rows can be shown or hidden with small toggle chips above the grid (e.g. hide Office hours).
- Many classes: the grid scrolls sideways with the row labels pinned on the left; course headers stay visible while scrolling down.
- Phone: switches to one row type at a time ("Professor", "Meets"...) chosen from a chip bar, listing every class beneath it, so comparison still works on a small screen.
- Upcoming deadlines, conflicts, and workload sections below stay as they are.

## Technical details
- Rebuild the comparison section in `src/routes/_authenticated/dashboard.tsx` using CSS grid with a shared row template (`grid-template-rows` per field, `subgrid` for each course column) so heights align.
- Policy status derived only from extracted text with simple keyword rules; anything ambiguous shows "unclear".
- Sticky first column and sticky header via `position: sticky`; horizontal overflow container.
- Uses existing course color tokens and data from `src/lib/courses.ts`; no backend changes.
