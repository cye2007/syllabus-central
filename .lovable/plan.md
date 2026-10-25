# Course assistant chat on each course page

## What students get
- An "Ask about this course" panel on every course page. It opens as a side panel on computers and a full screen on phones.
- Answers come from that course's syllabus, such as deadlines, grading, policies and contacts. When a fact comes from the syllabus, the answer names the page and links to it, the same way the rest of the app does.
- Advice is allowed and labeled as advice. Examples: how to plan for the midterm, which assignments carry the most weight, or when to visit office hours. Advice must never invent syllabus facts. If the syllabus doesn't say something, the answer says "Not in syllabus" and suggests asking the professor.
- Separate conversations for each course: a list of past chats, a "New chat" button, and each chat has its own link, so reloading keeps it open. Chats are saved to the student's account and only they can see them.
- Suggested starter questions, such as "What's due this week?", "How is my grade calculated?" and "What's the late policy?".
- The design follows the app: light mode only, square corners, Plus Jakarta Sans and Inter, and a course-colored assistant mark. There is no generic sparkle icon.

## Behavior rules
- The assistant only sees the current course's extracted data and the syllabus text.
- It never resolves conflicts or changes course data. When it touches an open issue, it points the student to Issues.

## Technical details
- Database: `course_chats` (id, user_id, course_id, title, timestamps) and `course_chat_messages` (id uuid, chat_id, user_id, role, parts jsonb, created_at). Grants for authenticated users plus owner-scoped RLS.
- Route: `src/routes/_authenticated/courses.$id.chat.$chatId.tsx` renders inside the course page. Its parent renders `<Outlet />`, and the panel is the chat view.
- Streaming server route `src/routes/api/course-chat.ts`. It checks the bearer and verifies that the user owns the chat and the course. It loads the course and items as context, plus the syllabus text if it is stored. It uses the AI SDK through the Lovable AI Gateway with the default model and streams the answer. It saves the user's message, then saves the assistant's message in `onFinish`.
- The UI uses AI Elements (conversation, message, prompt input) with markdown answers. A typing indicator shows right away, and the input stays focused.
- Page citations use the format `[p. N]` in the model output. These are rendered as `SourceLink` hover links.
- Add a rule to `AGENTS.md` that course chat context is scoped to a single course.
