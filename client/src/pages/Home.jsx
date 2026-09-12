import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import useAuthStore from "../store/authStore";
import { fetchEvents } from "../api/events";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EventCard from "../components/EventCard";
import { SkeletonCard } from "../components/ui/Skeleton";

const VALUE_PROPS = [
  {
    title: "Real-time seat selection",
    description:
      "An interactive seating chart with live availability - no double-booked seats, ever.",
    accent: "brand",
  },
  {
    title: "Secure, signed tickets",
    description:
      "Every ticket's QR code is a cryptographically signed token, verified at check-in.",
    accent: "emerald",
  },
  {
    title: "Built for organizers",
    description:
      "Revenue analytics, attendee rosters, CSV export, and announcements in one dashboard.",
    accent: "violet",
  },
];

const STEPS = [
  { label: "Discover", description: "Browse events by category, date, or search." },
  { label: "Select", description: "Pick your seat and tier on a live seating chart." },
  { label: "Book", description: "Checkout securely and get your signed QR ticket instantly." },
];

const accentClasses = {
  brand: "bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400",
  emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  violet: "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
};

const Home = () => {
  const { user, isAuthenticated } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ["events", "featured"],
    queryFn: () => fetchEvents({ limit: 3 }),
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="bg-glow-blob pointer-events-none absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 opacity-60 dark:opacity-40"
          aria-hidden="true"
        />
        <div
          className="bg-grid-pattern pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]"
          aria-hidden="true"
        />

        <div className="page-container relative flex flex-col items-center py-20 text-center sm:py-28">
          {isAuthenticated ? (
            <p className="animate-fade-in-up mb-4 text-sm text-slate-500 dark:text-slate-400">
              Welcome back, {user.name} · <span className="uppercase">{user.role}</span>
            </p>
          ) : (
            <span className="animate-fade-in-up mb-4 inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              Real-time seats · Secure tickets · Built for organizers
            </span>
          )}

          <h1 className="animate-fade-in-up max-w-2xl text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl">
            Tech events,{" "}
            <span className="gradient-text">booked in seconds</span>
          </h1>

          <p className="animate-fade-in-up mt-4 max-w-xl text-lg text-slate-600 dark:text-slate-400">
            Discover conferences, pick your exact seat on a live seating chart,
            and get a secure digital ticket - all in one place.
          </p>

          <div className="animate-fade-in-up mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/events">
              <Button size="lg">Browse Events</Button>
            </Link>
            {!isAuthenticated && (
              <Link to="/register">
                <Button variant="secondary" size="lg">
                  Create an account
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Featured events */}
      <section className="page-container py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="section-heading">Featured Events</h2>
            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
              Happening soon
            </p>
          </div>
          <Link to="/events" className="text-sm font-medium text-accent hover:underline">
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          {data?.events?.length === 0 && (
            <p className="col-span-3 text-sm text-slate-500 dark:text-slate-500">
              No events yet - check back soon.
            </p>
          )}
          {data?.events?.map((event) => (
            <EventCard key={event._id} event={event} />
          ))}
        </div>
      </section>

      {/* Why EventHub */}
      <section className="page-container py-12">
        <h2 className="section-heading text-center">Why EventHub</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {VALUE_PROPS.map((v) => (
            <Card key={v.title} hover className="p-5">
              <div
                className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold ${accentClasses[v.accent]}`}
              >
                ✦
              </div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{v.title}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {v.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="page-container py-12">
        <h2 className="section-heading text-center">How It Works</h2>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.label} className="relative text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                {i + 1}
              </div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{step.label}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      {!isAuthenticated && (
        <section className="page-container pb-20 pt-4">
          <Card className="relative overflow-hidden p-8 text-center sm:p-12">
            <div
              className="bg-glow-blob pointer-events-none absolute -right-16 -top-16 h-56 w-56 opacity-40"
              aria-hidden="true"
            />
            <h2 className="relative text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-3xl">
              Ready to book your next conference?
            </h2>
            <p className="relative mx-auto mt-2 max-w-md text-slate-600 dark:text-slate-400">
              Create a free account as an attendee, or set up your first event as an organizer.
            </p>
            <div className="relative mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link to="/register">
                <Button size="lg">Get Started</Button>
              </Link>
            </div>
          </Card>
        </section>
      )}
    </div>
  );
};

export default Home;
