import { Navigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

// Wrap any route element: <ProtectedRoute roles={["organizer"]}><Dashboard /></ProtectedRoute>
// Omit `roles` to just require any authenticated user.
const ProtectedRoute = ({ children, roles }) => {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        Checking session...
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
