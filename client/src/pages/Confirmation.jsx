import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchBookingById } from "../api/bookings";
import { toast } from "../store/toastStore";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";

const SuccessCheck = () => (
  <div className="animate-scale-in mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
    <svg viewBox="0 0 24 24" className="h-8 w-8 text-emerald-600 dark:text-emerald-400" fill="none">
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="48"
        className="animate-check-draw"
      />
    </svg>
  </div>
);

const Confirmation = () => {
  const { id } = useParams();
  const [visibleTokenId, setVisibleTokenId] = useState(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["booking", id],
    queryFn: () => fetchBookingById(id),
  });

  const copyToken = async (token) => {
    try {
      await navigator.clipboard.writeText(token);
      toast.success("QR token copied");
    } catch {
      toast.error("Couldn't copy - select and copy the text manually");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
        <Spinner /> <span>Loading...</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-slate-900 dark:text-slate-100">Booking not found.</p>
      </div>
    );
  }

  const { booking, tickets } = data;
  const isCancelled = booking.status === "cancelled";

  return (
    <div className="page-container py-10 sm:py-14">
      <div className="mx-auto max-w-2xl text-center">
        {isCancelled ? (
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-2xl dark:bg-slate-800">
            ✕
          </div>
        ) : (
          <SuccessCheck />
        )}
        <h1 className="animate-fade-in-up mt-4 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          {isCancelled ? "Booking Cancelled" : "Booking Confirmed"}
        </h1>
        <p className="animate-fade-in-up mt-1 text-slate-500 dark:text-slate-400">
          {isCancelled
            ? "This booking was cancelled and the payment was refunded (simulated)."
            : "Your tickets are ready - see them below."}
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-2xl">
        <Card className="p-5 sm:p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {booking.event.name}
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            {new Date(booking.event.date).toLocaleString()} · {booking.event.venue}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-500">
            <span>
              Booking ID:{" "}
              <span className="font-mono text-slate-700 dark:text-slate-300">{booking._id}</span>
            </span>
            <span>
              Total paid:{" "}
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                ₹{booking.totalAmount}
              </span>
            </span>
          </div>
        </Card>

        <h3 className="section-heading mb-3 mt-8">Your Tickets</h3>
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Card
              key={ticket._id}
              className="flex flex-col items-center gap-5 overflow-hidden p-5 sm:flex-row"
            >
              <div className="rounded-lg bg-white p-2 shadow-sm">
                <img
                  src={ticket.qrCodeDataUrl}
                  alt={`QR code for ticket ${ticket._id}`}
                  className="h-28 w-28 shrink-0"
                />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Seat {ticket.seat?.label}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{ticket.tierName}</p>
                <p className="mt-1 text-xl font-bold text-accent">₹{ticket.price}</p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-600">
                  Show this QR code at check-in
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setVisibleTokenId(visibleTokenId === ticket._id ? null : ticket._id)
                  }
                  className="mt-2 text-xs font-medium text-accent hover:underline"
                >
                  {visibleTokenId === ticket._id ? "Hide" : "Show"} QR token (for manual check-in)
                </button>
                {visibleTokenId === ticket._id && (
                  <div className="mt-2 space-y-2">
                    <p className="break-all rounded-md bg-slate-100 p-2 font-mono text-[10px] leading-relaxed text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {ticket.qrToken}
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => copyToken(ticket.qrToken)}
                    >
                      Copy Token
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Link to="/attendee">
            <Button variant="secondary">Go to My Tickets</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Confirmation;
