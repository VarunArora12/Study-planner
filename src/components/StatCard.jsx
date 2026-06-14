const tones = {
  teal: "bg-teal-100 text-teal-700",
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  rose: "bg-rose-100 text-rose-700"
};

export default function StatCard({ icon: Icon, label, value, tone }) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{value}</p>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${tones[tone]}`}>
          <Icon size={21} />
        </div>
      </div>
    </article>
  );
}
