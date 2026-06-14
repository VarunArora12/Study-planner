import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { daysUntilExam } from "./scheduler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "..", "data");

fs.mkdirSync(dataDir, { recursive: true });

export const db = new DatabaseSync(path.join(dataDir, "studyplanner.db"));
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    syllabus_text TEXT NOT NULL,
    exam_date TEXT NOT NULL,
    hours_per_day REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    subject_id INTEGER,
    syllabus_text TEXT NOT NULL,
    exam_date TEXT NOT NULL,
    hours_per_day REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    study_date TEXT NOT NULL,
    day_number INTEGER NOT NULL,
    estimated_hours REAL NOT NULL,
    is_revision INTEGER NOT NULL DEFAULT 0,
    completed INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL,
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
  );
`);

function columnExists(tableName, columnName) {
  return db.prepare(`PRAGMA table_info(${tableName})`).all().some((column) => column.name === columnName);
}

// Keep older local databases usable after introducing user-owned subjects.
if (!columnExists("plans", "user_id")) {
  db.exec("ALTER TABLE plans ADD COLUMN user_id INTEGER;");
}

if (!columnExists("plans", "subject_id")) {
  db.exec("ALTER TABLE plans ADD COLUMN subject_id INTEGER;");
}

export function getUserByEmail(email) {
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase());
}

export function getUserById(userId) {
  return db.prepare("SELECT id, name, email, created_at FROM users WHERE id = ?").get(userId);
}

export function getSessionUser(token) {
  return db
    .prepare(
      `SELECT users.id, users.name, users.email, users.created_at
       FROM sessions
       JOIN users ON users.id = sessions.user_id
       WHERE sessions.token = ? AND sessions.expires_at > ?`
    )
    .get(token, Date.now());
}

export function getSubjectById(userId, subjectId) {
  return db.prepare("SELECT * FROM subjects WHERE id = ? AND user_id = ?").get(subjectId, userId);
}

export function getSubjectPlan(subjectId, userId) {
  return db
    .prepare(
      `SELECT plans.*, subjects.name AS subject_name
       FROM plans
       JOIN subjects ON subjects.id = plans.subject_id
       WHERE plans.subject_id = ? AND plans.user_id = ?
       ORDER BY plans.updated_at DESC, plans.id DESC
       LIMIT 1`
    )
    .get(subjectId, userId);
}

export function getPlanTopics(planId) {
  return db
    .prepare(
      `SELECT id, title, study_date, day_number, estimated_hours, is_revision, completed, sort_order
       FROM topics
       WHERE plan_id = ?
       ORDER BY study_date ASC, sort_order ASC`
    )
    .all(planId);
}

export function getUserSubjects(userId) {
  const subjects = db
    .prepare(
      `SELECT id, name, syllabus_text, exam_date, hours_per_day, created_at, updated_at
       FROM subjects
       WHERE user_id = ?
       ORDER BY updated_at DESC, id DESC`
    )
    .all(userId);

  return subjects.map((subject) => {
    const plan = getSubjectPlan(subject.id, userId);
    const topics = plan ? getPlanTopics(plan.id) : [];
    const completedCount = topics.filter((topic) => topic.completed).length;
    const progress = topics.length ? Math.round((completedCount / topics.length) * 100) : 0;

    return {
      id: subject.id,
      name: subject.name,
      syllabusText: subject.syllabus_text,
      examDate: subject.exam_date,
      hoursPerDay: subject.hours_per_day,
      progress,
      completedCount,
      totalTasks: topics.length,
      countdown: Math.max(0, daysUntilExam(subject.exam_date)),
      updatedAt: subject.updated_at
    };
  });
}
