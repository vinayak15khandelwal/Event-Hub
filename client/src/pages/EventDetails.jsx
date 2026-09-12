import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchEventById } from "../api/events";
import { fetchAnnouncements } from "../api/announcements";
import { CATEGORIES } from "../constants/categories";
import SeatMap from "../components/SeatMap";
import PriceTierList from "../components/PriceTierList";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Spinner from "../components/ui/Spinner";
import useAuthStore from "../store/authStore";
import socket from "../lib/socket";

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [heldSeats, setHeldSeats] = useState([]);
  const [activeTier, setActiveTier] = useState(null);
  const [tierSummary, setTierSummary] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncementId, setNewAnnouncementId] = useState(null);

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ["event", id],
    queryFn: () => fetchEventById(id),
  });

  // Only ticket-holders (and the organizer) can actually read announcements -
  // the API returns 403 for anyone else, which we treat as "nothing to show"
  // rather than an error, since most visitors won't have a ticket yet.
  useEffect(() => {
    if (!isAuthenticated || user?.role !== "attendee") return;
    fetchAnnouncements(id)
      .then(setAnnouncements)
      .catch(() => setAnnouncements([]));
  }, [id, isAuthenticated, user]);

  // Live push while this page is open - same per-event room the seat map uses
  useEffect(() => {
    socket.emit("join-event", id);
    const handleAnnouncement = (announcement) => {
      setAnnouncements((prev) => [announcement, ...prev]);
      setNewAnnouncementId(announcement._id);
    };
    socket.on("announcement", handleAnnouncement);
    return () => {
      socket.emit("leave-event", id);
      socket.off("announcement", handleAnnouncement);
    };
  }, [id]);

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
        <Link to="/events" className="text-accent hover:underline">
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
    <div>
      {/* Header */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-brand-600 via-violet-600 to-brand-700 dark:border-slate-800">
        <div className="bg-grid-pattern absolute inset-0 opacity-20" aria-hidden="true" />
        <div className="page-container relative py-10 sm:py-14">
          <Badge variant="neutral" className="bg-white/20 text-white">
            {categoryLabel}
          </Badge>
          <h1 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {event.name}
          </h1>
          <p className="mt-3 text-white/90">
            {new Date(event.date).toLocaleString()} · {event.venue}
          </p>
          <p className="mt-1 text-sm text-white/70">
            Organized by {event.organizer?.name}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {event.description && (
          <p className="leading-relaxed text-slate-700 dark:text-slate-300">
            {event.description}
          </p>
        )}

        <p className="mt-4 text-sm text-slate-500 dark:text-slate-500">
          {event.seatsRemaining ?? event.capacity} / {event.capacity} seats
          remaining overall
        </p>

        {announcements.length > 0 && (
          <div className="mt-6 space-y-2">
            <h2 className="section-heading">Announcements</h2>
            {announcements.map((a) => (
              <Card
                key={a._id}
                className={`flex gap-3 p-4 ${
                  a._id === newAnnouncementId ? "animate-fade-in-up" : ""
                }`}
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400">
                  📣
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{a.subject}</p>
                  <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{a.message}</p>
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-600">
                    {new Date(a.createdAt).toLocaleString()}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8">
          <h2 className="section-heading mb-3">Price Tiers</h2>
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
          <h2 className="section-heading mb-4">
            Select Your Seat
            {activeTier && (
              <span className="ml-2 normal-case text-accent">
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
          <Button onClick={goToCheckout} size="lg" className="mt-6 w-full">
            Proceed to Checkout ({heldSeats.length} seat
            {heldSeats.length > 1 ? "s" : ""})
          </Button>
        )}
      </div>
    </div>
  );
};

export default EventDetails;
