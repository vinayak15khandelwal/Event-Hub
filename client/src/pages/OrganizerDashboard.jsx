import useAuthStore from "../store/authStore";

const OrganizerDashboard = () => {
  const { user } = useAuthStore();
  return (
    <div className="min-h-[80vh] bg-slate-950 text-slate-100 p-8">
      <h1 className="text-2xl font-semibold">Organizer Dashboard</h1>
      <p className="mt-2 text-slate-400">
        Welcome, {user.name}. Event management (Day 3), analytics and
        attendee roster (Day 6) will live here.
      </p>
    </div>
  );
};

export default OrganizerDashboard;
