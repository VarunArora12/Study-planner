import { BookOpenCheck } from "lucide-react";

export default function SubjectList({ subjects, selectedSubjectId, onSelectSubject }) {
  if (!subjects.length) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm leading-6 text-slate-600">
        Add your first subject to start tracking a personal study plan.
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      {subjects.map((subject) => (
        <button
          key={subject.id}
          type="button"
          onClick={() => onSelectSubject(subject.id)}
          className={`rounded-md border p-3 text-left transition ${
            selectedSubjectId === subject.id
              ? "border-teal-300 bg-teal-50"
              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-teal-100 text-teal-700">
              <BookOpenCheck size={17} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-bold text-slate-950">{subject.name}</p>
                <span className="shrink-0 text-xs font-bold text-slate-600">{subject.progress}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-teal-600" style={{ width: `${subject.progress}%` }} />
              </div>
              <p className="mt-2 text-xs font-medium text-slate-500">
                {subject.completedCount}/{subject.totalTasks} tasks · {subject.countdown} days left
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
