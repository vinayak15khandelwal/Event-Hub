import api from "./axios";

export const checkInTicket = async (eventId, token) => {
  const res = await api.post(`/events/${eventId}/checkin`, { token });
  return res.data; // { ticket, checkedInCount, totalTickets }
};

export const fetchCheckinStats = async (eventId) => {
  const res = await api.get(`/events/${eventId}/checkin/stats`);
  return res.data; // { checkedInCount, totalTickets }
};
