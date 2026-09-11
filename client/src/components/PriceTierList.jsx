import Card from "./ui/Card";
import Badge from "./ui/Badge";

// tierSummary comes straight from GET /api/events/:id/seats' meta field -
// every number here is derived from real Seat documents on the backend.
const PriceTierList = ({ tierSummary, activeTier, onSelectTier }) => {
  if (!tierSummary || tierSummary.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {tierSummary.map((tier) => {
        const soldOut = tier.available === 0;
        const isActive = activeTier === tier.name;

        return (
          <Card
            key={tier.name}
            className={`p-4 transition-colors ${
              isActive ? "ring-2 ring-indigo-500" : ""
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {tier.name}
                </p>
                <p className="mt-0.5 text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                  ₹{tier.price}
                </p>
              </div>
              {soldOut ? (
                <Badge variant="danger">Sold Out</Badge>
              ) : (
                <Badge variant="success">{tier.available} left</Badge>
              )}
            </div>

            <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
              {tier.quantity} total · {tier.held} on hold · {tier.booked} booked
            </p>

            <button
              type="button"
              disabled={soldOut}
              onClick={() => onSelectTier(isActive ? null : tier.name)}
              className={`mt-3 w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                isActive
                  ? "bg-indigo-600 text-white hover:bg-indigo-500"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {soldOut
                ? "Sold Out"
                : isActive
                ? "Showing this tier's seats"
                : "Select"}
            </button>
          </Card>
        );
      })}
    </div>
  );
};

export default PriceTierList;
