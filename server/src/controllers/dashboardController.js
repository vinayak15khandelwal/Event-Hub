import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import Event from "../models/Event.js";
import Booking from "../models/Booking.js";
import Ticket from "../models/Ticket.js";
import { assertIsOwner } from "./eventController.js";

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

// @desc   Revenue + sold-percentage analytics for an event
// @route  GET /api/events/:eventId/dashboard/analytics
// @access Private (organizer only, must own the event)
export const getEventAnalytics = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const event = await loadOwnedEvent(eventId, req.user._id);

  // Computed fresh from the Ticket collection (the actual source of truth),
  // not read off the event's cached ticketsSold counter - this is the
  // number an organizer is trusting to be correct.
  const byTier = await Ticket.aggregate([
    { $match: { event: new mongoose.Types.ObjectId(eventId) } },
    { $group: { _id: "$tierName", revenue: { $sum: "$price" }, ticketsSold: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  const totalRevenue = byTier.reduce((sum, t) => sum + t.revenue, 0);
  const ticketsSold = byTier.reduce((sum, t) => sum + t.ticketsSold, 0);
  const soldPercentage =
    event.capacity > 0 ? Math.round((ticketsSold / event.capacity) * 100) : 0;

  const bookingsCount = await Booking.countDocuments({
    event: eventId,
    status: "confirmed",
  });

  res.json({
    success: true,
    analytics: {
      capacity: event.capacity,
      ticketsSold,
      soldPercentage,
      totalRevenue,
      bookingsCount,
      revenueByTier: byTier.map((t) => ({
        tierName: t._id,
        revenue: t.revenue,
        ticketsSold: t.ticketsSold,
      })),
    },
  });
});

const escapeCsvField = (value) => {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
};

const toCsv = (rows) => {
  const header = ["Name", "Email", "Seat", "Tier", "Price", "Booked At"];
  const lines = [header.join(",")];
  rows.forEach((r) => {
    lines.push(
      [r.name, r.email, r.seatLabel, r.tierName, r.price, r.bookedAt]
        .map(escapeCsvField)
        .join(",")
    );
  });
  return lines.join("\n");
};

// @desc   Attendee roster for an event - JSON by default, CSV with ?format=csv
// @route  GET /api/events/:eventId/dashboard/attendees
// @access Private (organizer only, must own the event)
export const getEventAttendees = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const event = await loadOwnedEvent(eventId, req.user._id);

  const tickets = await Ticket.find({ event: eventId })
    .populate("user", "name email")
    .populate("seat", "label")
    .sort({ createdAt: 1 });

  const rows = tickets.map((t) => ({
    name: t.user?.name || "",
    email: t.user?.email || "",
    seatLabel: t.seat?.label || "",
    tierName: t.tierName,
    price: t.price,
    status: t.status,
    bookedAt: t.createdAt.toISOString(),
  }));

  if (req.query.format === "csv") {
    const csv = toCsv(rows);
    const filename = `${event.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-attendees.csv`;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(csv);
  }

  res.json({ success: true, attendees: rows });
});
