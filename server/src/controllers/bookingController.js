import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import Event from "../models/Event.js";
import Seat from "../models/Seat.js";
import Booking from "../models/Booking.js";
import Ticket from "../models/Ticket.js";
import { signTicketToken } from "../utils/qrToken.js";
import { generateQrDataUrl } from "../utils/generateQrCode.js";
import { getIO } from "../socket.js";

// @desc   Book the attendee's currently-held seats (includes a mock payment step)
// @route  POST /api/bookings
// @access Private (attendee only)
export const createBooking = asyncHandler(async (req, res) => {
  const { eventId, seatIds } = req.body;

  if (!eventId || !Array.isArray(seatIds) || seatIds.length === 0) {
    res.status(400);
    throw new Error("eventId and a non-empty seatIds array are required");
  }

  const event = await Event.findById(eventId);
  if (!event) {
    res.status(404);
    throw new Error("Event not found");
  }

  // This is the one place in the app that genuinely needs a multi-document
  // transaction: a booking touches Seat (hold -> booked), Booking, Ticket,
  // and Event.ticketsSold together. If any step fails - a seat's hold
  // expired mid-checkout, a duplicate request races itself - everything
  // rolls back atomically instead of leaving a half-booked, double-sold seat.
  const session = await mongoose.startSession();
  let booking;
  let tickets = [];

  try {
    await session.withTransaction(async () => {
      // Step 1: atomically flip each held-by-me seat to booked. A single
      // failed match (already booked, hold expired, held by someone else)
      // aborts the whole transaction.
      const bookedSeats = [];
      for (const seatId of seatIds) {
        const seat = await Seat.findOneAndUpdate(
          { _id: seatId, event: eventId, status: "held", heldBy: req.user._id },
          { status: "booked", heldBy: null, holdExpiresAt: null },
          { new: true, session }
        );
        if (!seat) {
          const err = new Error(
            "One or more selected seats are no longer held by you - they may have expired. Please reselect and try again."
          );
          err.statusCode = 409;
          throw err;
        }
        bookedSeats.push(seat);
      }

      // Step 2: price from each seat's tier
      const totalAmount = bookedSeats.reduce((sum, seat) => {
        const tier = event.priceTiers.find((t) => t.name === seat.tierName);
        return sum + (tier ? tier.price : 0);
      }, 0);

      // Step 3: the booking record
      const [createdBooking] = await Booking.create(
        [
          {
            user: req.user._id,
            event: eventId,
            seats: bookedSeats.map((s) => s._id),
            totalAmount,
          },
        ],
        { session }
      );
      booking = createdBooking;

      // Step 4: one ticket per seat, each with its own signed QR token.
      // Ticket _id is generated up front so it can be embedded in the
      // signed token before the document is inserted.
      const ticketDocs = [];
      for (const seat of bookedSeats) {
        const ticketId = new mongoose.Types.ObjectId();
        const tier = event.priceTiers.find((t) => t.name === seat.tierName);
        const qrToken = signTicketToken(ticketId, eventId);
        const qrCodeDataUrl = await generateQrDataUrl(qrToken);

        ticketDocs.push({
          _id: ticketId,
          booking: booking._id,
          event: eventId,
          seat: seat._id,
          user: req.user._id,
          tierName: seat.tierName,
          price: tier ? tier.price : 0,
          qrToken,
          qrCodeDataUrl,
        });
      }
      tickets = await Ticket.create(ticketDocs, { session });

      // Step 5: keep the event's fast-read counter (used by listing cards)
      // in sync with the source of truth (actual Seat statuses)
      await Event.findByIdAndUpdate(
        eventId,
        { $inc: { ticketsSold: bookedSeats.length } },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  // Real-time: everyone else currently viewing this event's seat map should
  // see these seats flip straight to "booked" (not just disappear from held)
  const io = getIO();
  if (io) {
    io.to(`event:${eventId}`).emit("seat:update", {
      seats: seatIds.map((seatId) => ({
        seatId,
        status: "booked",
        holdExpiresAt: null,
      })),
    });
  }

  res.status(201).json({ success: true, booking, tickets });
});

// @desc   List the authenticated attendee's own bookings
// @route  GET /api/bookings/mine
// @access Private (attendee only)
export const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate("event", "name date venue");
  res.json({ success: true, bookings });
});

// @desc   Get one booking with its tickets (for the confirmation page)
// @route  GET /api/bookings/:id
// @access Private (owner only)
export const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate(
    "event",
    "name date venue"
  );

  if (!booking) {
    res.status(404);
    throw new Error("Booking not found");
  }

  if (booking.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You do not have access to this booking");
  }

  const tickets = await Ticket.find({ booking: booking._id }).populate(
    "seat",
    "label tierName row col"
  );

  res.json({ success: true, booking, tickets });
});
