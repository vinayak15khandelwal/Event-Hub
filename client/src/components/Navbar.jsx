import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import ThemeToggle from "./ThemeToggle";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          to="/"
          className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100"
        >
          EventHub
        </Link>

        <div className="flex items-center gap-1 text-sm sm:gap-3">
          <Link
            to="/events"
            className="rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            Events
          </Link>

          {!isAuthenticated && (
            <>
              <Link
                to="/login"
                className="rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-md bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-500"
              >
                Sign up
              </Link>
            </>
          )}

          {isAuthenticated && user.role === "attendee" && (
            <Link
              to="/attendee"
              className="rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              My Tickets
            </Link>
          )}

          {isAuthenticated && user.role === "organizer" && (
            <Link
              to="/organizer"
              className="rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              Dashboard
            </Link>
          )}

          {isAuthenticated && (
            <>
              <span className="hidden text-slate-400 dark:text-slate-600 sm:inline">
                |
              </span>
              <span className="hidden text-slate-500 dark:text-slate-500 sm:inline">
                {user.name}{" "}
                <span className="uppercase text-xs">({user.role})</span>
              </span>
              <button
                onClick={handleLogout}
                className="rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                Log out
              </button>
            </>
          )}

          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
