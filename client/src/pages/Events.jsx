import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchEvents } from "../api/events";
import { CATEGORIES } from "../constants/categories";
import EventCard from "../components/EventCard";

const Events = () => {
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    from: "",
    to: "",
  });
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["events", filters, page],
    queryFn: () => fetchEvents({ ...filters, page, limit: 9 }),
    placeholderData: keepPreviousData,
  });

  const handleFilterChange = (e) => {
    setPage(1);
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-[80vh] bg-slate-950 text-slate-100 p-8">
      <h1 className="text-2xl font-semibold">Discover Events</h1>

      <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg bg-slate-900 p-4 sm:grid-cols-4">
        <input
          name="search"
          placeholder="Search by name or venue..."
          value={filters.search}
          onChange={handleFilterChange}
          className="rounded-md bg-slate-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 sm:col-span-2"
        />
        <select
          name="category"
          value={filters.category}
          onChange={handleFilterChange}
          className="rounded-md bg-slate-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          type="date"
          name="from"
          value={filters.from}
          onChange={handleFilterChange}
          className="rounded-md bg-slate-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {isLoading && <p className="mt-8 text-slate-400">Loading events...</p>}
      {isError && (
        <p className="mt-8 text-red-400">Couldn't load events. Try again shortly.</p>
      )}

      {data && (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.events.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>

          {data.events.length === 0 && (
            <p className="mt-8 text-slate-400">No events match those filters.</p>
          )}

          {data.pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3 text-sm">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="rounded-md bg-slate-800 px-3 py-1.5 disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-slate-400">
                Page {data.pagination.page} of {data.pagination.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, data.pagination.pages))}
                disabled={page === data.pagination.pages}
                className="rounded-md bg-slate-800 px-3 py-1.5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Events;
