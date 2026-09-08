import asyncHandler from "express-async-handler";
import Seat from "../models/Seat.js";
import { SEATS_PER_ROW } from "../utils/generateSeats.js";
import { getIO } from "../socket.js";

const HOLD_DURATION_MS = 2 * 60 * 1000; // 2 minutes, per the brief's constraint

// @desc   List all seats for an event (for rendering the seating chart)
// @route  GET /api/events/:eventId/seats
// @access Public
export const getSeatsForEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const seats = await Seat.find({ event: eventId }).sort({ row: 1, col: 1 });
  res.json({ success: true, seats, meta: { seatsPerRow: SEATS_PER_ROW } });
});

// @desc   Hold a seat for 2 minutes
// @route  POST /api/events/:eventId/seats/:seatId/hold
// @access Private (attendee only)
export const holdSeat = asyncHandler(async (req, res) => {
  const { eventId, seatId } = req.params;

  // Atomic conditional update: only succeeds if the seat is still
  // "available" at the moment MongoDB applies the write. This is a
  // single-document operation, which MongoDB already guarantees is
  // atomic - no multi-document transaction is needed here (that's
  // reserved for Day 5's booking commit, which touches seat + ticket +
  // event counters together).
  const seat = await Seat.findOneAndUpdate(
    { _id: seatId, event: eventId, status: "available" },
    {
      status: "held",
      heldBy: req.user._id,
      holdExpiresAt: new Date(Date.now() + HOLD_DURATION_MS),
    },
    { new: true }
  );

  if (!seat) {
    res.status(409);
    throw new Error("This seat is no longer available");
  }

  const io = getIO();
  if (io) {
    io.to(`event:${eventId}`).emit("seat:update", {
      seats: [
        { seatId: seat._id, status: seat.status, holdExpiresAt: seat.holdExpiresAt },
      ],
    });
  }

  res.json({ success: true, seat });
});

// @desc   Voluntarily release a held seat before it expires
// @route  POST /api/events/:eventId/seats/:seatId/release
// @access Private (attendee only, must hold it themselves)
export const releaseSeat = asyncHandler(async (req, res) => {
  const { eventId, seatId } = req.params;

  const seat = await Seat.findOneAndUpdate(
    { _id: seatId, event: eventId, status: "held", heldBy: req.user._id },
    { status: "available", heldBy: null, holdExpiresAt: null },
    { new: true }
  );

  if (!seat) {
    res.status(400);
    throw new Error("You don't have an active hold on this seat");
  }

  const io = getIO();
  if (io) {
    io.to(`event:${eventId}`).emit("seat:update", {
      seats: [{ seatId: seat._id, status: "available", holdExpiresAt: null }],
    });
  }

  res.json({ success: true, seat });
});
