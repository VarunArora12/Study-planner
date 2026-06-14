import { BookOpen, Check, Repeat2 } from "lucide-react";

function formatDate(dateString) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}

export default function ScheduleDay({ day, onToggleTopic }) {
  const completedItems = day.items.filter((item) => item.completed).length;
  const allRevision = day.items.every((item) => item.is_revision);

  return (
    <article className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-md ${allRevision ? "bg-amber-100 text-amber-700" : "bg-teal-100 text-teal-700"}`}>
            {allRevision ? <Repeat2 size={20} /> : <BookOpen size={20} />}
          </div>
          <div>
            <h3 className="font-bold text-slate-950">Day {day.dayNumber}</h3>
            <p className="text-sm text-slate-500">{formatDate(day.date)} · {day.totalHours.toFixed(1)} hrs</p>
          </div>
        </div>
        <span className="w-fit rounded-md bg-white px-2.5 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
          {completedItems}/{day.items.length} done
        </span>
      </div>

      <div className="grid gap-2">
        {day.items.map((item) => (
          <label
            key={item.id}
            className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 bg-white px-3 py-3 transition hover:border-teal-200 hover:bg-teal-50/50"
          >
            <input
              type="checkbox"
              checked={item.completed}
              onChange={(event) => onToggleTopic(item.id, event.target.checked)}
              className="sr-only"
            />
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                item.completed ? "border-teal-600 bg-teal-600 text-white" : "border-slate-300 bg-white text-transparent"
              }`}
            >
              <Check size={14} strokeWidth={3} />
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block text-sm font-semibold leading-5 ${item.completed ? "text-slate-400 line-through" : "text-slate-800"}`}>
                {item.title}
              </span>
              <span className="mt-1 block text-xs font-medium text-slate-500">
                {item.is_revision ? "Revision" : "Study"} · {item.estimated_hours.toFixed(1)} hrs
              </span>
            </span>
          </label>
        ))}
      </div>
    </article>
  );
}
