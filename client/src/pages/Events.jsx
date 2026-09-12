import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchEvents } from "../api/events";
import { CATEGORIES } from "../constants/categories";
import EventCard from "../components/EventCard";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import EmptyState from "../components/ui/EmptyState";
import { SkeletonCard } from "../components/ui/Skeleton";
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
    <div className="page-container py-8 sm:py-10">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
        Discover Events
      </h1>
      <p className="mt-1 text-slate-500 dark:text-slate-400">
        Filter by category, date, or search to find your next conference.
      </p>

      <Card className="mt-6 grid grid-cols-1 gap-3 p-4 sm:grid-cols-4">
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

      {data && !isLoading && (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-500">
          {data.pagination.total} event{data.pagination.total !== 1 ? "s" : ""} found
        </p>
      )}

      {isLoading && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
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
            <div className="mt-8 flex items-center justify-center gap-3 text-sm">
              <Button
                variant="secondary"
                size="sm"
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
                size="sm"
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
