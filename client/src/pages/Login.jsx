import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useAuthStore from "../store/authStore";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import { inputClasses, labelClasses } from "../components/ui/formClasses";

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
    <div className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-4">
      <div className="bg-glow-blob pointer-events-none absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 opacity-40" aria-hidden="true" />
      <Card className="animate-scale-in relative w-full max-w-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Log in
          </h1>

          {error && <Alert variant="error">{error}</Alert>}

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
              value={form.password}
              onChange={handleChange}
              className={inputClasses}
            />
          </div>

          <Button type="submit" loading={submitting} className="w-full">
            {submitting ? "Logging in..." : "Log in"}
          </Button>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            No account?{" "}
            <Link to="/register" className="text-brand-600 hover:underline dark:text-brand-400">
              Sign up
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
};

export default Login;
