import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useAuthStore from "../store/authStore";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import { inputClasses, labelClasses } from "../components/ui/formClasses";

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
    <div className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-4">
      <div className="bg-glow-blob pointer-events-none absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 opacity-40" aria-hidden="true" />
      <Card className="animate-scale-in relative w-full max-w-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Create an account
          </h1>

          {error && <Alert variant="error">{error}</Alert>}

          <div>
            <label className={labelClasses}>Name</label>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              className={inputClasses}
            />
          </div>

          <div>
            <label className={labelClasses}>Email</label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              className={inputClasses}
            />
          </div>

          <div>
            <label className={labelClasses}>Password</label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              value={form.password}
              onChange={handleChange}
              className={inputClasses}
            />
          </div>

          <div>
            <label className={labelClasses}>I am a...</label>
            <div className="grid grid-cols-2 gap-2">
              {["attendee", "organizer"].map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setForm({ ...form, role: r })}
                  className={`rounded-lg border px-3 py-2 text-sm capitalize transition-colors ${
                    form.role === r
                      ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                      : "border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" loading={submitting} className="w-full">
            {submitting ? "Creating account..." : "Sign up"}
          </Button>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="text-brand-600 hover:underline dark:text-brand-400">
              Log in
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
};

export default Register;
