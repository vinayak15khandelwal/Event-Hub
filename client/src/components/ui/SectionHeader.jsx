const SectionHeader = ({ title, subtitle, action, className = "" }) => (
  <div className={`mb-4 flex items-end justify-between gap-4 ${className}`}>
    <div>
      <h2 className="section-heading">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-500">{subtitle}</p>}
    </div>
    {action}
  </div>
);

export default SectionHeader;
