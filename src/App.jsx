import { useEffect, useMemo, useState } from "react";
import {
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  LogOut,
  Plus,
  Sparkles,
  Target,
  User
} from "lucide-react";
import {
  createSubjectPlan,
  fetchMe,
  fetchSubjectPlan,
  fetchSubjects,
  getStoredToken,
  login,
  logout,
  setStoredToken,
  signup,
  updateSubjectPlan,
  updateTopic
} from "./api";
import AuthPanel from "./components/AuthPanel";
import ScheduleDay from "./components/ScheduleDay";
import StatCard from "./components/StatCard";
import SubjectList from "./components/SubjectList";

const sampleTopics = ``;

function getTomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function resetForm(setters) {
  setters.setSubjectName("");
  setters.setTopicsText(sampleTopics);
  setters.setExamDate(getTomorrow());
  setters.setHoursPerDay(3);
}

export default function App() {
  const [user, setUser] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [plan, setPlan] = useState(null);
  const [subjectName, setSubjectName] = useState("");
  const [topicsText, setTopicsText] = useState(sampleTopics);
  const [examDate, setExamDate] = useState(getTomorrow());
  const [hoursPerDay, setHoursPerDay] = useState(3);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authSaving, setAuthSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function bootstrap() {
      if (!getStoredToken()) {
        setLoading(false);
        return;
      }

      try {
        const me = await fetchMe();
        setUser(me.user);
        await loadSubjects();
      } catch (requestError) {
        setStoredToken("");
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, []);

  const topicPreviewCount = useMemo(
    () => topicsText.split(/\n|;|,/).map((topic) => topic.trim()).filter(Boolean).length,
    [topicsText]
  );

  async function loadSubjects(preferredSubjectId) {
    const data = await fetchSubjects();
    setSubjects(data.subjects);

    if (!data.subjects.length) {
      setSelectedSubjectId(null);
      setPlan(null);
      resetForm({ setSubjectName, setTopicsText, setExamDate, setHoursPerDay });
      return;
    }

    const nextSubjectId = preferredSubjectId || data.subjects[0].id;
    await handleSelectSubject(nextSubjectId, data.subjects);
  }

  async function handleSelectSubject(subjectId, knownSubjects = subjects) {
    setError("");
    const subject = knownSubjects.find((item) => item.id === subjectId);
    const data = await fetchSubjectPlan(subjectId);

    setSelectedSubjectId(subjectId);
    setPlan(data.plan);
    setSubjectName(data.plan?.subjectName || subject?.name || "");
    setTopicsText(data.plan?.syllabusText || subject?.syllabusText || sampleTopics);
    setExamDate(data.plan?.examDate || subject?.examDate || getTomorrow());
    setHoursPerDay(data.plan?.hoursPerDay || subject?.hoursPerDay || 3);
  }

  async function handleAuthSubmit({ mode, name, email, password }) {
    setAuthSaving(true);
    setError("");

    try {
      const auth = mode === "signup" ? await signup({ name, email, password }) : await login({ email, password });
      setStoredToken(auth.token);
      setUser(auth.user);
      await loadSubjects();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setAuthSaving(false);
    }
  }

  async function handleLogout() {
    setError("");

    try {
      await logout();
    } catch {
      // A stale local token can fail logout, but clearing local state is still correct.
    }

    setStoredToken("");
    setUser(null);
    setSubjects([]);
    setSelectedSubjectId(null);
    setPlan(null);
    resetForm({ setSubjectName, setTopicsText, setExamDate, setHoursPerDay });
  }

  function handleNewSubject() {
    setError("");
    setSelectedSubjectId(null);
    setPlan(null);
    resetForm({ setSubjectName, setTopicsText, setExamDate, setHoursPerDay });
  }

  async function handleSaveSubjectPlan(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = { subjectName, topicsText, examDate, hoursPerDay };

    try {
      const data = selectedSubjectId
        ? await updateSubjectPlan(selectedSubjectId, payload)
        : await createSubjectPlan(payload);

      setSubjects(data.subjects);
      setPlan(data.plan);
      setSelectedSubjectId(data.plan.subjectId);
      setSubjectName(data.plan.subjectName);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleTopic(topicId, completed) {
    setPlan((currentPlan) => ({
      ...currentPlan,
      schedule: currentPlan.schedule.map((day) => ({
        ...day,
        items: day.items.map((item) => (item.id === topicId ? { ...item, completed } : item))
      }))
    }));

    try {
      const data = await updateTopic(topicId, completed);
      setSubjects(data.subjects);
      setPlan(data.plan);
    } catch (requestError) {
      setError(requestError.message);

      if (selectedSubjectId) {
        await handleSelectSubject(selectedSubjectId);
      }
    }
  }

  return (
    <main className="min-h-screen px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-80 items-center justify-center rounded-md border border-slate-200 bg-white shadow-soft">
            <Loader2 className="animate-spin text-teal-700" size={28} />
          </div>
        ) : !user ? (
          <AuthPanel onSubmit={handleAuthSubmit} saving={authSaving} />
        ) : (
          <>
            <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-teal-700">
                  <Sparkles size={16} />
                  Rule-based study planner
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">ExamPrep AI</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  ExamPrep AI - Intelligent Study Scheduler for turning each subject syllabus into a practical plan.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm">
                  <User size={16} />
                  {user.name}
                </div>
                <button
                  type="button"
                  onClick={handleNewSubject}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
                >
                  <Plus size={16} />
                  New subject
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </header>

            <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
              <section className="rounded-md border border-slate-200 bg-white p-5 shadow-soft">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-md bg-teal-100 text-teal-700">
                    <BookOpenCheck size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">Subjects</h2>
                    <p className="text-sm text-slate-500">{subjects.length} saved subjects</p>
                  </div>
                </div>

                <SubjectList subjects={subjects} selectedSubjectId={selectedSubjectId} onSelectSubject={handleSelectSubject} />

                <div className="my-5 border-t border-slate-200" />

                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-md bg-amber-100 text-amber-700">
                    <CalendarDays size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">{selectedSubjectId ? "Update Study Plan" : "Build Study Plan"}</h2>
                    <p className="text-sm text-slate-500">{topicPreviewCount} topics detected</p>
                  </div>
                </div>

                <form className="flex flex-col gap-4" onSubmit={handleSaveSubjectPlan}>
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-slate-700">Subject name</span>
                    <input
                      value={subjectName}
                      onChange={(event) => setSubjectName(event.target.value)}
                      className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                      placeholder="Subject name"
                      required
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-slate-700">Syllabus topics</span>
                    <textarea
                      value={topicsText}
                      onChange={(event) => setTopicsText(event.target.value)}
                      rows={9}
                      className="min-h-44 rounded-md border border-slate-300 bg-slate-50 px-3 py-3 text-sm leading-6 outline-none transition focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-100"
                      placeholder="Enter Topics"
                      required
                    />
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-semibold text-slate-700">Exam date</span>
                      <input
                        type="date"
                        value={examDate}
                        min={getTomorrow()}
                        onChange={(event) => setExamDate(event.target.value)}
                        className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                        required
                      />
                    </label>

                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-semibold text-slate-700">Hours per day</span>
                      <input
                        type="number"
                        min="0.5"
                        max="16"
                        step="0.5"
                        value={hoursPerDay}
                        onChange={(event) => setHoursPerDay(event.target.value)}
                        className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                        required
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {saving ? <Loader2 className="animate-spin" size={17} /> : <Sparkles size={17} />}
                    {selectedSubjectId ? "Update schedule" : "Generate schedule"}
                  </button>
                </form>
              </section>

              <section className="flex min-w-0 flex-col gap-5">
                {plan ? (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <StatCard icon={Target} label="Progress" value={`${plan.progress}%`} tone="teal" />
                      <StatCard icon={CheckCircle2} label="Completed" value={`${plan.completedCount}/${plan.totalTasks}`} tone="green" />
                      <StatCard icon={CalendarDays} label="Exam countdown" value={`${plan.countdown} days`} tone="amber" />
                      <StatCard icon={Clock3} label="Daily study time" value={`${plan.hoursPerDay} hrs`} tone="rose" />
                    </div>

                    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-soft">
                      <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                        <div>
                          <h2 className="text-xl font-bold text-slate-950">{plan.subjectName} Schedule</h2>
                          <p className="text-sm text-slate-500">Exam date: {new Date(`${plan.examDate}T00:00:00`).toLocaleDateString()}</p>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-slate-100 sm:w-48">
                          <div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${plan.progress}%` }} />
                        </div>
                      </div>

                      <div className="grid gap-3">
                        {plan.schedule.map((day) => (
                          <ScheduleDay key={day.date} day={day} onToggleTopic={handleToggleTopic} />
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex min-h-96 flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-white p-8 text-center shadow-soft">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-md bg-amber-100 text-amber-700">
                      <CalendarDays size={28} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-950">No subject selected</h2>
                    <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                      Create a subject or choose one from the list to view its saved SQLite-backed schedule and progress.
                    </p>
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
