import Spinner from "./Spinner";

const variants = {
  primary:
    "bg-brand-600 text-white shadow-sm hover:bg-brand-500 hover:shadow-glow focus-visible:ring-brand-500 disabled:bg-brand-600/50 disabled:shadow-none",
  secondary:
    "bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 focus-visible:ring-slate-400 disabled:opacity-50",
  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 focus-visible:ring-slate-400",
  danger:
    "bg-rose-600 text-white hover:bg-rose-500 focus-visible:ring-rose-500 disabled:bg-rose-600/50",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-base",
};

const Button = ({
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  loading = false,
  children,
  ...props
}) => {
  return (
    <button
      disabled={disabled || loading}
      className={`btn-base ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
};

export default Button;
