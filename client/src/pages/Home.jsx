import { Link } from "react-router-dom";
import useAuthStore from "../store/authStore";
import Button from "../components/ui/Button";

const Home = () => {
  const { user, isAuthenticated } = useAuthStore();

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
        EventHub
      </h1>

      {isAuthenticated ? (
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          Welcome back, {user.name}{" "}
          <span className="uppercase text-xs">({user.role})</span>
        </p>
      ) : (
        <p className="mt-3 max-w-md text-slate-600 dark:text-slate-400">
          Discover tech conferences, pick your seat on an interactive seating
          chart, and book your ticket in minutes.
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link to="/events">
          <Button variant="primary">Browse Events</Button>
        </Link>
        {!isAuthenticated && (
          <Link to="/register">
            <Button variant="secondary">Create an account</Button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default Home;
