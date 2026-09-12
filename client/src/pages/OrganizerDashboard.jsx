import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../store/authStore";
import { fetchMyEvents, deleteEvent } from "../api/events";
import { toast } from "../store/toastStore";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import StatCard from "../components/ui/StatCard";
import EmptyState from "../components/ui/EmptyState";
import Spinner from "../components/ui/Spinner";
import Badge from "../components/ui/Badge";

const OrganizerDashboard = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: events, isLoading } = useQuery({
    queryKey: ["my-events"],
    queryFn: fetchMyEvents,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-events"] });
      toast.success("Event deleted");
    },
    onError: () => toast.error("Failed to delete event"),
  });

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete "${name}"? This cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  // Every KPI below is derived from the events array the API already
  // returns (capacity/ticketsSold per event) - nothing invented.
  const totalCapacity = events?.reduce((sum, e) => sum + (e.capacity || 0), 0) ?? 0;
  const totalSold = events?.reduce((sum, e) => sum + (e.ticketsSold || 0), 0) ?? 0;
  const avgSoldPct = totalCapacity > 0 ? Math.round((totalSold / totalCapacity) * 100) : 0;

  return (
    <div className="page-container py-8 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            Organizer Dashboard
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Welcome back, {user.name}</p>
        </div>
        <Link to="/organizer/events/new">
          <Button>+ Create Event</Button>
        </Link>
      </div>

      {events && events.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Events" value={events.length} accent="brand" icon="📋" />
          <StatCard label="Tickets Sold" value={`${totalSold}/${totalCapacity}`} accent="violet" icon="🎟️" />
          <StatCard label="Avg. Sold %" value={`${avgSoldPct}%`} accent="emerald" icon="📈" />
          <StatCard
            label="Published"
            value={events.filter((e) => e.status === "published").length}
            accent="sky"
            icon="✅"
          />
        </div>
      )}

      <div className="mt-8">
        <h2 className="section-heading mb-3">My Events</h2>

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Spinner /> <span>Loading...</span>
          </div>
        )}

        {events && events.length === 0 && (
          <EmptyState
            icon="🗓️"
            title="You haven't created any events yet"
            description="Create your first event to get started."
            action={
              <Link to="/organizer/events/new">
                <Button>+ Create Event</Button>
              </Link>
            }
          />
        )}

        {events && events.length > 0 && (
          <Card className="overflow-x-auto p-0">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Venue</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Seats</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {events.map((event) => (
                  <tr
                    key={event._id}
                    className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                      {event.name}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      {new Date(event.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      {event.venue}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          event.status === "published"
                            ? "success"
                            : event.status === "cancelled"
                            ? "danger"
                            : "neutral"
                        }
                      >
                        {event.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      {(event.capacity ?? 0) - (event.ticketsSold ?? 0)}/
                      {event.capacity}
                    </td>
                    <td className="px-4 py-3 text-right space-x-3">
                      <Link
                        to={`/organizer/events/${event._id}/dashboard`}
                        className="text-accent hover:underline"
                      >
                        Dashboard
                      </Link>
                      <Link
                        to={`/organizer/events/${event._id}/edit`}
                        className="text-accent hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(event._id, event.name)}
                        className="text-rose-600 hover:underline dark:text-rose-400"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OrganizerDashboard;
