import api from "./axios";

export const fetchAnnouncements = async (eventId) => {
  const res = await api.get(`/events/${eventId}/announcements`);
  return res.data.announcements;
};

export const sendAnnouncement = async (eventId, { subject, message }) => {
  const res = await api.post(`/events/${eventId}/announcements`, { subject, message });
  return res.data.announcement;
};
