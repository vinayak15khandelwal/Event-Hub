import api from "./axios";

export const fetchEventAnalytics = async (eventId) => {
  const res = await api.get(`/events/${eventId}/dashboard/analytics`);
  return res.data.analytics;
};

export const fetchEventAttendees = async (eventId) => {
  const res = await api.get(`/events/${eventId}/dashboard/attendees`);
  return res.data.attendees;
};

// Triggers a real browser file download using the same authenticated axios
// instance (httpOnly cookie), rather than a plain <a href> to the API -
// this keeps the request auth-consistent and works regardless of CORS/cookie
// domain quirks between the client and API origins.
export const downloadAttendeesCsv = async (eventId, eventName) => {
  const res = await api.get(`/events/${eventId}/dashboard/attendees`, {
    params: { format: "csv" },
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = url;
  const filename = `${(eventName || "event").replace(/[^a-z0-9]/gi, "-").toLowerCase()}-attendees.csv`;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
