import { useState } from "react";
import { Loader2, LogIn, Sparkles, UserPlus } from "lucide-react";

export default function AuthPanel({ onSubmit, saving }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const isSignup = mode === "signup";

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({ mode, name, email, password });
  }

  return (
    <div className="mx-auto grid min-h-[70vh] w-full max-w-5xl items-center gap-6 lg:grid-cols-[1fr_420px]">
      <section>
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-teal-700">
          <Sparkles size={16} />
          Rule-based study planner
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">ExamPrep AI</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
          ExamPrep AI - Intelligent Study Scheduler with private subject plans for every student account.
        </p>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-soft">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-teal-100 text-teal-700">
            {isSignup ? <UserPlus size={22} /> : <LogIn size={22} />}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-950">{isSignup ? "Create Account" : "Log In"}</h2>
            <p className="text-sm text-slate-500">Save subjects, plans, and progress in SQLite</p>
          </div>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {isSignup && (
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-slate-700">Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                required
              />
            </label>
          )}

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-slate-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              required
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-slate-700">Password</span>
            <input
              type="password"
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              required
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? <Loader2 className="animate-spin" size={17} /> : isSignup ? <UserPlus size={17} /> : <LogIn size={17} />}
            {isSignup ? "Sign up" : "Log in"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(isSignup ? "login" : "signup")}
          className="mt-4 w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
        >
          {isSignup ? "Use an existing account" : "Create a new account"}
        </button>
      </section>
    </div>
  );
}
