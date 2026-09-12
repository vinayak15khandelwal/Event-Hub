import api from "./axios";

export const createBooking = async ({ eventId, seatIds }) => {
  const res = await api.post("/bookings", { eventId, seatIds });
  return res.data; // { booking, tickets }
};

export const fetchMyBookings = async () => {
  const res = await api.get("/bookings/mine");
  return res.data.bookings;
};

export const fetchBookingById = async (id) => {
  const res = await api.get(`/bookings/${id}`);
  return res.data; // { booking, tickets }
};

export const cancelBooking = async (id) => {
  const res = await api.post(`/bookings/${id}/cancel`);
  return res.data.booking;
};
