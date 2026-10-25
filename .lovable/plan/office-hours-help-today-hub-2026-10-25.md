# Office Hours & Help Today hub

## What you'll see
A new "Help today" panel near the top of the semester overview that answers: "Who can I get help from today, when, and where?"

- **Today's office hours**: one row per class whose syllabus lists office hours on today's weekday. Each row shows the course color and code, the professor or TA name, the time and place (or Zoom link) exactly as the syllabus says it, and the email.
- **Happening now / later today / ended**: a small status tag based on the time, when the time can be read clearly. If the time is vague, no status is shown.
- **Rest of the week**: a collapsed list grouped by day (Mon–Fri), so you can plan ahead.
- **"By appointment" and unclear entries**: listed separately as "Ask to schedule", with the email, rather than guessed onto a day.
- **No office hours in the syllabus**: the class shows "Not in syllabus". Nothing is made up.
- **Quick actions**: an "Email" button that opens a pre-filled message ("[Course code] office hours question"). Hovering any detail still shows "View in syllabus · page N" and clicking it opens that page.
- **Empty days**: "No office hours today". The next available slot is shown instead.

On a phone, the panel stacks full-width above "Coming up".

## Rules
- The syllabus text is the only source. Days and times are only read from it. If the text can't be read clearly, it goes in "Ask to schedule".
- The panel uses the same sharp-corner, light-only, sans-serif style as the rest of the site.

## Technical details
- Add `parseOfficeHours(text)` to `src/lib/overview.ts`. It reuses the `meetingDays` day detection and adds a time-range parser ("2–3:30pm", "14:00-15:00"). It returns `{ days, start, end, raw, byAppointment }`, with null for any field it can't read.
- Add unit tests in `src/lib/overview.test.ts`: MWF 2–3pm, Tue/Thu ranges, "by appointment", empty text, and text with no time.
- Read from `overview.office_hours` and `overview.tas` (`{value, page}`) on the existing course records. Contact comes from `overview.email`. No database changes.
- New component `src/components/atlas/HelpToday.tsx`, rendered in `dashboard.tsx` above the deadlines area. It uses `SourceLink` for citations, and the "now / later / ended" status refreshes every minute.
