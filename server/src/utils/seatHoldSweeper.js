import Seat from "../models/Seat.js";
import { getIO } from "../socket.js";

const SWEEP_INTERVAL_MS = 15 * 1000;

// One sweep pass. Exported standalone (not only wrapped in setInterval) so
// tests can invoke it directly and deterministically, instead of waiting on
// a real 2-minute timer or racing the interval.
export const expireStaleHolds = async () => {
  const expiredSeats = await Seat.find({
    status: "held",
    holdExpiresAt: { $lte: new Date() },
  });

  if (expiredSeats.length === 0) return [];

  const seatIds = expiredSeats.map((s) => s._id);
  await Seat.updateMany(
    { _id: { $in: seatIds } },
    { status: "available", heldBy: null, holdExpiresAt: null }
  );

  // Group by event so each room gets one batched emit, not one per seat
  const byEvent = {};
  expiredSeats.forEach((seat) => {
    const key = seat.event.toString();
    if (!byEvent[key]) byEvent[key] = [];
    byEvent[key].push(seat._id.toString());
  });

  const io = getIO();
  if (io) {
    Object.entries(byEvent).forEach(([eventId, ids]) => {
      io.to(`event:${eventId}`).emit("seat:update", {
        seats: ids.map((id) => ({
          seatId: id,
          status: "available",
          holdExpiresAt: null,
        })),
      });
    });
  }

  return Object.keys(byEvent);
};

export const startSeatHoldSweeper = () => {
  return setInterval(() => {
    expireStaleHolds().catch((err) =>
      console.error("Seat hold sweeper error:", err.message)
    );
  }, SWEEP_INTERVAL_MS);
};
