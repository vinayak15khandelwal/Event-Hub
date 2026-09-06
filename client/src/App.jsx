import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import useAuthStore from "./store/authStore";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AttendeeDashboard from "./pages/AttendeeDashboard";
import OrganizerDashboard from "./pages/OrganizerDashboard";

function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  // On app load, ask the backend if the httpOnly cookie still represents
  // a valid session - the token itself is never readable from JS.
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/attendee"
          element={
            <ProtectedRoute roles={["attendee"]}>
              <AttendeeDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer"
          element={
            <ProtectedRoute roles={["organizer"]}>
              <OrganizerDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
