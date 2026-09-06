import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useAuthStore from "../store/authStore";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "attendee",
  });
  const [submitting, setSubmitting] = useState(false);
  const { register, error } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await register(form);
    setSubmitting(false);
    if (result.success) navigate("/");
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-950 text-slate-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg bg-slate-900 p-6"
      >
        <h1 className="text-xl font-semibold">Create an account</h1>

        {error && (
          <p className="rounded-md bg-red-950 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <div>
          <label className="mb-1 block text-sm text-slate-400">Name</label>
          <input
            type="text"
            name="name"
            required
            value={form.name}
            onChange={handleChange}
            className="w-full rounded-md bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

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
            minLength={6}
            value={form.password}
            onChange={handleChange}
            className="w-full rounded-md bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-slate-400">I am a...</label>
          <div className="grid grid-cols-2 gap-2">
            {["attendee", "organizer"].map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setForm({ ...form, role: r })}
                className={`rounded-md border px-3 py-2 text-sm capitalize ${
                  form.role === r
                    ? "border-indigo-500 bg-indigo-950 text-indigo-300"
                    : "border-slate-700 text-slate-400"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-indigo-600 py-2 font-medium hover:bg-indigo-500 disabled:opacity-50"
        >
          {submitting ? "Creating account..." : "Sign up"}
        </button>

        <p className="text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-400 hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
