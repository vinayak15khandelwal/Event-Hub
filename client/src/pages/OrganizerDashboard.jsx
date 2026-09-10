import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../store/authStore";
import { fetchMyEvents, deleteEvent } from "../api/events";

const OrganizerDashboard = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: events, isLoading } = useQuery({
    queryKey: ["my-events"],
    queryFn: fetchMyEvents,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-events"] }),
  });

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete "${name}"? This cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="min-h-[80vh] bg-slate-950 text-slate-100 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Organizer Dashboard</h1>
          <p className="mt-1 text-slate-400">Welcome, {user.name}</p>
        </div>
        <Link
          to="/organizer/events/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500"
        >
          + Create Event
        </Link>
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-slate-400">My Events</h2>

        {isLoading && <p className="text-slate-400">Loading...</p>}

        {events && events.length === 0 && (
          <p className="text-slate-500">
            You haven't created any events yet.
          </p>
        )}

        {events && events.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900 text-slate-400">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Venue</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Seats</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event._id} className="border-t border-slate-800">
                    <td className="px-4 py-3">{event.name}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(event.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{event.venue}</td>
                    <td className="px-4 py-3 capitalize text-slate-400">
                      {event.status}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {(event.capacity ?? 0) - (event.ticketsSold ?? 0)}/
                      {event.capacity}
                    </td>
                    <td className="px-4 py-3 text-right space-x-3">
                      <Link
                        to={`/organizer/events/${event._id}/edit`}
                        className="text-indigo-400 hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(event._id, event.name)}
                        className="text-red-400 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizerDashboard;
