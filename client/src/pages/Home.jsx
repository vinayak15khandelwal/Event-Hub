import useAuthStore from "../store/authStore";

const Home = () => {
  const { user, isAuthenticated } = useAuthStore();
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-950 text-slate-100">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">EventHub</h1>
        {isAuthenticated ? (
          <p className="text-slate-400">
            Logged in as {user.name} ({user.role})
          </p>
        ) : (
          <p className="text-slate-400">
            Discover tech conferences and book your seat.
          </p>
        )}
      </div>
    </div>
  );
};

export default Home;
