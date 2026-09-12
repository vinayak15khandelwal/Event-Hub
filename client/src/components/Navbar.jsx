import { Link, NavLink, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import ThemeToggle from "./ThemeToggle";

const navLinkClasses = ({ isActive }) =>
  `relative rounded-md px-3 py-1.5 text-sm transition-colors ${
    isActive
      ? "text-slate-900 dark:text-white"
      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
  } after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:rounded-full after:bg-brand-500 after:transition-transform after:duration-200 ${
    isActive ? "after:scale-x-100" : "after:scale-x-0"
  }`;

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/75 backdrop-blur-lg dark:border-slate-800/80 dark:bg-slate-950/75">
      <div className="page-container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-violet-500 text-sm font-bold text-white">
            E
          </span>
          <span className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
            EventHub
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <NavLink to="/events" className={navLinkClasses}>
            Events
          </NavLink>

          {!isAuthenticated && (
            <>
              <NavLink to="/login" className={navLinkClasses}>
                Log in
              </NavLink>
              <Link
                to="/register"
                className="ml-1 rounded-lg bg-brand-600 px-3.5 py-1.5 text-sm font-medium text-white transition-all hover:bg-brand-500 hover:shadow-glow"
              >
                Sign up
              </Link>
            </>
          )}

          {isAuthenticated && user.role === "attendee" && (
            <NavLink to="/attendee" className={navLinkClasses}>
              My Tickets
            </NavLink>
          )}

          {isAuthenticated && user.role === "organizer" && (
            <NavLink to="/organizer" className={navLinkClasses}>
              Dashboard
            </NavLink>
          )}

          {isAuthenticated && (
            <>
              <span className="mx-1 hidden h-4 w-px bg-slate-200 dark:bg-slate-800 sm:block" />
              <span className="hidden text-sm text-slate-500 dark:text-slate-500 sm:inline">
                {user.name}{" "}
                <span className="text-xs uppercase text-slate-400 dark:text-slate-600">
                  ({user.role})
                </span>
              </span>
              <button
                onClick={handleLogout}
                className="rounded-md px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
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
