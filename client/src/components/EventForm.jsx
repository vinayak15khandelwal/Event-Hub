import { useState } from "react";
import { CATEGORIES } from "../constants/categories";

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
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl space-y-4 rounded-lg bg-slate-900 p-6"
    >
      {error && (
        <p className="rounded-md bg-red-950 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <div>
        <label className="mb-1 block text-sm text-slate-400">Event name</label>
        <input
          name="name"
          required
          value={form.name}
          onChange={handleChange}
          className="w-full rounded-md bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-slate-400">Description</label>
        <textarea
          name="description"
          rows={3}
          value={form.description}
          onChange={handleChange}
          className="w-full rounded-md bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm text-slate-400">Category</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full rounded-md bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-400">Date & time</label>
          <input
            type="datetime-local"
            name="date"
            required
            value={form.date}
            onChange={handleChange}
            className="w-full rounded-md bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm text-slate-400">Venue</label>
          <input
            name="venue"
            required
            value={form.venue}
            onChange={handleChange}
            className="w-full rounded-md bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-400">Capacity</label>
          <input
            type="number"
            name="capacity"
            required
            min={1}
            value={form.capacity}
            onChange={handleChange}
            className="w-full rounded-md bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm text-slate-400">Price tiers</label>
          <button
            type="button"
            onClick={addTier}
            className="text-xs text-indigo-400 hover:underline"
          >
            + Add tier
          </button>
        </div>

        <div className="space-y-2">
          {form.priceTiers.map((tier, i) => (
            <div key={i} className="grid grid-cols-8 gap-2">
              <input
                placeholder="Tier name (e.g. General)"
                required
                value={tier.name}
                onChange={(e) => handleTierChange(i, "name", e.target.value)}
                className="col-span-3 rounded-md bg-slate-800 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="number"
                placeholder="Price (₹)"
                required
                min={0}
                value={tier.price}
                onChange={(e) => handleTierChange(i, "price", e.target.value)}
                className="col-span-2 rounded-md bg-slate-800 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="number"
                placeholder="Qty"
                required
                min={1}
                value={tier.quantity}
                onChange={(e) => handleTierChange(i, "quantity", e.target.value)}
                className="col-span-2 rounded-md bg-slate-800 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {form.priceTiers.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTier(i)}
                  className="col-span-1 text-red-400 hover:text-red-300"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-indigo-600 py-2 font-medium hover:bg-indigo-500 disabled:opacity-50"
      >
        {submitting ? "Saving..." : submitLabel}
      </button>
    </form>
  );
};

export default EventForm;
