import { useState } from "react";
import { CATEGORIES } from "../constants/categories";
import Card from "./ui/Card";
import Button from "./ui/Button";
import Alert from "./ui/Alert";
import { inputClasses, labelClasses } from "./ui/formClasses";

const emptyTier = () => ({ name: "", price: "", quantity: "" });

// Formats a Date/ISO-string into the value <input type="datetime-local"> needs
const toDatetimeLocal = (value) => {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

const EventForm = ({ initialValues, onSubmit, submitLabel = "Save Event" }) => {
  const [form, setForm] = useState({
    name: initialValues?.name || "",
    description: initialValues?.description || "",
    category: initialValues?.category || "web-dev",
    date: toDatetimeLocal(initialValues?.date) || "",
    venue: initialValues?.venue || "",
    capacity: initialValues?.capacity || "",
    priceTiers:
      initialValues?.priceTiers?.length > 0
        ? initialValues.priceTiers.map((t) => ({
            name: t.name,
            price: t.price,
            quantity: t.quantity,
          }))
        : [emptyTier()],
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleTierChange = (index, field, value) => {
    const tiers = [...form.priceTiers];
    tiers[index] = { ...tiers[index], [field]: value };
    setForm({ ...form, priceTiers: tiers });
  };

  const addTier = () =>
    setForm({ ...form, priceTiers: [...form.priceTiers, emptyTier()] });

  const removeTier = (index) =>
    setForm({
      ...form,
      priceTiers: form.priceTiers.filter((_, i) => i !== index),
    });

  const tierQuantityTotal = form.priceTiers.reduce(
    (sum, t) => sum + (Number(t.quantity) || 0),
    0
  );
  const capacityMismatch =
    form.capacity !== "" && Number(form.capacity) !== tierQuantityTotal;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        capacity: Number(form.capacity),
        priceTiers: form.priceTiers.map((t) => ({
          name: t.name,
          price: Number(t.price),
          quantity: Number(t.quantity),
        })),
      });
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl p-5 sm:p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        <div>
          <label className={labelClasses}>Event name <span className="text-rose-500">*</span></label>
          <input
            name="name"
            required
            value={form.name}
            onChange={handleChange}
            className={inputClasses}
          />
        </div>

        <div>
          <label className={labelClasses}>Description</label>
          <textarea
            name="description"
            rows={3}
            value={form.description}
            onChange={handleChange}
            className={inputClasses}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClasses}>Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className={inputClasses}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClasses}>Date & time <span className="text-rose-500">*</span></label>
            <input
              type="datetime-local"
              name="date"
              required
              value={form.date}
              onChange={handleChange}
              className={inputClasses}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClasses}>Venue <span className="text-rose-500">*</span></label>
            <input
              name="venue"
              required
              value={form.venue}
              onChange={handleChange}
              className={inputClasses}
            />
          </div>

          <div>
            <label className={labelClasses}>Capacity <span className="text-rose-500">*</span></label>
            <input
              type="number"
              name="capacity"
              required
              min={1}
              value={form.capacity}
              onChange={handleChange}
              className={inputClasses}
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">
              Price tiers
            </label>
            <button
              type="button"
              onClick={addTier}
              className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              + Add tier
            </button>
          </div>

          <div className="space-y-2">
            {form.priceTiers.map((tier, i) => (
              <div
                key={i}
                className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 p-2 dark:border-slate-800 sm:grid-cols-8 sm:border-0 sm:p-0"
              >
                <input
                  placeholder="Tier name (e.g. General)"
                  required
                  value={tier.name}
                  onChange={(e) => handleTierChange(i, "name", e.target.value)}
                  className={`col-span-2 sm:col-span-3 ${inputClasses} py-1.5 text-sm`}
                />
                <input
                  type="number"
                  placeholder="Price (₹)"
                  required
                  min={0}
                  value={tier.price}
                  onChange={(e) => handleTierChange(i, "price", e.target.value)}
                  className={`${inputClasses} sm:col-span-2 py-1.5 text-sm`}
                />
                <input
                  type="number"
                  placeholder="Qty"
                  required
                  min={1}
                  value={tier.quantity}
                  onChange={(e) => handleTierChange(i, "quantity", e.target.value)}
                  className={`${inputClasses} sm:col-span-2 py-1.5 text-sm`}
                />
                {form.priceTiers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTier(i)}
                    className="col-span-2 justify-self-start text-sm text-rose-500 hover:text-rose-400 sm:col-span-1 sm:justify-self-center"
                    aria-label="Remove tier"
                  >
                    <span className="sm:hidden">Remove tier</span>
                    <span className="hidden sm:inline">✕</span>
                  </button>
                )}
              </div>
            ))}
          </div>

          <p
            className={`mt-2 text-xs ${
              capacityMismatch
                ? "text-amber-600 dark:text-amber-400"
                : "text-slate-500 dark:text-slate-500"
            }`}
          >
            Tier quantities total {tierQuantityTotal}
            {form.capacity !== "" ? ` of ${form.capacity} capacity` : ""}
            {capacityMismatch &&
              " - these must match exactly, or the server will reject this."}
          </p>
        </div>

        <Button type="submit" disabled={submitting} className="w-full py-3">
          {submitting ? "Saving..." : submitLabel}
        </Button>
      </form>
    </Card>
  );
};

export default EventForm;
