import { useState } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchEventById } from "../api/events";
import { createBooking } from "../api/bookings";

const Checkout = () => {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  // Seat objects passed via navigation state from EventDetails - avoids an
  // extra round trip since SeatMap already knows exactly what's held.
  const heldSeats = location.state?.heldSeats || [];

  const [card, setCard] = useState({ number: "", expiry: "", cvv: "", name: "" });
  const [error, setError] = useState("");

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => fetchEventById(eventId),
  });

  const mutation = useMutation({
    mutationFn: createBooking,
    onSuccess: (data) => {
      navigate(`/bookings/${data.booking._id}/confirmation`);
    },
    onError: (err) => {
      setError(
        err.response?.data?.message || "Booking failed - please try again."
      );
    },
  });

  if (heldSeats.length === 0) {
    return (
      <div className="min-h-[80vh] bg-slate-950 text-slate-100 p-8">
        <p>No seats selected for checkout.</p>
        <Link to={`/events/${eventId}`} className="text-indigo-400 hover:underline">
          Back to seat selection
        </Link>
      </div>
    );
  }

  const priceFor = (tierName) =>
    event?.priceTiers.find((t) => t.name === tierName)?.price || 0;
  const total = heldSeats.reduce((sum, s) => sum + priceFor(s.tierName), 0);

  const handlePayment = (e) => {
    e.preventDefault();
    setError("");
    // Mock payment step - no real gateway. Any well-formed input "succeeds";
    // the actual booking commit (transaction) happens server-side.
    mutation.mutate({ eventId, seatIds: heldSeats.map((s) => s._id) });
  };

  return (
    <div className="min-h-[80vh] bg-slate-950 text-slate-100 p-8">
      <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
        <div>
          <h1 className="text-xl font-semibold">Order Summary</h1>
          {isLoading ? (
            <p className="mt-2 text-slate-400">Loading...</p>
          ) : (
            <>
              <p className="mt-1 text-slate-400">{event.name}</p>
              <p className="text-sm text-slate-500">
                {new Date(event.date).toLocaleString()} · {event.venue}
              </p>

              <div className="mt-4 space-y-2">
                {heldSeats.map((seat) => (
                  <div
                    key={seat._id}
                    className="flex items-center justify-between rounded-md bg-slate-900 px-4 py-2 text-sm"
                  >
                    <span>
                      Seat {seat.label} · {seat.tierName}
                    </span>
                    <span className="text-indigo-400">₹{priceFor(seat.tierName)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-4 text-lg font-semibold">
                <span>Total</span>
                <span>₹{total}</span>
              </div>
            </>
          )}
        </div>

        <form onSubmit={handlePayment} className="space-y-4 rounded-lg bg-slate-900 p-6">
          <h2 className="text-lg font-semibold">Payment</h2>
          <p className="text-xs text-slate-500">
            Mock payment step - no real card is charged.
          </p>

          {error && (
            <p className="rounded-md bg-red-950 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <div>
            <label className="mb-1 block text-sm text-slate-400">
              Name on card
            </label>
            <input
              required
              value={card.name}
              onChange={(e) => setCard({ ...card, name: e.target.value })}
              className="w-full rounded-md bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-400">
              Card number
            </label>
            <input
              required
              placeholder="4242 4242 4242 4242"
              maxLength={19}
              value={card.number}
              onChange={(e) => setCard({ ...card, number: e.target.value })}
              className="w-full rounded-md bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-slate-400">Expiry</label>
              <input
                required
                placeholder="MM/YY"
                maxLength={5}
                value={card.expiry}
                onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                className="w-full rounded-md bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">CVV</label>
              <input
                required
                maxLength={3}
                value={card.cvv}
                onChange={(e) => setCard({ ...card, cvv: e.target.value })}
                className="w-full rounded-md bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full rounded-md bg-indigo-600 py-2 font-medium hover:bg-indigo-500 disabled:opacity-50"
          >
            {mutation.isPending ? "Processing..." : `Pay ₹${total}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
