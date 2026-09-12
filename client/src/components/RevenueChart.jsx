import EmptyState from "./ui/EmptyState";

const barColors = [
  "from-brand-600 to-brand-400",
  "from-violet-600 to-violet-400",
  "from-sky-600 to-sky-400",
  "from-emerald-600 to-emerald-400",
];

const RevenueChart = ({ revenueByTier }) => {
  if (!revenueByTier || revenueByTier.length === 0) {
    return <EmptyState title="No sales yet" description="Revenue will appear here once tickets sell." />;
  }

  const maxRevenue = Math.max(...revenueByTier.map((t) => t.revenue), 1);

  return (
    <div className="space-y-4">
      {revenueByTier.map((tier, i) => (
        <div key={tier.tierName}>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {tier.tierName}
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                ₹{tier.revenue}
              </span>{" "}
              · {tier.ticketsSold} sold
            </span>
          </div>
          <div
            className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
            title={`${tier.tierName}: ₹${tier.revenue} (${tier.ticketsSold} tickets)`}
          >
            <div
              className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ease-out ${barColors[i % barColors.length]}`}
              style={{ width: `${(tier.revenue / maxRevenue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default RevenueChart;
