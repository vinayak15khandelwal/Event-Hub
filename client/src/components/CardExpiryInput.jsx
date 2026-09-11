import { labelClasses } from "./ui/formClasses";

const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const value = String(i + 1).padStart(2, "0");
  return { value, label: value };
});

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 11 }, (_, i) => {
  const year = currentYear + i;
  return { value: String(year), label: String(year).slice(-2) };
});

const selectClasses =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

// Validates that a month/year pair is not already in the past. This is the
// mock payment card's expiry only - has no relationship to event date/time.
export const isExpiryValid = (month, year) => {
  if (!month || !year) return false;
  const now = new Date();
  const expiry = new Date(Number(year), Number(month) - 1, 1);
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return expiry >= currentMonthStart;
};

const CardExpiryInput = ({ month, year, onChange, error }) => {
  return (
    <div>
      <label className={labelClasses}>Expiry (MM/YY)</label>
      <div className="flex items-center gap-2">
        <select
          aria-label="Expiry month"
          value={month}
          onChange={(e) => onChange({ month: e.target.value, year })}
          className={selectClasses}
        >
          <option value="">MM</option>
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <span className="text-slate-400">/</span>
        <select
          aria-label="Expiry year"
          value={year}
          onChange={(e) => onChange({ month, year: e.target.value })}
          className={selectClasses}
        >
          <option value="">YY</option>
          {YEARS.map((y) => (
            <option key={y.value} value={y.value}>
              {y.label}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

export default CardExpiryInput;
