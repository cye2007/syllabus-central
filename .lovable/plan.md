# SyllaView assistant: one chatbot for all your courses

## What students get
- A new "Assistant" button in the top bar, next to Calendar, Search and Issues. It opens an Assistant page.
- The assistant can answer questions about any course or about several at once. Examples: "What's due across all my classes this week?", "Which class has the strictest late policy?" and "When is ECON 101's midterm?".
- Answers name the course and syllabus page and link to them using the app's existing hover-to-reveal links.
- Advice is allowed and labeled as advice. Examples: planning a heavy week, how to prioritize by grade weight, or when to go to office hours. It never invents syllabus facts. Missing info is answered with "Not in syllabus".
- Separate conversations: a list of past chats, a "New chat" button, and each chat has its own link, so reloading keeps it open. Chats are saved to the student's account and are private.
- Starter questions appear on an empty chat.
- The design follows the app: light only, square corners, the app's fonts, and a SyllaView assistant mark. There is no generic sparkle icon.

## Behavior rules
- The assistant only sees the signed-in student's own courses and deadlines.
- It never resolves conflicts or edits course data. When it touches an open issue, it points the student to Issues.

## Technical details
- Database: `assistant_chats` (id, user_id, title, timestamps) and `assistant_messages` (id uuid, chat_id, user_id, role, parts jsonb, created_at). Grants for authenticated users plus owner-scoped RLS.
- Routes: `src/routes/_authenticated/assistant.tsx` is the layout with the chat list and `<Outlet />`. `assistant.index.tsx` creates or opens the latest chat. `assistant.$chatId.tsx` is the chat view.
- Streaming server route `src/routes/api/assistant-chat.ts`. It checks the bearer and verifies chat ownership. It loads all of the user's courses and items as compact context, with each fact tagged by course code and page. It uses the AI SDK through the Lovable AI Gateway with the default model and streams the answer. It saves the user message, then the assistant message in `onFinish`.
- The UI uses AI Elements with markdown answers, a typing indicator shown right away, and an input that stays focused. `[CODE p. N]` citations are rendered as `SourceLink`.
- Add a rule to `AGENTS.md` that assistant context is limited to the user's own course data.
