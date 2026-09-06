import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useAuthStore from "../store/authStore";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const { login, error } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await login(form);
    setSubmitting(false);
    if (result.success) navigate("/");
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-950 text-slate-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg bg-slate-900 p-6"
      >
        <h1 className="text-xl font-semibold">Log in</h1>

        {error && (
          <p className="rounded-md bg-red-950 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <div>
          <label className="mb-1 block text-sm text-slate-400">Email</label>
          <input
            type="email"
            name="email"
            required
            value={form.email}
            onChange={handleChange}
            className="w-full rounded-md bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-400">Password</label>
          <input
            type="password"
            name="password"
            required
            value={form.password}
            onChange={handleChange}
            className="w-full rounded-md bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-indigo-600 py-2 font-medium hover:bg-indigo-500 disabled:opacity-50"
        >
          {submitting ? "Logging in..." : "Log in"}
        </button>

        <p className="text-center text-sm text-slate-400">
          No account?{" "}
          <Link to="/register" className="text-indigo-400 hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
