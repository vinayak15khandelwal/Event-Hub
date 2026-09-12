import { Link } from "react-router-dom";
import { CATEGORIES } from "../constants/categories";
import Card from "./ui/Card";
import Badge from "./ui/Badge";

// Semantic availability - derived purely from real event data (capacity vs
// seatsRemaining), never invented.
const availabilityFor = (event) => {
  const remaining = event.seatsRemaining ?? event.capacity;
  if (remaining === 0) return { label: "Sold Out", variant: "danger" };
  if (remaining <= event.capacity * 0.2) return { label: `${remaining} left`, variant: "warning" };
  return { label: `${remaining} left`, variant: "success" };
};

const EventCard = ({ event }) => {
  const categoryLabel =
    CATEGORIES.find((c) => c.value === event.category)?.label || event.category;
  const lowestPrice = Math.min(...event.priceTiers.map((t) => t.price));
  const availability = availabilityFor(event);
  const soldOut = availability.label === "Sold Out";

  return (
    <Link to={`/events/${event._id}`} className="block group">
      <Card
        hover
        className={`overflow-hidden p-0 ${soldOut ? "opacity-70" : ""}`}
      >
        <div className="relative flex h-24 items-center justify-center overflow-hidden bg-gradient-to-br from-brand-600 via-violet-500 to-brand-500">
          <div className="bg-grid-pattern absolute inset-0 opacity-30" aria-hidden="true" />
          <span className="relative text-3xl font-black text-white/90">
            {event.name.charAt(0)}
          </span>
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between">
            <Badge variant="primary">{categoryLabel}</Badge>
            <span className="text-xs text-slate-500 dark:text-slate-500">
              {new Date(event.date).toLocaleDateString()}
            </span>
          </div>
          <h3 className="mt-3 text-lg font-semibold leading-snug text-slate-900 transition-colors group-hover:text-accent dark:text-slate-100">
            {event.name}
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{event.venue}</p>
          <div className="mt-4 flex items-center justify-between text-sm">
            <Badge variant={availability.variant}>{availability.label}</Badge>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              From ₹{lowestPrice}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default EventCard;
