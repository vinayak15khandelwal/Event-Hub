import api from "./axios";

export const fetchEvents = async (params = {}) => {
  const res = await api.get("/events", { params });
  return res.data; // { events, pagination }
};

export const fetchEventById = async (id) => {
  const res = await api.get(`/events/${id}`);
  return res.data.event;
};

export const fetchMyEvents = async () => {
  const res = await api.get("/events/mine/list");
  return res.data.events;
};

export const createEvent = async (payload) => {
  const res = await api.post("/events", payload);
  return res.data.event;
};

export const updateEvent = async (id, payload) => {
  const res = await api.put(`/events/${id}`, payload);
  return res.data.event;
};

export const deleteEvent = async (id) => {
  const res = await api.delete(`/events/${id}`);
  return res.data;
};

export const fetchSeats = async (eventId) => {
  const res = await api.get(`/events/${eventId}/seats`);
  return res.data; // { seats, meta }
};

export const holdSeat = async (eventId, seatId) => {
  const res = await api.post(`/events/${eventId}/seats/${seatId}/hold`);
  return res.data.seat;
};

export const releaseSeat = async (eventId, seatId) => {
  const res = await api.post(`/events/${eventId}/seats/${seatId}/release`);
  return res.data.seat;
};
