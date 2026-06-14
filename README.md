# ExamPrep AI

**ExamPrep AI - Intelligent Study Scheduler** is a full-stack study planning app built with React, Node.js, Express, SQLite, and Tailwind CSS. It uses simple rule-based scheduling logic instead of external AI APIs.

## Features

- Paste syllabus topics as lines, bullets, commas, or semicolon-separated text.
- Enter exam date and study hours per day.
- Automatically distribute topics across available study days.
- Reserve the last 2-3 days before the exam for revision when time allows.
- Dashboard with daily schedule, completion checkboxes, progress percentage, and exam countdown.
- SQLite persistence for plans and topic completion.
- Responsive Tailwind UI.

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, lucide-react
- Backend: Node.js, Express
- Database: SQLite via better-sqlite3

## Getting Started

Prerequisite: Node.js 24 or newer, because the API uses Node's built-in SQLite module.

```bash
npm install
npm run dev
```

The app runs at:

- Frontend: http://localhost:5173
- API: http://localhost:4000

## Production Build

```bash
npm run build
npm start
```

The Express server serves the built React app from `client/dist`.

## Folder Structure

```text
studyplanner-ai/
  client/          React + Tailwind frontend
  server/          Express API + SQLite database
  server/data/     Local SQLite database file
```

## Scheduling Rule

The scheduler calculates all dates from today through the day before the exam. It reserves revision days at the end of the plan, then spreads syllabus topics evenly across the remaining study days. When there are more days than topics, it adds practice and catch-up days so the dashboard still shows a complete daily plan.
