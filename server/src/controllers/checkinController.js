import asyncHandler from "express-async-handler";
import Event from "../models/Event.js";
import Ticket from "../models/Ticket.js";
import { verifyTicketToken } from "../utils/qrToken.js";
import { assertIsOwner } from "./eventController.js";
import { getIO } from "../socket.js";

const loadOwnedEvent = async (eventId, userId) => {
  const event = await Event.findById(eventId);
  if (!event) {
    const err = new Error("Event not found");
    err.statusCode = 404;
    throw err;
  }
  assertIsOwner(event, userId); // throws 403 if not the owning organizer
  return event;
};

const getCounts = async (eventId) => {
  const [checkedInCount, totalTickets] = await Promise.all([
    Ticket.countDocuments({ event: eventId, status: "checked-in" }),
    Ticket.countDocuments({ event: eventId, status: { $ne: "cancelled" } }),
  ]);
  return { checkedInCount, totalTickets };
};

// @desc   Check a ticket in by its signed QR token (scanned or manually pasted)
// @route  POST /api/events/:eventId/checkin
// @access Private (organizer only, must own the event)
export const checkInTicket = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { token } = req.body;

  await loadOwnedEvent(eventId, req.user._id);

  if (!token) {
    res.status(400);
    throw new Error("A QR token is required");
  }

  // Verifying the signature is what actually authenticates this ticket -
  // the token can't be forged, replayed as a different ticket, or edited
  // (e.g. to point at a different event) without invalidating the signature.
  let decoded;
  try {
    decoded = verifyTicketToken(token);
  } catch (err) {
    // Safe diagnostics only - never log the secret or the full token.
    console.warn("[checkin] token verification failed:", {
      eventId,
      tokenPresent: Boolean(token),
      tokenLength: token?.length,
      errorName: err.name,
    });
    res.status(400);
    if (err.name === "TokenExpiredError") {
      throw new Error("This QR code has expired");
    }
    // Covers JsonWebTokenError (malformed, wrong secret, bad signature) and
    // anything else jwt.verify can throw - these are genuinely different
    // problems from expiry (e.g. pasting something that isn't a token at
    // all), so they shouldn't be reported as "expired".
    throw new Error(
      "Invalid QR code - it doesn't match a real ticket token (not expiry-related)"
    );
  }

  if (decoded.eventId !== eventId) {
    console.warn("[checkin] event mismatch:", {
      routeEventId: eventId,
      decodedEventId: decoded.eventId,
      ticketId: decoded.ticketId,
    });
    res.status(400);
    throw new Error("This ticket belongs to a different event");
  }

  const ticket = await Ticket.findById(decoded.ticketId)
    .populate("user", "name email")
    .populate("seat", "label tierName");

  if (!ticket || ticket.event.toString() !== eventId) {
    console.warn("[checkin] ticket not found for event:", {
      eventId,
      ticketId: decoded.ticketId,
      ticketFound: Boolean(ticket),
    });
    res.status(404);
    throw new Error("Ticket not found for this event");
  }

  if (ticket.status === "cancelled") {
    res.status(400);
    throw new Error("This ticket has been cancelled");
  }

  if (ticket.status === "checked-in") {
    res.status(409);
    throw new Error(
      `Already checked in at ${ticket.checkedInAt.toLocaleString()}`
    );
  }

  ticket.status = "checked-in";
  ticket.checkedInAt = new Date();
  await ticket.save();

  const counts = await getCounts(eventId);

  // Real-time attendee count update, scoped to this event's room only -
  // same pattern as seat availability and announcements.
  const io = getIO();
  if (io) {
    io.to(`event:${eventId}`).emit("checkin:update", counts);
  }

  res.json({ success: true, ticket, ...counts });
});

// @desc   Current check-in counts for an event
// @route  GET /api/events/:eventId/checkin/stats
// @access Private (organizer only, must own the event)
export const getCheckinStats = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  await loadOwnedEvent(eventId, req.user._id);
  const counts = await getCounts(eventId);
  res.json({ success: true, ...counts });
});
