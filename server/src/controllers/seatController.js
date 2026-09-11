import asyncHandler from "express-async-handler";
import Seat from "../models/Seat.js";
import Event from "../models/Event.js";
import { SEATS_PER_ROW } from "../utils/generateSeats.js";
import { getIO } from "../socket.js";

const HOLD_DURATION_MS = 2 * 60 * 1000; // 2 minutes, per the brief's constraint

// @desc   List all seats for an event, plus a per-tier availability summary
// @route  GET /api/events/:eventId/seats
// @access Public
export const getSeatsForEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  const [event, seats] = await Promise.all([
    Event.findById(eventId).select("priceTiers"),
    Seat.find({ event: eventId }).sort({ row: 1, col: 1 }),
  ]);

  if (!event) {
    res.status(404);
    throw new Error("Event not found");
  }

  // Per-tier counts, derived from the real Seat documents (never hardcoded
  // or trusted from the client) - this is what the attendee-facing price
  // tier cards render from.
  const tierSummary = event.priceTiers.map((tier) => {
    const tierSeats = seats.filter((s) => s.tierName === tier.name);
    return {
      name: tier.name,
      price: tier.price,
      quantity: tier.quantity,
      available: tierSeats.filter((s) => s.status === "available").length,
      held: tierSeats.filter((s) => s.status === "held").length,
      booked: tierSeats.filter((s) => s.status === "booked").length,
    };
  });

  res.json({
    success: true,
    seats,
    meta: { seatsPerRow: SEATS_PER_ROW, tierSummary },
  });
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
