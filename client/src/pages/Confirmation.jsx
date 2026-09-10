import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchBookingById } from "../api/bookings";

const Confirmation = () => {
  const { id } = useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["booking", id],
    queryFn: () => fetchBookingById(id),
  });

  if (isLoading) {
    return (
      <div className="min-h-[80vh] bg-slate-950 text-slate-400 p-8">Loading...</div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-[80vh] bg-slate-950 text-slate-100 p-8">
        <p>Booking not found.</p>
      </div>
    );
  }

  const { booking, tickets } = data;

  return (
    <div className="min-h-[80vh] bg-slate-950 text-slate-100 p-8">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg bg-green-950 px-4 py-3 text-green-300">
          Booking confirmed! Your tickets are below.
        </div>

        <div className="mt-6">
          <h1 className="text-xl font-semibold">{booking.event.name}</h1>
          <p className="text-slate-400">
            {new Date(booking.event.date).toLocaleString()} · {booking.event.venue}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Booking ID: {booking._id} · Total paid: ₹{booking.totalAmount}
          </p>
        </div>

        <div className="mt-6 space-y-4">
          {tickets.map((ticket) => (
            <div
              key={ticket._id}
              className="flex items-center gap-4 rounded-lg bg-slate-900 p-4"
            >
              <img
                src={ticket.qrCodeDataUrl}
                alt={`QR code for ticket ${ticket._id}`}
                className="h-24 w-24 rounded-md bg-white p-1"
              />
              <div>
                <p className="font-medium">
                  Seat {ticket.seat?.label} · {ticket.tierName}
                </p>
                <p className="text-sm text-slate-400">₹{ticket.price}</p>
                <p className="mt-1 text-xs text-slate-600">
                  Show this QR code at check-in
                </p>
              </div>
            </div>
          ))}
        </div>

        <Link
          to="/attendee"
          className="mt-6 inline-block text-indigo-400 hover:underline"
        >
          Go to My Tickets
        </Link>
      </div>
    </div>
  );
};

export default Confirmation;
