import crypto from "node:crypto";
import { db, getSessionUser } from "./db.js";

const SESSION_DAYS = 7;

export function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 64, "sha512").toString("hex");
  return { hash, salt };
}

export function verifyPassword(password, user) {
  const { hash } = hashPassword(password, user.password_salt);
  const stored = Buffer.from(user.password_hash, "hex");
  const incoming = Buffer.from(hash, "hex");

  return stored.length === incoming.length && crypto.timingSafeEqual(stored, incoming);
}

export function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;

  db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").run(token, userId, expiresAt);
  return token;
}

export function requireAuth(req, res, next) {
  const authHeader = req.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const user = token ? getSessionUser(token) : null;

  if (!user) {
    return res.status(401).json({ message: "Please log in to continue." });
  }

  req.user = user;
  req.token = token;
  next();
}
