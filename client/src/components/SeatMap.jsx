import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchSeats, holdSeat as holdSeatApi, releaseSeat as releaseSeatApi } from "../api/events";
import socket from "../lib/socket";
import useAuthStore from "../store/authStore";
import { toast } from "../store/toastStore";
import Alert from "./ui/Alert";
import Spinner from "./ui/Spinner";

const statusStyles = {
  available:
    "bg-slate-200 hover:bg-slate-300 hover:scale-105 text-slate-700 cursor-pointer dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300",
  heldByMe: "bg-brand-600 text-white cursor-pointer shadow-glow scale-105",
  heldByOther:
    "bg-amber-300/70 text-amber-900 cursor-not-allowed dark:bg-amber-700/60 dark:text-amber-100",
  booked:
    "bg-rose-300/60 text-rose-900 cursor-not-allowed opacity-80 dark:bg-rose-950 dark:text-rose-300",
  dimmed: "opacity-20 pointer-events-none",
};

const legendItems = [
  { key: "available", label: "Available", dot: "bg-slate-300 dark:bg-slate-700" },
  { key: "heldByMe", label: "Your hold", dot: "bg-brand-600" },
  { key: "heldByOther", label: "Held by someone else", dot: "bg-amber-400 dark:bg-amber-600" },
  { key: "booked", label: "Booked", dot: "bg-rose-400 dark:bg-rose-800" },
];

const SeatMap = ({ eventId, onHeldSeatsChange, onTierSummaryChange, tierFilter }) => {
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [seatsById, setSeatsById] = useState({});
  const [now, setNow] = useState(Date.now());
  const [actionError, setActionError] = useState("");
  const [pendingSeatId, setPendingSeatId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["seats", eventId],
    queryFn: () => fetchSeats(eventId),
  });

  // Seed local live-state from the initial fetch
  useEffect(() => {
    if (data?.seats) {
      const map = {};
      data.seats.forEach((s) => (map[s._id] = s));
      setSeatsById(map);
    }
  }, [data]);

  // Join/leave the per-event Socket.io room - server never broadcasts globally
  useEffect(() => {
    socket.emit("join-event", eventId);
    const handleUpdate = (payload) => {
      setSeatsById((prev) => {
        const next = { ...prev };
        payload.seats.forEach((update) => {
          if (next[update.seatId]) {
            next[update.seatId] = { ...next[update.seatId], ...update };
          }
        });
        return next;
      });
    };
    socket.on("seat:update", handleUpdate);

    return () => {
      socket.emit("leave-event", eventId);
      socket.off("seat:update", handleUpdate);
    };
  }, [eventId]);

  // Tick every second so hold countdowns visibly count down
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const seats = useMemo(() => Object.values(seatsById), [seatsById]);
  const seatsPerRow = data?.meta?.seatsPerRow || 10;
  const availableCount = seats.filter((s) => s.status === "available").length;

  const seatStatusFor = (seat) => {
    if (seat.status === "booked") return "booked";
    if (seat.status === "held") {
      return seat.heldBy === user?.id ? "heldByMe" : "heldByOther";
    }
    return "available";
  };

  const myHeldSeats = seats.filter(
    (s) => s.status === "held" && s.heldBy === user?.id
  );

  useEffect(() => {
    onHeldSeatsChange?.(myHeldSeats);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(myHeldSeats.map((s) => s._id))]);

  // Recomputed live from the seats we hold locally, so a hold/release/expiry
  // updates the tier cards on EventDetails without a second network call.
  useEffect(() => {
    if (!data?.meta?.tierSummary) return;
    const live = data.meta.tierSummary.map((tier) => {
      const tierSeats = seats.filter((s) => s.tierName === tier.name);
      return {
        ...tier,
        available: tierSeats.filter((s) => s.status === "available").length,
        held: tierSeats.filter((s) => s.status === "held").length,
        booked: tierSeats.filter((s) => s.status === "booked").length,
      };
    });
    onTierSummaryChange?.(live);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, JSON.stringify(seats.map((s) => `${s._id}:${s.status}`))]);

  const handleSeatClick = async (seat) => {
    setActionError("");
    if (!isAuthenticated) {
      setActionError("Log in as an attendee to select a seat.");
      return;
    }
    const displayStatus = seatStatusFor(seat);
    if (displayStatus === "heldByOther" || displayStatus === "booked") return;

    setPendingSeatId(seat._id);
    try {
      if (displayStatus === "available") {
        const updated = await holdSeatApi(eventId, seat._id);
        setSeatsById((prev) => ({ ...prev, [seat._id]: updated }));
      } else if (displayStatus === "heldByMe") {
        const updated = await releaseSeatApi(eventId, seat._id);
        setSeatsById((prev) => ({ ...prev, [seat._id]: updated }));
        toast.info(`Seat ${seat.label} released`);
      }
    } catch (err) {
      setActionError(err.response?.data?.message || "That didn't go through - try again.");
      queryClient.invalidateQueries({ queryKey: ["seats", eventId] });
    } finally {
      setPendingSeatId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
        <Spinner /> <span>Loading seat map...</span>
      </div>
    );
  }

  if (seats.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-500">
        No seats are available for this event.
      </p>
    );
  }

  return (
    <div>
      {actionError && (
        <Alert variant="error" className="mb-3">
          {actionError}
        </Alert>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
          {legendItems.map((item) => (
            <span key={item.key} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${item.dot}`} /> {item.label}
            </span>
          ))}
        </div>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {availableCount} of {seats.length} seats available
        </span>
      </div>

      <div
        className="grid gap-1.5 overflow-x-auto"
        style={{ gridTemplateColumns: `repeat(${seatsPerRow}, minmax(2rem, 1fr))` }}
      >
        {seats
          .sort((a, b) => a.row - b.row || a.col - b.col)
          .map((seat) => {
            const displayStatus = seatStatusFor(seat);
            const isDimmed = tierFilter && seat.tierName !== tierFilter;
            const secondsLeft =
              displayStatus === "heldByMe" && seat.holdExpiresAt
                ? Math.max(0, Math.ceil((new Date(seat.holdExpiresAt) - now) / 1000))
                : null;

            return (
              <button
                key={seat._id}
                type="button"
                title={`${seat.label} - ${seat.tierName}`}
                disabled={pendingSeatId === seat._id}
                onClick={() => handleSeatClick(seat)}
                className={`relative flex h-9 w-full items-center justify-center rounded-md text-[10px] font-medium transition-all duration-150 disabled:opacity-50 ${statusStyles[displayStatus]} ${
                  isDimmed ? statusStyles.dimmed : ""
                }`}
              >
                {secondsLeft !== null ? `${secondsLeft}s` : seat.col + 1}
              </button>
            );
          })}
      </div>

      {myHeldSeats.length > 0 && (
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
          Holding {myHeldSeats.length} seat{myHeldSeats.length > 1 ? "s" : ""} -
          complete your booking before the timer runs out.
        </p>
      )}
    </div>
  );
};

export default SeatMap;
