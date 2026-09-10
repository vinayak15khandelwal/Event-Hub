import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchSeats, holdSeat as holdSeatApi, releaseSeat as releaseSeatApi } from "../api/events";
import socket from "../lib/socket";
import useAuthStore from "../store/authStore";

const statusStyles = {
  available: "bg-slate-800 hover:bg-slate-700 cursor-pointer",
  heldByMe: "bg-indigo-600 cursor-pointer",
  heldByOther: "bg-amber-700/60 cursor-not-allowed",
  booked: "bg-red-900/60 cursor-not-allowed",
};

const SeatMap = ({ eventId, onHeldSeatsChange }) => {
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
      // Someone else may have grabbed it first - resync from the server
      queryClient.invalidateQueries({ queryKey: ["seats", eventId] });
    } finally {
      setPendingSeatId(null);
    }
  };

  const myHeldSeats = seats.filter(
    (s) => s.status === "held" && s.heldBy === user?.id
  );

  useEffect(() => {
    onHeldSeatsChange?.(myHeldSeats);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(myHeldSeats.map((s) => s._id))]);

  if (isLoading) return <p className="text-slate-400">Loading seat map...</p>;

  return (
    <div>
      {actionError && (
        <p className="mb-3 rounded-md bg-red-950 px-3 py-2 text-sm text-red-300">
          {actionError}
        </p>
      )}

      <div className="mb-4 flex flex-wrap gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-slate-800" /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-indigo-600" /> Your hold
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-amber-700/60" /> Held by someone else
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-red-900/60" /> Booked
        </span>
      </div>

      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${seatsPerRow}, minmax(0, 1fr))` }}
      >
        {seats
          .sort((a, b) => a.row - b.row || a.col - b.col)
          .map((seat) => {
            const displayStatus = seatStatusFor(seat);
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
                className={`relative flex h-9 w-9 items-center justify-center rounded-md text-[10px] font-medium text-slate-100 transition-colors disabled:opacity-50 ${statusStyles[displayStatus]}`}
              >
                {secondsLeft !== null ? `${secondsLeft}s` : seat.col + 1}
              </button>
            );
          })}
      </div>

      {myHeldSeats.length > 0 && (
        <p className="mt-4 text-sm text-slate-400">
          Holding {myHeldSeats.length} seat{myHeldSeats.length > 1 ? "s" : ""} -
          complete your booking before the timer runs out.
        </p>
      )}
    </div>
  );
};

export default SeatMap;
