const accents = {
  brand: "bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400",
  emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  rose: "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400",
  violet: "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
  sky: "bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400",
};

const StatCard = ({ label, value, context, icon, accent = "brand" }) => (
  <div className="surface-card p-4">
    <div className="flex items-start justify-between">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      {icon && (
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${accents[accent]}`}>
          {icon}
        </div>
      )}
    </div>
    <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
      {value}
    </p>
    {context && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-500">{context}</p>}
  </div>
);

export default StatCard;
