import { Link } from "react-router-dom";
import { CATEGORIES } from "../constants/categories";

const EventCard = ({ event }) => {
  const categoryLabel =
    CATEGORIES.find((c) => c.value === event.category)?.label || event.category;
  const lowestPrice = Math.min(...event.priceTiers.map((t) => t.price));

  return (
    <Link
      to={`/events/${event._id}`}
      className="block rounded-lg bg-slate-900 p-5 hover:bg-slate-800 transition-colors"
    >
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="uppercase tracking-wide">{categoryLabel}</span>
        <span>{new Date(event.date).toLocaleDateString()}</span>
      </div>
      <h3 className="mt-2 text-lg font-semibold text-slate-100">{event.name}</h3>
      <p className="mt-1 text-sm text-slate-400">{event.venue}</p>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-slate-400">
          {event.seatsRemaining ?? event.capacity} seats left
        </span>
        <span className="font-medium text-indigo-400">From ₹{lowestPrice}</span>
      </div>
    </Link>
  );
};

export default EventCard;
