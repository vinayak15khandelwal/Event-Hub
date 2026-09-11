import { Navigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import Spinner from "./ui/Spinner";

// Wrap any route element: <ProtectedRoute roles={["organizer"]}><Dashboard /></ProtectedRoute>
// Omit `roles` to just require any authenticated user.
const ProtectedRoute = ({ children, roles }) => {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
        <Spinner />
        <span>Checking session...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
