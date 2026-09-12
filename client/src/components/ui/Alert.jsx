const variants = {
  success:
    "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900",
  error:
    "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900",
  warning:
    "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900",
  info: "bg-brand-50 text-brand-800 border-brand-200 dark:bg-brand-950/60 dark:text-brand-300 dark:border-brand-900",
};

const Alert = ({ variant = "info", children, className = "" }) => (
  <div
    role="alert"
    className={`rounded-lg border px-4 py-3 text-sm ${variants[variant]} ${className}`}
  >
    {children}
  </div>
);

export default Alert;
