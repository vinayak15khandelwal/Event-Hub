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
import OrganizerEventDashboard from "./pages/OrganizerEventDashboard";
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import CreateEvent from "./pages/CreateEvent";
import EditEvent from "./pages/EditEvent";
import Checkout from "./pages/Checkout";
import Confirmation from "./pages/Confirmation";

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
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetails />} />

        <Route
          path="/attendee"
          element={
            <ProtectedRoute roles={["attendee"]}>
              <AttendeeDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/:id/checkout"
          element={
            <ProtectedRoute roles={["attendee"]}>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings/:id/confirmation"
          element={
            <ProtectedRoute roles={["attendee"]}>
              <Confirmation />
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
        <Route
          path="/organizer/events/new"
          element={
            <ProtectedRoute roles={["organizer"]}>
              <CreateEvent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/events/:id/edit"
          element={
            <ProtectedRoute roles={["organizer"]}>
              <EditEvent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/events/:id/dashboard"
          element={
            <ProtectedRoute roles={["organizer"]}>
              <OrganizerEventDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
