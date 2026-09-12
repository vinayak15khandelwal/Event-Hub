import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../store/authStore";
import { fetchMyBookings, cancelBooking } from "../api/bookings";
import { toast } from "../store/toastStore";
import Card from "../components/ui/Card";
import StatCard from "../components/ui/StatCard";
import EmptyState from "../components/ui/EmptyState";
import Spinner from "../components/ui/Spinner";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";

const TABS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
];

const AttendeeDashboard = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("upcoming");
  const [cancellingId, setCancellingId] = useState(null);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["my-bookings"],
    queryFn: fetchMyBookings,
  });

  const cancelMutation = useMutation({
    mutationFn: cancelBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      toast.success("Booking cancelled - refund simulated");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to cancel booking");
    },
    onSettled: () => setCancellingId(null),
  });

  const isUpcoming = (booking) =>
    booking.event?.date && new Date(booking.event.date) > new Date();

  // Every number below is derived directly from the bookings the API
  // already returns (event date, seats array length, totalAmount) - nothing
  // invented or estimated.
  const upcomingCount = bookings?.filter(isUpcoming).length ?? 0;
  const totalTickets = bookings?.reduce((sum, b) => sum + (b.seats?.length || 0), 0) ?? 0;
  const totalSpent = bookings?.reduce((sum, b) => sum + (b.totalAmount || 0), 0) ?? 0;

  const filteredBookings = bookings?.filter((b) =>
    tab === "upcoming" ? isUpcoming(b) : !isUpcoming(b)
  );

  const handleCancel = (e, bookingId) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Cancel this booking? Your seat will be released and the payment refunded (simulated).")) {
      setCancellingId(bookingId);
      cancelMutation.mutate(bookingId);
    }
  };

  return (
    <div className="page-container py-8 sm:py-10">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
        My Tickets
      </h1>
      <p className="mt-1 text-slate-500 dark:text-slate-400">Welcome back, {user.name}</p>

      {bookings && bookings.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Upcoming Events" value={upcomingCount} accent="brand" icon="📅" />
          <StatCard label="Total Tickets" value={totalTickets} accent="violet" icon="🎟️" />
          <StatCard label="Total Spent" value={`₹${totalSpent}`} accent="emerald" icon="₹" />
        </div>
      )}

      <div className="mt-8">
        <div className="mb-4 flex items-center gap-1 border-b border-slate-200 dark:border-slate-800">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                tab === t.key
                  ? "text-slate-900 dark:text-slate-100"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {t.label}
              {tab === t.key && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-500" />
              )}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Spinner /> <span>Loading your bookings...</span>
          </div>
        )}

        {bookings && bookings.length === 0 && (
          <EmptyState
            icon="🎫"
            title="No bookings yet"
            description="Browse events and book your first ticket."
            action={
              <Link to="/events">
                <Button variant="secondary">Browse Events</Button>
              </Link>
            }
          />
        )}

        {filteredBookings && filteredBookings.length === 0 && bookings.length > 0 && (
          <EmptyState
            icon={tab === "upcoming" ? "📅" : "🗄️"}
            title={tab === "upcoming" ? "No upcoming bookings" : "No past bookings"}
            description={
              tab === "upcoming"
                ? "Book an event to see it here."
                : "Bookings for events that have already happened will show up here."
            }
          />
        )}

        {filteredBookings && filteredBookings.length > 0 && (
          <div className="space-y-3">
            {filteredBookings.map((booking) => {
              const upcoming = isUpcoming(booking);
              const canCancel = upcoming && booking.status === "confirmed";
              return (
                <Link key={booking._id} to={`/bookings/${booking._id}/confirmation`}>
                  <Card hover className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {booking.event?.name}
                          </p>
                          <Badge variant={upcoming ? "info" : "neutral"}>
                            {upcoming ? "Upcoming" : "Past"}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                          {booking.event?.date &&
                            new Date(booking.event.date).toLocaleDateString()}{" "}
                          · {booking.event?.venue} · {booking.seats?.length || 0} ticket
                          {(booking.seats?.length || 0) > 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-bold text-slate-900 dark:text-slate-100">
                            ₹{booking.totalAmount}
                          </p>
                          <Badge variant={booking.status === "confirmed" ? "success" : "danger"}>
                            {booking.status}
                          </Badge>
                        </div>
                        {canCancel && (
                          <Button
                            variant="danger"
                            size="sm"
                            loading={cancellingId === booking._id}
                            onClick={(e) => handleCancel(e, booking._id)}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendeeDashboard;
