import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchBookingById } from "../api/bookings";
import Card from "../components/ui/Card";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";

const Confirmation = () => {
  const { id } = useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["booking", id],
    queryFn: () => fetchBookingById(id),
  });

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

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Alert variant="success">Booking confirmed! Your tickets are below.</Alert>

      <div className="mt-6">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          {booking.event.name}
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          {new Date(booking.event.date).toLocaleString()} · {booking.event.venue}
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">
          Booking ID: {booking._id} · Total paid: ₹{booking.totalAmount}
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {tickets.map((ticket) => (
          <Card
            key={ticket._id}
            className="flex flex-col items-center gap-4 p-4 sm:flex-row sm:items-center"
          >
            <img
              src={ticket.qrCodeDataUrl}
              alt={`QR code for ticket ${ticket._id}`}
              className="h-28 w-28 shrink-0 rounded-md bg-white p-1.5"
            />
            <div className="text-center sm:text-left">
              <p className="font-medium text-slate-900 dark:text-slate-100">
                Seat {ticket.seat?.label} · {ticket.tierName}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                ₹{ticket.price}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-600">
                Show this QR code at check-in
              </p>
            </div>
          </Card>
        ))}
      </div>

      <Link to="/attendee" className="mt-6 inline-block">
        <Button variant="secondary">Go to My Tickets</Button>
      </Link>
    </div>
  );
};

export default Confirmation;
