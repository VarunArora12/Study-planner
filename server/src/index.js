import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  db,
  getPlanTopics,
  getSubjectById,
  getSubjectPlan,
  getUserByEmail,
  getUserById,
  getUserSubjects
} from "./db.js";
import { buildSchedule } from "./scheduler.js";
import { presentPlan } from "./planPresenter.js";
import { createSession, hashPassword, requireAuth, verifyPassword } from "./auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 4001;
const HOST = process.env.HOST || "127.0.0.1";

app.use(cors());
app.use(express.json({ limit: "1mb" }));

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email
  };
}

function loadPresentedSubjectPlan(userId, subjectId) {
  const plan = getSubjectPlan(subjectId, userId);
  if (!plan) return null;

  return presentPlan(plan, getPlanTopics(plan.id));
}

function saveSubjectPlan({ userId, subjectId, subjectName, topicsText, examDate, hoursPerDay }) {
  const normalizedHours = Number(hoursPerDay);

  if (!subjectName?.trim()) {
    throw new Error("Subject name is required.");
  }

  if (!topicsText || !examDate) {
    throw new Error("Topics and exam date are required.");
  }

  const { tasks } = buildSchedule({
    rawTopics: topicsText,
    examDate,
    hoursPerDay: normalizedHours
  });

  db.exec("BEGIN");

  try {
    let targetSubjectId = subjectId;

    if (targetSubjectId) {
      const subject = getSubjectById(userId, targetSubjectId);
      if (!subject) {
        throw new Error("Subject not found.");
      }

      db.prepare(
        `UPDATE subjects
         SET name = ?, syllabus_text = ?, exam_date = ?, hours_per_day = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`
      ).run(subjectName.trim(), topicsText, examDate, normalizedHours, targetSubjectId, userId);

      db.prepare(
        `DELETE FROM topics
         WHERE plan_id IN (SELECT id FROM plans WHERE subject_id = ? AND user_id = ?)`
      ).run(targetSubjectId, userId);
      db.prepare("DELETE FROM plans WHERE subject_id = ? AND user_id = ?").run(targetSubjectId, userId);
    } else {
      const subjectResult = db
        .prepare(
          `INSERT INTO subjects (user_id, name, syllabus_text, exam_date, hours_per_day)
           VALUES (?, ?, ?, ?, ?)`
        )
        .run(userId, subjectName.trim(), topicsText, examDate, normalizedHours);

      targetSubjectId = subjectResult.lastInsertRowid;
    }

    const planResult = db
      .prepare(
        `INSERT INTO plans (user_id, subject_id, syllabus_text, exam_date, hours_per_day, updated_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
      )
      .run(userId, targetSubjectId, topicsText, examDate, normalizedHours);

    const insertTopic = db.prepare(
      `INSERT INTO topics
        (plan_id, title, study_date, day_number, estimated_hours, is_revision, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );

    tasks.forEach((task) => {
      insertTopic.run(
        planResult.lastInsertRowid,
        task.title,
        task.study_date,
        task.day_number,
        task.estimated_hours,
        task.is_revision,
        task.sort_order
      );
    });

    db.exec("COMMIT");
    return targetSubjectId;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, app: "ExamPrep AI" });
});

app.post("/api/auth/signup", (req, res) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password || "";

    if (!name || !email || password.length < 6) {
      return res.status(400).json({ message: "Enter a name, email, and password of at least 6 characters." });
    }

    const { hash, salt } = hashPassword(password);
    const result = db
      .prepare("INSERT INTO users (name, email, password_hash, password_salt) VALUES (?, ?, ?, ?)")
      .run(name, email, hash, salt);
    const user = getUserById(result.lastInsertRowid);
    const token = createSession(user.id);

    res.status(201).json({ user: publicUser(user), token });
  } catch (error) {
    if (String(error.message).includes("UNIQUE")) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    res.status(400).json({ message: "Unable to create account." });
  }
});

app.post("/api/auth/login", (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password || "";
  const user = email ? getUserByEmail(email) : null;

  if (!user || !verifyPassword(password, user)) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const token = createSession(user.id);
  res.json({ user: publicUser(user), token });
});

app.post("/api/auth/logout", requireAuth, (req, res) => {
  db.prepare("DELETE FROM sessions WHERE token = ?").run(req.token);
  res.status(204).send();
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

app.get("/api/subjects", requireAuth, (req, res) => {
  res.json({ subjects: getUserSubjects(req.user.id) });
});

app.get("/api/subjects/:id", requireAuth, (req, res) => {
  const subjectId = Number(req.params.id);
  const subject = getSubjectById(req.user.id, subjectId);

  if (!subject) {
    return res.status(404).json({ message: "Subject not found." });
  }

  res.json({ plan: loadPresentedSubjectPlan(req.user.id, subjectId) });
});

app.post("/api/subjects", requireAuth, (req, res) => {
  try {
    const subjectId = saveSubjectPlan({
      userId: req.user.id,
      subjectName: req.body.subjectName,
      topicsText: req.body.topicsText,
      examDate: req.body.examDate,
      hoursPerDay: req.body.hoursPerDay
    });

    res.status(201).json({
      subjects: getUserSubjects(req.user.id),
      plan: loadPresentedSubjectPlan(req.user.id, subjectId)
    });
  } catch (error) {
    res.status(400).json({ message: error.message || "Unable to create subject plan." });
  }
});

app.put("/api/subjects/:id", requireAuth, (req, res) => {
  try {
    const subjectId = Number(req.params.id);

    saveSubjectPlan({
      userId: req.user.id,
      subjectId,
      subjectName: req.body.subjectName,
      topicsText: req.body.topicsText,
      examDate: req.body.examDate,
      hoursPerDay: req.body.hoursPerDay
    });

    res.json({
      subjects: getUserSubjects(req.user.id),
      plan: loadPresentedSubjectPlan(req.user.id, subjectId)
    });
  } catch (error) {
    res.status(400).json({ message: error.message || "Unable to update subject plan." });
  }
});

app.patch("/api/topics/:id", requireAuth, (req, res) => {
  const topicId = Number(req.params.id);
  const topic = db
    .prepare(
      `SELECT topics.id, plans.subject_id
       FROM topics
       JOIN plans ON plans.id = topics.plan_id
       WHERE topics.id = ? AND plans.user_id = ?`
    )
    .get(topicId, req.user.id);

  if (!topic) {
    return res.status(404).json({ message: "Topic not found." });
  }

  db.prepare("UPDATE topics SET completed = ? WHERE id = ?").run(req.body.completed ? 1 : 0, topicId);

  res.json({
    subjects: getUserSubjects(req.user.id),
    plan: loadPresentedSubjectPlan(req.user.id, topic.subject_id)
  });
});

const clientDist = path.join(__dirname, "..", "..", "client", "dist");
app.use(express.static(clientDist));

app.get("*", (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

app.listen(PORT, HOST, () => {
  console.log(`ExamPrep AI server running on http://${HOST}:${PORT}`);
});
