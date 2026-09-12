import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchEventById } from "../api/events";
import { checkInTicket, fetchCheckinStats } from "../api/checkin";
import { toast } from "../store/toastStore";
import socket from "../lib/socket";
import QrScanner from "../components/QrScanner";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import { inputClasses, labelClasses } from "../components/ui/formClasses";

const CheckIn = () => {
  const { id: eventId } = useParams();
  const [scannerActive, setScannerActive] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [counts, setCounts] = useState({ checkedInCount: 0, totalTickets: 0 });
  const [recent, setRecent] = useState([]);

  const { data: event } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => fetchEventById(eventId),
  });

  useEffect(() => {
    fetchCheckinStats(eventId).then(setCounts).catch(() => {});
  }, [eventId]);

  // Real-time count - stays in sync even if check-ins happen from another
  // device/tab scanning the same event concurrently.
  useEffect(() => {
    socket.emit("join-event", eventId);
    const handleUpdate = (payload) => setCounts(payload);
    socket.on("checkin:update", handleUpdate);
    return () => {
      socket.emit("leave-event", eventId);
      socket.off("checkin:update", handleUpdate);
    };
  }, [eventId]);

  const submitToken = async (token) => {
    if (!token || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const result = await checkInTicket(eventId, token);
      setCounts({ checkedInCount: result.checkedInCount, totalTickets: result.totalTickets });
      setRecent((prev) => [
        {
          id: result.ticket._id,
          name: result.ticket.user?.name,
          seat: result.ticket.seat?.label,
          tier: result.ticket.tierName,
          time: new Date(),
        },
        ...prev,
      ]);
      toast.success(`Checked in: ${result.ticket.user?.name || "Attendee"}`);
      setManualToken("");
    } catch (err) {
      const message = err.response?.data?.message || "Check-in failed";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    submitToken(manualToken.trim());
  };

  return (
    <div className="page-container py-8 sm:py-10">
      <Link to={`/organizer/events/${eventId}/dashboard`} className="text-sm font-medium text-accent hover:underline">
        ← Back to Event Dashboard
      </Link>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
        Check-In {event?.name ? `- ${event.name}` : ""}
      </h1>

      <div className="mt-4 flex items-center gap-3">
        <Badge variant="success">{counts.checkedInCount} checked in</Badge>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          of {counts.totalTickets} tickets
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="section-heading">Scan QR Code</h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setScannerActive((a) => !a)}
            >
              {scannerActive ? "Stop Camera" : "Start Camera"}
            </Button>
          </div>
          <div className="mt-3">
            <QrScanner active={scannerActive} onScan={submitToken} />
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="section-heading">Manual Entry</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
            Paste the ticket's QR token if the camera isn't available.
          </p>
          <form onSubmit={handleManualSubmit} className="mt-3 space-y-3">
            {error && <Alert variant="error">{error}</Alert>}
            <div>
              <label className={labelClasses}>QR Token</label>
              <textarea
                rows={3}
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                className={`${inputClasses} font-mono text-xs`}
                placeholder="eyJhbGciOi..."
              />
            </div>
            <Button type="submit" loading={submitting} className="w-full">
              {submitting ? "Checking in..." : "Check In"}
            </Button>
          </form>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="section-heading mb-3">Recent Check-Ins</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-500">
            No check-ins yet this session.
          </p>
        ) : (
          <div className="space-y-2">
            {recent.map((r) => (
              <Card key={`${r.id}-${r.time.getTime()}`} className="flex items-center justify-between p-3 text-sm">
                <span className="font-medium text-slate-900 dark:text-slate-100">{r.name}</span>
                <span className="text-slate-500 dark:text-slate-400">
                  Seat {r.seat} · {r.tier}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-500">
                  {r.time.toLocaleTimeString()}
                </span>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckIn;
