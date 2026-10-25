# Hover-to-reveal syllabus citations

## What changes
- The grey "p. 1" tags next to details go away everywhere: semester overview, course pages, calendar, search answers and issues.
- Instead, each detail that came from a syllabus gets a faint dotted underline. Hovering it shows a small tooltip: "View in syllabus · page 1".
- Clicking the detail (or the tooltip) opens the syllabus at that page, the same as the old tag did.
- On phones there is no hover, so tapping the detail shows the same tooltip, and tapping it again opens the page.
- If no page is known, the tooltip says "Page not found in syllabus" and nothing opens. No page number is ever guessed.
- Keyboard users can tab to a detail and press Enter to open the page.

## Technical details
- Add a `SourceLink` wrapper in `src/components/atlas/SourceViewer.tsx` that wraps its children, styles them with a dotted underline on hover, and uses the existing shadcn Tooltip plus `useSource().open`.
- Keep the `SourceChip` export as a thin alias for now, then replace every usage (in the overview, course page, calendar, search and issues files) by wrapping the cited value in `SourceLink`.
- Where a chip sat alone with no adjacent text (e.g. policy popovers, issue references), wrap the title/heading text instead.
