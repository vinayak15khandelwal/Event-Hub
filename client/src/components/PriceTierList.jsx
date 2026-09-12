import Card from "./ui/Card";
import Badge from "./ui/Badge";

// tierSummary comes straight from GET /api/events/:id/seats' meta field -
// every number here is derived from real Seat documents on the backend.
const availabilityBadge = (tier) => {
  if (tier.available === 0) return { label: "Sold Out", variant: "danger" };
  if (tier.available <= tier.quantity * 0.2) return { label: `${tier.available} left`, variant: "warning" };
  return { label: `${tier.available} left`, variant: "success" };
};

const PriceTierList = ({ tierSummary, activeTier, onSelectTier }) => {
  if (!tierSummary || tierSummary.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {tierSummary.map((tier) => {
        const soldOut = tier.available === 0;
        const isActive = activeTier === tier.name;
        const availability = availabilityBadge(tier);

        return (
          <Card
            key={tier.name}
            className={`relative overflow-hidden p-4 transition-all duration-200 ${
              isActive
                ? "border-brand-500 ring-2 ring-brand-500/40 shadow-glow"
                : soldOut
                ? "opacity-60"
                : "hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            {isActive && (
              <div className="absolute right-0 top-0 rounded-bl-lg bg-brand-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                SELECTED
              </div>
            )}

            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {tier.name}
                </p>
                <p className="mt-0.5 text-xl font-bold text-slate-900 dark:text-slate-50">
                  ₹{tier.price}
                </p>
              </div>
              <Badge variant={availability.variant}>{availability.label}</Badge>
            </div>

            <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
              {tier.quantity} total · {tier.held} on hold · {tier.booked} booked
            </p>

            <button
              type="button"
              disabled={soldOut}
              onClick={() => onSelectTier(isActive ? null : tier.name)}
              className={`btn-base mt-3 w-full py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 ${
                isActive
                  ? "bg-brand-600 text-white hover:bg-brand-500"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {soldOut ? "Sold Out" : isActive ? "Showing this tier" : "Select"}
            </button>
          </Card>
        );
      })}
    </div>
  );
};

export default PriceTierList;
