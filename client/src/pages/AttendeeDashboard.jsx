import useAuthStore from "../store/authStore";

const AttendeeDashboard = () => {
  const { user } = useAuthStore();
  return (
    <div className="min-h-[80vh] bg-slate-950 text-slate-100 p-8">
      <h1 className="text-2xl font-semibold">Welcome, {user.name}</h1>
      <p className="mt-2 text-slate-400">
        Your tickets and event discovery will live here (Day 8).
      </p>
    </div>
  );
};

export default AttendeeDashboard;
