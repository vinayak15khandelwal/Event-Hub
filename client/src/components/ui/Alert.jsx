const variants = {
  success:
    "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900",
  error:
    "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-900",
  warning:
    "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900",
  info: "bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-900",
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
