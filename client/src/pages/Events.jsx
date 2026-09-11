import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchEvents } from "../api/events";
import { CATEGORIES } from "../constants/categories";
import EventCard from "../components/EventCard";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import EmptyState from "../components/ui/EmptyState";
import Spinner from "../components/ui/Spinner";
import { inputClasses } from "../components/ui/formClasses";

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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
        Discover Events
      </h1>

      <Card className="mt-4 grid grid-cols-1 gap-3 p-4 sm:grid-cols-4">
        <input
          name="search"
          placeholder="Search by name or venue..."
          value={filters.search}
          onChange={handleFilterChange}
          className={`${inputClasses} sm:col-span-2`}
        />
        <select
          name="category"
          value={filters.category}
          onChange={handleFilterChange}
          className={inputClasses}
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
          className={inputClasses}
        />
      </Card>

      {isLoading && (
        <div className="mt-10 flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
          <Spinner /> <span>Loading events...</span>
        </div>
      )}

      {isError && (
        <Alert variant="error" className="mt-6">
          Couldn't load events. Please try again shortly.
        </Alert>
      )}

      {data && (
        <>
          {data.events.length === 0 ? (
            <EmptyState
              title="No events found"
              description="Try adjusting your search or filters."
              className="mt-8"
            />
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.events.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
          )}

          {data.pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3 text-sm">
              <Button
                variant="secondary"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
              >
                Prev
              </Button>
              <span className="text-slate-500 dark:text-slate-400">
                Page {data.pagination.page} of {data.pagination.pages}
              </span>
              <Button
                variant="secondary"
                onClick={() => setPage((p) => Math.min(p + 1, data.pagination.pages))}
                disabled={page === data.pagination.pages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Events;
