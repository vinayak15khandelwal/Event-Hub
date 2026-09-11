import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchEventById } from "../api/events";
import { fetchEventAnalytics, fetchEventAttendees, downloadAttendeesCsv } from "../api/dashboard";
import { fetchAnnouncements, sendAnnouncement } from "../api/announcements";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import RevenueChart from "../components/RevenueChart";
import { inputClasses, labelClasses } from "../components/ui/formClasses";

const StatCard = ({ label, value }) => (
  <Card className="p-4">
    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
      {label}
    </p>
    <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
      {value}
    </p>
  </Card>
);

const OrganizerEventDashboard = () => {
  const { id: eventId } = useParams();
  const queryClient = useQueryClient();
  const [announcementForm, setAnnouncementForm] = useState({ subject: "", message: "" });
  const [downloading, setDownloading] = useState(false);

  const { data: event } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => fetchEventById(eventId),
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["event-analytics", eventId],
    queryFn: () => fetchEventAnalytics(eventId),
  });

  const { data: attendees, isLoading: attendeesLoading } = useQuery({
    queryKey: ["event-attendees", eventId],
    queryFn: () => fetchEventAttendees(eventId),
  });

  const { data: announcements } = useQuery({
    queryKey: ["announcements", eventId],
    queryFn: () => fetchAnnouncements(eventId),
  });

  const announcementMutation = useMutation({
    mutationFn: (payload) => sendAnnouncement(eventId, payload),
    onSuccess: () => {
      setAnnouncementForm({ subject: "", message: "" });
      queryClient.invalidateQueries({ queryKey: ["announcements", eventId] });
    },
  });

  const handleExport = async () => {
    setDownloading(true);
    try {
      await downloadAttendeesCsv(eventId, event?.name);
    } finally {
      setDownloading(false);
    }
  };

  const handleSendAnnouncement = (e) => {
    e.preventDefault();
    announcementMutation.mutate(announcementForm);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link
        to="/organizer"
        className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
      >
        ← Back to My Events
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
        {event?.name || "Event Dashboard"}
      </h1>

      {/* Analytics */}
      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Analytics
        </h2>
        {analyticsLoading ? (
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Spinner /> <span>Loading analytics...</span>
          </div>
        ) : (
          analytics && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Total Revenue" value={`₹${analytics.totalRevenue}`} />
                <StatCard label="Tickets Sold" value={`${analytics.ticketsSold}/${analytics.capacity}`} />
                <StatCard label="Sold %" value={`${analytics.soldPercentage}%`} />
                <StatCard label="Bookings" value={analytics.bookingsCount} />
              </div>

              <Card className="mt-4 p-5">
                <h3 className="mb-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Revenue by Tier
                </h3>
                <RevenueChart revenueByTier={analytics.revenueByTier} />
              </Card>
            </>
          )
        )}
      </section>

      {/* Attendee roster */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Attendee Roster
          </h2>
          {attendees && attendees.length > 0 && (
            <Button
              variant="secondary"
              onClick={handleExport}
              disabled={downloading}
              className="px-3 py-1.5 text-xs"
            >
              {downloading ? "Preparing CSV..." : "Export CSV"}
            </Button>
          )}
        </div>

        {attendeesLoading && (
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Spinner /> <span>Loading attendees...</span>
          </div>
        )}

        {attendees && attendees.length === 0 && (
          <EmptyState title="No bookings yet" description="Attendees will appear here once tickets are sold." />
        )}

        {attendees && attendees.length > 0 && (
          <Card className="overflow-x-auto p-0">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Seat</th>
                  <th className="px-4 py-3 font-medium">Tier</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {attendees.map((a, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 text-slate-900 dark:text-slate-100">{a.name}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{a.email}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{a.seatLabel}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{a.tierName}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">₹{a.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>

      {/* Announcements */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Send Announcement
        </h2>
        <Card className="p-5">
          <form onSubmit={handleSendAnnouncement} className="space-y-3">
            {announcementMutation.isSuccess && (
              <Alert variant="success">Announcement sent to all attendees.</Alert>
            )}
            {announcementMutation.isError && (
              <Alert variant="error">
                {announcementMutation.error?.response?.data?.message || "Failed to send"}
              </Alert>
            )}
            <div>
              <label className={labelClasses}>Subject</label>
              <input
                required
                value={announcementForm.subject}
                onChange={(e) =>
                  setAnnouncementForm({ ...announcementForm, subject: e.target.value })
                }
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>Message</label>
              <textarea
                required
                rows={3}
                value={announcementForm.message}
                onChange={(e) =>
                  setAnnouncementForm({ ...announcementForm, message: e.target.value })
                }
                className={inputClasses}
              />
            </div>
            <Button type="submit" disabled={announcementMutation.isPending}>
              {announcementMutation.isPending ? "Sending..." : "Send to Attendees"}
            </Button>
          </form>
        </Card>

        {announcements && announcements.length > 0 && (
          <div className="mt-4 space-y-2">
            {announcements.map((a) => (
              <Card key={a._id} className="p-4">
                <p className="font-medium text-slate-900 dark:text-slate-100">{a.subject}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{a.message}</p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-600">
                  {new Date(a.createdAt).toLocaleString()}
                </p>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default OrganizerEventDashboard;
