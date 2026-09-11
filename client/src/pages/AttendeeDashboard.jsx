import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import useAuthStore from "../store/authStore";
import { fetchMyBookings } from "../api/bookings";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import Spinner from "../components/ui/Spinner";
import Button from "../components/ui/Button";

const AttendeeDashboard = () => {
  const { user } = useAuthStore();
  const { data: bookings, isLoading } = useQuery({
    queryKey: ["my-bookings"],
    queryFn: fetchMyBookings,
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
        My Tickets
      </h1>
      <p className="mt-1 text-slate-600 dark:text-slate-400">
        Welcome, {user.name}
      </p>

      <div className="mt-8">
        {isLoading && (
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Spinner /> <span>Loading your bookings...</span>
          </div>
        )}

        {bookings && bookings.length === 0 && (
          <EmptyState
            title="No bookings yet"
            description="Browse events and book your first ticket."
            action={
              <Link to="/events">
                <Button variant="secondary">Browse Events</Button>
              </Link>
            }
          />
        )}

        {bookings && bookings.length > 0 && (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <Link key={booking._id} to={`/bookings/${booking._id}/confirmation`}>
                <Card className="p-4 transition-colors hover:border-slate-300 dark:hover:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {booking.event?.name}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {booking.event?.date &&
                          new Date(booking.event.date).toLocaleDateString()}{" "}
                        · {booking.event?.venue}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        ₹{booking.totalAmount}
                      </p>
                      <p className="text-xs capitalize text-slate-500 dark:text-slate-500">
                        {booking.status}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendeeDashboard;
