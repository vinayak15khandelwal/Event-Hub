import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchEventById } from "../api/events";
import { CATEGORIES } from "../constants/categories";
import SeatMap from "../components/SeatMap";

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [heldSeats, setHeldSeats] = useState([]);

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ["event", id],
    queryFn: () => fetchEventById(id),
  });

  if (isLoading) {
    return (
      <div className="min-h-[80vh] bg-slate-950 text-slate-400 p-8">Loading...</div>
    );
  }

  if (isError || !event) {
    return (
      <div className="min-h-[80vh] bg-slate-950 text-slate-100 p-8">
        <p>Event not found.</p>
        <Link to="/events" className="text-indigo-400 hover:underline">
          Back to events
        </Link>
      </div>
    );
  }

  const categoryLabel =
    CATEGORIES.find((c) => c.value === event.category)?.label || event.category;

  const goToCheckout = () => {
    navigate(`/events/${id}/checkout`, { state: { heldSeats } });
  };

  return (
    <div className="min-h-[80vh] bg-slate-950 text-slate-100 p-8">
      <div className="mx-auto max-w-2xl">
        <span className="text-xs uppercase tracking-wide text-slate-500">
          {categoryLabel}
        </span>
        <h1 className="mt-1 text-2xl font-semibold">{event.name}</h1>
        <p className="mt-1 text-slate-400">
          {new Date(event.date).toLocaleString()} · {event.venue}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Organized by {event.organizer?.name}
        </p>

        {event.description && (
          <p className="mt-4 text-slate-300">{event.description}</p>
        )}

        <div className="mt-6 space-y-2">
          <h2 className="text-sm font-medium text-slate-400">Price tiers</h2>
          {event.priceTiers.map((tier) => (
            <div
              key={tier._id}
              className="flex items-center justify-between rounded-md bg-slate-900 px-4 py-2 text-sm"
            >
              <span>{tier.name}</span>
              <span className="text-indigo-400">₹{tier.price}</span>
            </div>
          ))}
        </div>

        <p className="mt-4 text-sm text-slate-500">
          {event.seatsRemaining ?? event.capacity} / {event.capacity} seats
          remaining
        </p>

        <div className="mt-8">
          <h2 className="mb-3 text-sm font-medium text-slate-400">
            Select your seat
          </h2>
          <SeatMap eventId={id} onHeldSeatsChange={setHeldSeats} />
        </div>

        {heldSeats.length > 0 && (
          <button
            onClick={goToCheckout}
            className="mt-6 w-full rounded-md bg-indigo-600 py-3 font-medium hover:bg-indigo-500"
          >
            Proceed to Checkout ({heldSeats.length} seat
            {heldSeats.length > 1 ? "s" : ""})
          </button>
        )}
      </div>
    </div>
  );
};

export default EventDetails;
