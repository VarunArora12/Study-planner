const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "http://localhost:4001" : "");
const TOKEN_KEY = "studyplanner_token";

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request(path, options = {}) {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));

    if (response.status === 401) {
      setStoredToken("");
    }

    throw new Error(body.message || "Request failed");
  }

  if (response.status === 204) return null;

  return response.json();
}

export function signup(payload) {
  return request("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function login(payload) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function logout() {
  return request("/api/auth/logout", { method: "POST" });
}

export function fetchMe() {
  return request("/api/auth/me");
}

export function fetchSubjects() {
  return request("/api/subjects");
}

export function fetchSubjectPlan(subjectId) {
  return request(`/api/subjects/${subjectId}`);
}

export function createSubjectPlan(payload) {
  return request("/api/subjects", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateSubjectPlan(subjectId, payload) {
  return request(`/api/subjects/${subjectId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function updateTopic(topicId, completed) {
  return request(`/api/topics/${topicId}`, {
    method: "PATCH",
    body: JSON.stringify({ completed })
  });
}
