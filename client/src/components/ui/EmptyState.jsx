const EmptyState = ({ icon, title, description, action, className = "" }) => (
  <div
    className={`rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center dark:border-slate-800 dark:bg-slate-900/50 ${className}`}
  >
    {icon && (
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
        {icon}
      </div>
    )}
    <p className="font-medium text-slate-700 dark:text-slate-300">{title}</p>
    {description && (
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">
        {description}
      </p>
    )}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
