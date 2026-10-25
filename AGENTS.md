<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## CourseAtlas architecture
- Syllabus AI (extraction + search) lives in `src/lib/ai.functions.ts` server functions using Gemini via the Lovable AI Gateway (`src/lib/gemini.server.ts`); keys stay server-side.
- Extracted facts store `{value, page}` or `page` fields so every fact links back to its PDF page; never fabricate values — use null.
- Issues/conflicts are stored in `course_issues` and resolved only by the user; never auto-resolve.
- Client data reads go through react-query options in `src/lib/courses.ts` with RLS-scoped tables.
