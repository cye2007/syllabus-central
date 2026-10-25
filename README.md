# Syllabus Central

Build a modern AI-powered web app that transforms uploaded college syllabi into one organized, interactive academic dashboard.

Core Concept

Students upload multiple syllabus PDFs, and AI automatically extracts course information, assignments, deadlines, grading policies, professor details, and schedules. The app organizes everything into a searchable workspace so students never have to manually dig through syllabi.

Main Features

1. AI Syllabus Upload

Drag-and-drop upload for multiple PDF syllabi.

Use Google Gemini API to extract structured information.

Extract course name, professor, contact details, office hours, meeting times, assignments, exams, grading breakdowns, policies, textbooks, and weekly schedules.

Automatically generate a course page for each uploaded syllabus.

2. Semester Dashboard

Display all courses as color-coded cards.

Show upcoming deadlines, exams, and important announcements.

Include a unified calendar displaying events from every course.

Highlight overlapping deadlines and important alerts.

3. Individual Course Pages
Each course should have organized tabs:

Overview: Professor, office hours, class times, locations.

Assignments: Deadlines, exams, quizzes, projects.

Grading: Grade weights, grading scale, policies.

Schedule: Weekly topics, readings, important dates.

Policies: Attendance, late work, AI usage, academic integrity.

Resources: Textbooks, links, required materials.

4. Smart Search

Let students search information across all uploaded courses using natural language.

Example: "Which classes allow late assignments?" or "What exams do I have next week?"

Show clear answers and side-by-side comparisons when relevant.

5. Source Verification

Connect extracted information to its original PDF.

Clicking an extracted detail should open the relevant syllabus page.

Let students verify and manually correct AI-extracted information.

6. Conflict Detection

Automatically flag contradictory deadlines, inconsistent grading weights, missing dates, and unclear policies.

Show the conflicting information and original source references.

Allow students to review and resolve issues manually.

Never invent missing information or automatically resolve contradictions.

Design Requirements

Create a beautiful, modern SaaS-style interface inspired by Notion, Linear, and premium productivity dashboards.

Minimalist, professional design with excellent typography.

Clean sidebar navigation.

Color-coded course cards.

Interactive calendars and polished dashboard widgets.

Light and dark mode.

Smooth animations and subtle hover effects.

Fully responsive desktop and mobile layouts.

Prioritize usability, clarity, and visual polish.

Tech Stack

React + TypeScript + Tailwind CSS.

shadcn/ui for components.

Supabase for authentication, database, and PDF storage.

Google Gemini API for syllabus extraction and conflict detection.

PDF viewer for source verification.

Important Implementation Details

Build real, functional features rather than just a visual mockup.

Store extracted course information as structured database records.

Process PDFs securely through backend functions, keeping API keys private.

Preserve the original syllabus and page references for extracted facts.

Allow users to edit extracted data.

Persist courses, assignments, and corrections across sessions.

Include loading states, upload progress, and clear error handling.

Do not fabricate course information if AI extraction fails.

MVP Priority

Focus first on making this complete workflow functional:

Upload PDFs → AI extracts information → Course pages are generated → Dashboard combines deadlines → Students search information → Students verify sources and resolve conflicts.

After the core experience works, add optional features such as a grade calculator, workload heatmap, calendar export, and syllabus version comparison.

Overall Goal: CourseAtlas should feel like a complete academic command center, not just a PDF summarizer or AI chatbot. The experience should be visually impressive, intuitive, and demo-ready for a hackathon.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ae7d56ff-c498-421b-9c89-c2cae4048d48).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
