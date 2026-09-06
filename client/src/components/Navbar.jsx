import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
      <Link to="/" className="text-lg font-semibold text-slate-100">
        EventHub
      </Link>

      <div className="flex items-center gap-4 text-sm">
        {!isAuthenticated && (
          <>
            <Link to="/login" className="text-slate-300 hover:text-white">
              Log in
            </Link>
            <Link
              to="/register"
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-500"
            >
              Sign up
            </Link>
          </>
        )}

        {isAuthenticated && user.role === "attendee" && (
          <Link to="/attendee" className="text-slate-300 hover:text-white">
            My Tickets
          </Link>
        )}

        {isAuthenticated && user.role === "organizer" && (
          <Link to="/organizer" className="text-slate-300 hover:text-white">
            Organizer Dashboard
          </Link>
        )}

        {isAuthenticated && (
          <>
            <span className="text-slate-500">
              {user.name} · <span className="uppercase text-xs">{user.role}</span>
            </span>
            <button
              onClick={handleLogout}
              className="text-slate-300 hover:text-white"
            >
              Log out
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
