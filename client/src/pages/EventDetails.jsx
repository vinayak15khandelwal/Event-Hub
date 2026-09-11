import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchEventById } from "../api/events";
import { CATEGORIES } from "../constants/categories";
import SeatMap from "../components/SeatMap";
import PriceTierList from "../components/PriceTierList";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [heldSeats, setHeldSeats] = useState([]);
  const [activeTier, setActiveTier] = useState(null);
  const [tierSummary, setTierSummary] = useState([]);

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ["event", id],
    queryFn: () => fetchEventById(id),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
        <Spinner /> <span>Loading event...</span>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-slate-900 dark:text-slate-100">Event not found.</p>
        <Link to="/events" className="text-indigo-600 hover:underline dark:text-indigo-400">
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
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <span className="text-xs font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
        {categoryLabel}
      </span>
      <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-3xl">
        {event.name}
      </h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        {new Date(event.date).toLocaleString()} · {event.venue}
      </p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">
        Organized by {event.organizer?.name}
      </p>

      {event.description && (
        <p className="mt-4 leading-relaxed text-slate-700 dark:text-slate-300">
          {event.description}
        </p>
      )}

      <p className="mt-4 text-sm text-slate-500 dark:text-slate-500">
        {event.seatsRemaining ?? event.capacity} / {event.capacity} seats
        remaining overall
      </p>

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Price Tiers
        </h2>
        <PriceTierList
          tierSummary={tierSummary}
          activeTier={activeTier}
          onSelectTier={setActiveTier}
        />
        {tierSummary.length > 1 && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
            You can select seats from more than one tier in the same booking -
            each seat is charged at its own tier's price.
          </p>
        )}
      </div>

      <Card className="mt-8 p-4 sm:p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Select Your Seat
          {activeTier && (
            <span className="ml-2 normal-case text-indigo-600 dark:text-indigo-400">
              - showing {activeTier} only
            </span>
          )}
        </h2>
        <SeatMap
          eventId={id}
          onHeldSeatsChange={setHeldSeats}
          onTierSummaryChange={setTierSummary}
          tierFilter={activeTier}
        />
      </Card>

      {heldSeats.length > 0 && (
        <Button onClick={goToCheckout} className="mt-6 w-full py-3">
          Proceed to Checkout ({heldSeats.length} seat
          {heldSeats.length > 1 ? "s" : ""})
        </Button>
      )}
    </div>
  );
};

export default EventDetails;
