import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchSeats, holdSeat as holdSeatApi, releaseSeat as releaseSeatApi } from "../api/events";
import socket from "../lib/socket";
import useAuthStore from "../store/authStore";
import Alert from "./ui/Alert";
import Spinner from "./ui/Spinner";

const statusStyles = {
  available:
    "bg-slate-200 hover:bg-slate-300 text-slate-700 cursor-pointer dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300",
  heldByMe: "bg-indigo-600 text-white cursor-pointer",
  heldByOther:
    "bg-amber-300/70 text-amber-900 cursor-not-allowed dark:bg-amber-700/60 dark:text-amber-100",
  booked:
    "bg-red-300/70 text-red-900 cursor-not-allowed dark:bg-red-900/60 dark:text-red-100",
  dimmed: "opacity-25 pointer-events-none",
};

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

      <div className="mb-4 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-slate-200 dark:bg-slate-800" /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-indigo-600" /> Your hold
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-amber-300/70 dark:bg-amber-700/60" /> Held by someone else
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-red-300/70 dark:bg-red-900/60" /> Booked
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
                className={`relative flex h-9 w-full items-center justify-center rounded-md text-[10px] font-medium transition-colors disabled:opacity-50 ${statusStyles[displayStatus]} ${
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
