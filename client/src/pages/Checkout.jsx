import { useState } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchEventById } from "../api/events";
import { createBooking } from "../api/bookings";
import CardExpiryInput, { isExpiryValid } from "../components/CardExpiryInput";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import Spinner from "../components/ui/Spinner";
import { inputClasses, labelClasses } from "../components/ui/formClasses";

const Checkout = () => {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  // Seat objects passed via navigation state from EventDetails - avoids an
  // extra round trip since SeatMap already knows exactly what's held.
  const heldSeats = location.state?.heldSeats || [];

  const [card, setCard] = useState({
    number: "",
    name: "",
    cvv: "",
    expiryMonth: "",
    expiryYear: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
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
      <div className="mx-auto max-w-lg px-4 py-8">
        <p className="text-slate-900 dark:text-slate-100">
          No seats selected for checkout.
        </p>
        <Link
          to={`/events/${eventId}`}
          className="text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Back to seat selection
        </Link>
      </div>
    );
  }

  const priceFor = (tierName) =>
    event?.priceTiers.find((t) => t.name === tierName)?.price || 0;
  const total = heldSeats.reduce((sum, s) => sum + priceFor(s.tierName), 0);

  const validate = () => {
    const errs = {};
    if (!card.name.trim()) errs.name = "Name on card is required";
    if (!/^\d{13,19}$/.test(card.number.replace(/\s/g, "")))
      errs.number = "Enter a valid card number (13-19 digits)";
    if (!/^\d{3,4}$/.test(card.cvv)) errs.cvv = "Enter a valid CVV";
    if (!isExpiryValid(card.expiryMonth, card.expiryYear))
      errs.expiry = "Select a valid, non-expired month/year";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePayment = (e) => {
    e.preventDefault();
    setError("");
    // Mock payment step - no real gateway. Client-side validation only
    // gates the UX; the booking commit (transaction) and final price are
    // computed and enforced server-side regardless of what's shown here.
    if (!validate()) return;
    mutation.mutate({ eventId, seatIds: heldSeats.map((s) => s._id) });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
        Checkout
      </h1>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Order Summary
          </h2>

          {isLoading ? (
            <div className="mt-4 flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Spinner /> <span>Loading...</span>
            </div>
          ) : (
            <>
              <p className="mt-3 font-medium text-slate-900 dark:text-slate-100">
                {event.name}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {new Date(event.date).toLocaleString()} · {event.venue}
              </p>

              <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
                {heldSeats.map((seat) => (
                  <div
                    key={seat._id}
                    className="flex items-center justify-between py-2.5 text-sm"
                  >
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        Seat {seat.label}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500">
                        {seat.tierName}
                      </p>
                    </div>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      ₹{priceFor(seat.tierName)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-1 border-t border-slate-200 pt-4 text-sm dark:border-slate-800">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span>₹{total}</span>
                </div>
                <div className="flex items-center justify-between text-lg font-semibold text-slate-900 dark:text-slate-100">
                  <span>Total</span>
                  <span>₹{total}</span>
                </div>
              </div>
            </>
          )}
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Payment
            </h2>
          </div>
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
            Mock payment — no real card is charged.
          </p>

          <form onSubmit={handlePayment} className="mt-4 space-y-4">
            {error && <Alert variant="error">{error}</Alert>}

            <div>
              <label className={labelClasses}>Name on card</label>
              <input
                value={card.name}
                onChange={(e) => setCard({ ...card, name: e.target.value })}
                className={inputClasses}
                placeholder="Priya Sharma"
              />
              {fieldErrors.name && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {fieldErrors.name}
                </p>
              )}
            </div>

            <div>
              <label className={labelClasses}>Card number</label>
              <input
                inputMode="numeric"
                placeholder="4242 4242 4242 4242"
                maxLength={19}
                value={card.number}
                onChange={(e) => setCard({ ...card, number: e.target.value })}
                className={inputClasses}
              />
              {fieldErrors.number && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {fieldErrors.number}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <CardExpiryInput
                month={card.expiryMonth}
                year={card.expiryYear}
                onChange={({ month, year }) =>
                  setCard({ ...card, expiryMonth: month, expiryYear: year })
                }
                error={fieldErrors.expiry}
              />
              <div>
                <label className={labelClasses}>CVV</label>
                <input
                  inputMode="numeric"
                  maxLength={4}
                  value={card.cvv}
                  onChange={(e) => setCard({ ...card, cvv: e.target.value })}
                  className={inputClasses}
                  placeholder="123"
                />
                {fieldErrors.cvv && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {fieldErrors.cvv}
                  </p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={mutation.isPending}
              className="w-full py-3"
            >
              {mutation.isPending ? (
                <>
                  <Spinner className="h-4 w-4" /> Processing...
                </>
              ) : (
                `Pay ₹${total}`
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Checkout;
