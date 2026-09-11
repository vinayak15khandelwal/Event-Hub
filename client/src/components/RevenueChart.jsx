const RevenueChart = ({ revenueByTier }) => {
  if (!revenueByTier || revenueByTier.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-500">
        No sales yet.
      </p>
    );
  }

  const maxRevenue = Math.max(...revenueByTier.map((t) => t.revenue), 1);

  return (
    <div className="space-y-3">
      {revenueByTier.map((tier) => (
        <div key={tier.tierName}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {tier.tierName}
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              ₹{tier.revenue} · {tier.ticketsSold} sold
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-indigo-600"
              style={{ width: `${(tier.revenue / maxRevenue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default RevenueChart;
