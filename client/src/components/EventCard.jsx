import { Link } from "react-router-dom";
import { CATEGORIES } from "../constants/categories";
import Card from "./ui/Card";
import Badge from "./ui/Badge";

const EventCard = ({ event }) => {
  const categoryLabel =
    CATEGORIES.find((c) => c.value === event.category)?.label || event.category;
  const lowestPrice = Math.min(...event.priceTiers.map((t) => t.price));

  return (
    <Link to={`/events/${event._id}`} className="block">
      <Card className="p-5 transition-shadow hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700">
        <div className="flex items-center justify-between">
          <Badge variant="primary">{categoryLabel}</Badge>
          <span className="text-xs text-slate-500 dark:text-slate-500">
            {new Date(event.date).toLocaleDateString()}
          </span>
        </div>
        <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
          {event.name}
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {event.venue}
        </p>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-slate-500 dark:text-slate-400">
            {event.seatsRemaining ?? event.capacity} seats left
          </span>
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
            From ₹{lowestPrice}
          </span>
        </div>
      </Card>
    </Link>
  );
};

export default EventCard;
